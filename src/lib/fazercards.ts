import { adminDb } from '@/lib/firebaseAdmin';

export interface FazerTopupParams {
  orderId: string;
  category_id?: string;
  offer_id?: string;
  fields?: Record<string, any>;
}

export interface FazerSpecialPackageParams {
  orderId: string;
  playerUid?: string;
  playerRegion?: string;
  gameFields?: Record<string, any>;
}

/**
 * Places a top-up order on FazerCards and updates RTDB accordingly.
 */
export async function executeFazerTopup(params: FazerTopupParams) {
  const { orderId, fields: providedFields } = params;

  if (!orderId) {
    return { success: false, error: 'Missing orderId' };
  }

  // Fetch config from DB
  const settingsSnap = await adminDb.ref('settings/fazercards').get();
  const config = settingsSnap.val();
  const apiKey = config?.apiKey;
  const isEnabled = config?.enabled;

  if (!isEnabled) {
    return {
      success: false,
      error: 'Reseller automation is globally disabled.'
    };
  }

  if (!apiKey) {
    return { success: false, error: 'FazerCards API Key missing' };
  }

  const orderRef = adminDb.ref(`orders/${orderId}`);
  const orderSnap = await orderRef.get();
  const order = orderSnap.val();

  if (!order) {
    return { success: false, error: 'Order not found' };
  }

  // Block if already completed or processing
  if (order.autoTopupStatus === 'completed' || order.autoTopupStatus === 'processing') {
    return {
      success: false,
      error: 'Top-up already in progress or completed',
      alreadyProcessed: true
    };
  }

  const item = order.items?.[0] || {};
  let category_id = params.category_id || item.fazercardsCategory_id;
  let offer_id = params.offer_id || item.fazercardsOffer_id;

  // Fallback to looking up product in DB if category_id / offer_id not directly in order item
  if (!category_id || !offer_id) {
    const itemId = item.id || order.itemId || order.productId;
    if (itemId) {
      const prodSnap = await adminDb.ref(`products/${itemId}`).get();
      const prod = prodSnap.val();
      if (prod) {
        category_id = category_id || prod.fazercardsCategory_id;
        offer_id = offer_id || prod.fazercardsOffer_id;
      }
    }
  }

  if (!category_id || !offer_id) {
    return { success: false, error: 'Missing category_id or offer_id for topup' };
  }

  // STEP 1: Fetch required fields for this category from FazerCards API
  let requiredFieldKeys: string[] = [];
  try {
    const offersRes = await fetch(
      `https://api.fzr.cards/api/v2/topups/offers?category_id=${category_id}`,
      {
        headers: { 'X-API-Key': apiKey, 'Content-Type': 'application/json' }
      }
    );
    const offersData = await offersRes.json();
    const requiredFields = offersData.fields || [];
    requiredFieldKeys = requiredFields.map((f: any) => f.key);
  } catch (err: any) {
    console.error('Failed to fetch required fields for category:', err);
  }

  const multiplier = item.fazercardsMultiQuantity || 1;

  await orderRef.update({
    autoTopupStatus: 'processing',
    autoTopupBatchTotal: multiplier,
    autoTopupBatchCompleted: 0,
    autoTopupStartedAt: Date.now()
  });

  // STEP 2: Build fields object dynamically
  const sourceData = providedFields || order.gameDetails?.gameFields || order.gameFields || {};
  const fallbackData: any = {
    player_id: order.ffUid || order.gameDetails?.playerID || order.gameId,
    user_id: order.ffUid || order.gameDetails?.playerID || order.gameId,
    uid: order.ffUid || order.gameDetails?.playerID || order.gameId,
    region: order.ffRegion || order.gameDetails?.region || 'ME',
    server: order.ffRegion || order.gameDetails?.region || 'ME'
  };

  const finalFields: any = {};
  if (requiredFieldKeys.length > 0) {
    for (const key of requiredFieldKeys) {
      const val = sourceData[key] ?? fallbackData[key];
      if (val !== null && val !== undefined) {
        finalFields[key] = val.toString();
      }
    }
  } else {
    const playerId = order.ffUid || order.gameDetails?.playerID || order.gameId;
    if (playerId) {
      finalFields['player_id'] = playerId.toString();
    }
    Object.assign(finalFields, sourceData);
  }

  const results: string[] = [];
  const errors: string[] = [];

  for (let i = 0; i < multiplier; i++) {
    const partId = i + 1;
    if (i > 0) await new Promise(resolve => setTimeout(resolve, 2000));

    const idempotencyKey = `oskar-${orderId}-${partId}-${Date.now()}`;

    try {
      const res = await fetch('https://api.fzr.cards/api/v2/topups/order', {
        method: 'POST',
        headers: {
          'X-API-Key': apiKey,
          'Content-Type': 'application/json',
          'idempotency-key': idempotencyKey
        },
        body: JSON.stringify({ category_id, offer_id, fields: finalFields })
      });

      const data = await res.json();

      if (data.ok && data.order) {
        results.push(data.order.id);
        await orderRef.update({ autoTopupBatchCompleted: partId });
      } else {
        errors.push(`Part ${partId}: ${data.error || 'Failed'}`);
        break;
      }
    } catch (err: any) {
      errors.push(`Part ${partId}: ${err.message}`);
      break;
    }
  }

  if (results.length > 0) {
    const providerIdStr = results.join(', ');
    await orderRef.update({
      autoTopupStatus: 'processing',
      autoTopupOrderId: providerIdStr,
      fazercardsOrderId: providerIdStr,
      providerOrderId: providerIdStr,
      autoTopupError: errors.length > 0 ? errors.join('; ') : null
    });

    // Send Telegram processing notification
    const appUrl = process.env.NEXT_PUBLIC_APP_URL || 'https://oskarshop.so';
    fetch(`${appUrl}/api/notify-telegram`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        customerName: order.gameDetails?.playerName || order.userPhone || 'User',
        customerPhone: order.gameDetails?.whatsappNumber || order.userPhone,
        itemName: order.items?.[0]?.title || 'Item',
        amount: order.total,
        ffUid: order.ffUid,
        orderId: orderId,
        message: `⏳ Auto top-up PROCESSING — FazerCards IDs: ${providerIdStr}. Monitoring for delivery.`
      })
    }).catch(() => {});

    return {
      success: true,
      fazercardsOrderId: providerIdStr,
      status: 'processing',
      message: 'Order placed. Tracking started.'
    };
  } else {
    const errorMsg = errors.join('; ');
    await orderRef.update({
      autoTopupStatus: 'failed',
      autoTopupError: errorMsg,
      status: 'cancelled',
      cancellationReason: 'Automation failed to initiate: ' + errorMsg
    });
    return { success: false, error: errorMsg };
  }
}

/**
 * Places a sequential batch of top-up orders for a Special Package on FazerCards.
 */
export async function executeFazerSpecialPackage(params: FazerSpecialPackageParams) {
  const { orderId, playerUid, playerRegion, gameFields } = params;

  if (!orderId) {
    return { success: false, error: 'Missing orderId' };
  }

  // 1. Fetch Config and API Key from Database
  const settingsSnap = await adminDb.ref('settings/fazercards').get();
  const config = settingsSnap.val();
  const apiKey = config?.apiKey;
  const isEnabled = config?.enabled;

  if (!isEnabled || !apiKey) {
    return {
      success: false,
      error: 'FazerCards automation is disabled or API key missing'
    };
  }

  // 2. Load Order and Item Configuration
  const orderRef = adminDb.ref(`orders/${orderId}`);
  const orderSnap = await orderRef.get();
  const order = orderSnap.val();

  if (!order) return { success: false, error: 'Order not found' };

  const itemId = order.items?.[0]?.id || order.itemId || order.productId;
  const itemSnap = await adminDb.ref(`products/${itemId}`).get();
  const item = itemSnap.val();

  if (!item?.specialPackage?.offers?.length) {
    return { success: false, error: 'Item has no package offers configured' };
  }

  const offers = item.specialPackage.offers;

  // Prevent double delivery
  if (
    order.specialPackageDelivery?.overallStatus === 'completed' ||
    order.specialPackageDelivery?.overallStatus === 'processing'
  ) {
    return {
      success: false,
      error: 'Package already being processed',
      alreadyProcessed: true
    };
  }

  // 3. Initialize Delivery State for Admin Log
  const deliveryOffers: any = {};
  offers.forEach((offer: any) => {
    deliveryOffers[offer.id] = {
      category_id: offer.category_id,
      offer_id: offer.offer_id,
      offerName: offer.offerName,
      fazercardsOrderId: null,
      status: 'pending',
      placedAt: null,
      completedAt: null,
      error: null
    };
  });

  await orderRef.update({
    autoTopupStatus: 'processing',
    autoTopupStartedAt: Date.now(),
    specialPackageDelivery: {
      totalOffers: offers.length,
      completedOffers: 0,
      failedOffers: 0,
      offers: deliveryOffers,
      overallStatus: 'processing'
    }
  });

  const effectivePlayerUid =
    playerUid || order.ffUid || order.gameDetails?.playerID || order.gameId;
  const availableData: any = {
    player_id: effectivePlayerUid,
    user_id: effectivePlayerUid,
    uid: effectivePlayerUid,
    region: playerRegion || order.ffRegion || 'MENA',
    server: playerRegion || order.ffRegion || 'MENA',
    ...(gameFields || order.gameDetails?.gameFields || order.gameFields || {})
  };

  let completedCount = 0;
  let failedCount = 0;
  const fazercardsOrderIds: string[] = [];

  // 4. Sequential Placement Loop
  for (const offer of offers) {
    try {
      let requiredKeys: string[] = [];
      try {
        const offRes = await fetch(
          `https://api.fzr.cards/api/v2/topups/offers?category_id=${offer.category_id}`,
          {
            headers: { 'X-API-Key': apiKey, 'Content-Type': 'application/json' }
          }
        );
        const offData = await offRes.json();
        requiredKeys = (offData.fields || []).map((f: any) => f.key);
      } catch {}

      const fields: any = {};
      if (requiredKeys.length > 0) {
        requiredKeys.forEach((key: string) => {
          if (availableData[key]) fields[key] = availableData[key].toString();
        });
      } else {
        if (effectivePlayerUid) fields['player_id'] = effectivePlayerUid.toString();
        Object.assign(fields, availableData);
      }

      const idempotencyKey = `oskar-pkg-${orderId}-${offer.id}-${Date.now()}`;

      const res = await fetch('https://api.fzr.cards/api/v2/topups/order', {
        method: 'POST',
        headers: {
          'X-API-Key': apiKey,
          'Content-Type': 'application/json',
          'Idempotency-Key': idempotencyKey
        },
        body: JSON.stringify({
          category_id: offer.category_id,
          offer_id: offer.offer_id,
          fields
        })
      });

      const data = await res.json();

      if (data.ok && data.order) {
        fazercardsOrderIds.push(data.order.id);
        await adminDb
          .ref(`orders/${orderId}/specialPackageDelivery/offers/${offer.id}`)
          .update({
            fazercardsOrderId: data.order.id,
            status: 'processing',
            placedAt: Date.now()
          });
        completedCount++;
      } else {
        failedCount++;
        await adminDb
          .ref(`orders/${orderId}/specialPackageDelivery/offers/${offer.id}`)
          .update({
            status: 'failed',
            error: data.error || 'Provider rejected order'
          });
      }

      await new Promise(resolve => setTimeout(resolve, 1000));
    } catch (err: any) {
      failedCount++;
      await adminDb
        .ref(`orders/${orderId}/specialPackageDelivery/offers/${offer.id}`)
        .update({
          status: 'failed',
          error: err.message
        });
    }
  }

  // 5. Finalize Status and Notify
  let overallStatus = 'processing';
  if (failedCount === offers.length) {
    overallStatus = 'failed';
    await orderRef.update({
      status: 'cancelled',
      cancellationReason: 'Special package automation failed to initiate with provider'
    });
  }

  await orderRef.update({
    autoTopupOrderId: fazercardsOrderIds.join(', '),
    autoTopupOrderIds: fazercardsOrderIds,
    fazercardsOrderIds: fazercardsOrderIds,
    'specialPackageDelivery/completedOffers': completedCount,
    'specialPackageDelivery/failedOffers': failedCount,
    'specialPackageDelivery/overallStatus': overallStatus
  });

  const appUrl = process.env.NEXT_PUBLIC_APP_URL || 'https://oskarshop.so';
  fetch(`${appUrl}/api/notify-telegram`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({
      customerName: order.gameDetails?.playerName || order.userPhone || 'User',
      customerPhone: order.gameDetails?.whatsappNumber || order.userPhone,
      itemName: order.items?.[0]?.title || 'Item',
      amount: order.total,
      orderId: orderId,
      message: `📦 Special Package INITIATED: ${completedCount}/${offers.length} parts placed. Tracking IDs: ${fazercardsOrderIds.join(', ')}`
    })
  }).catch(() => {});

  return {
    success: true,
    totalOffers: offers.length,
    placed: completedCount,
    failed: failedCount,
    fazercardsOrderIds
  };
}

/**
 * Dispatches the appropriate FazerCards automation for any given order.
 * Inspects order and product metadata to choose between special package and regular top-up.
 */
export async function processOrderFazerTopup(orderId: string) {
  try {
    const settingsSnap = await adminDb.ref('settings/fazercards').get();
    const config = settingsSnap.val();

    if (!config?.enabled) {
      return { success: false, skipped: true, reason: 'Reseller automation disabled in settings' };
    }

    if (!config?.apiKey) {
      return { success: false, error: 'FazerCards API key missing in settings' };
    }

    const orderSnap = await adminDb.ref(`orders/${orderId}`).get();
    if (!orderSnap.exists()) {
      return { success: false, error: 'Order not found' };
    }
    const order = orderSnap.val();

    const item = order.items?.[0] || {};
    const itemId = item.id || order.itemId || order.productId;

    let product: any = null;
    if (itemId) {
      const prodSnap = await adminDb.ref(`products/${itemId}`).get();
      product = prodSnap.val();
    }

    const isSpecial =
      product?.category === 'special_package' ||
      product?.specialHandling === 'special_package' ||
      item.category === 'special_package' ||
      item.specialHandling === 'special_package' ||
      (product?.specialPackage?.offers && product.specialPackage.offers.length > 0);

    if (isSpecial) {
      return await executeFazerSpecialPackage({
        orderId,
        playerUid: order.ffUid || order.gameDetails?.playerID || order.gameId,
        playerRegion: order.ffRegion || order.gameDetails?.region || 'MENA',
        gameFields: order.gameDetails?.gameFields || order.gameFields
      });
    }

    const isAutoTopup =
      item.autoTopupEnabled ||
      product?.autoTopupEnabled ||
      item.resellerAutomation?.enabled ||
      product?.resellerAutomation?.enabled ||
      item.fazercardsCategory_id ||
      product?.fazercardsCategory_id;

    if (!isAutoTopup) {
      return { success: false, skipped: true, reason: 'Item is not configured for automated topup' };
    }

    return await executeFazerTopup({
      orderId,
      category_id: item.fazercardsCategory_id || product?.fazercardsCategory_id,
      offer_id: item.fazercardsOffer_id || product?.fazercardsOffer_id,
      fields: order.gameDetails?.gameFields || order.gameFields
    });
  } catch (err: any) {
    console.error(`Error processing FazerCards topup for order ${orderId}:`, err);
    return { success: false, error: err.message };
  }
}
