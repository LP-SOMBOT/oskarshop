
import { NextResponse } from 'next/server';
import { adminDb } from '@/lib/firebaseAdmin';
import crypto from 'crypto';

/**
 * Webhook for FazerCards order status updates.
 * Includes HMAC-SHA256 signature verification for security.
 * Path: /api/fazercards-notify
 */

const SIGNING_SECRET = 'whsec_033364c467ad4f195ef041b3d40e8fb6f8af5b1da29f681a31fab134457c7e29';

export async function POST(request: Request) {
  try {
    const rawBody = await request.text();
    const signature = request.headers.get('X-Webhook-Signature');

    // 1. Verify Webhook Signature (Security Protocol)
    if (signature && SIGNING_SECRET) {
      const hmac = crypto.createHmac('sha256', SIGNING_SECRET);
      hmac.update(rawBody);
      const expectedSignature = `sha256=${hmac.digest('hex')}`;

      if (signature !== expectedSignature) {
        console.warn('FazerCards Webhook: Unauthorized attempt blocked (Invalid Signature)');
        return NextResponse.json({ success: false, error: 'Invalid signature' }, { status: 401 });
      }
    }

    const data = JSON.parse(rawBody);
    const { id: fazercardsOrderId, status: fazercardsStatus, error } = data;

    if (!fazercardsOrderId) {
      return NextResponse.json({ success: false, error: 'Missing FazerCards ID' }, { status: 400 });
    }

    // 2. Find the corresponding order in our database
    const ordersSnap = await adminDb.ref('orders').get();
    const orders = ordersSnap.val() || {};
    
    let matchedOrderId = null;
    let matchedOrder = null;

    for (const [id, order] of Object.entries(orders)) {
      if ((order as any).autoTopupOrderId === fazercardsOrderId) {
        matchedOrderId = id;
        matchedOrder = order;
        break;
      }
    }

    if (!matchedOrderId || !matchedOrder) {
      console.warn(`FazerCards Webhook: No internal order match found for provider ID ${fazercardsOrderId}`);
      return NextResponse.json({ success: false, error: 'Order not found for this FazerCards ID' });
    }

    // 3. Map FazerCards status to shop status
    const updates: any = {};
    
    if (fazercardsStatus === 'completed') {
      updates.status = 'successful';
      updates.autoTopupStatus = 'completed';
      updates.completedAt = Date.now();
    } else if (fazercardsStatus === 'failed' || fazercardsStatus === 'rejected') {
      updates.autoTopupStatus = 'failed';
      updates.autoTopupError = error || 'FazerCards failed delivery';
      // We keep status as processing to allow admin to see the failure reason
    } else if (fazercardsStatus === 'processing') {
      updates.autoTopupStatus = 'processing';
    }

    // 4. Persist changes
    await adminDb.ref(`orders/${matchedOrderId}`).update(updates);

    return NextResponse.json({ success: true, message: `Order ${matchedOrderId} synced to ${fazercardsStatus}` });

  } catch (err: any) {
    console.error('FazerCards Webhook Logic Error:', err);
    return NextResponse.json({ success: false, error: err.message }, { status: 500 });
  }
}
