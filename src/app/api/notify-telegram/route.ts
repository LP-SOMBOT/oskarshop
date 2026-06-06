
import { NextResponse } from 'next/server';
import { adminDb } from '@/lib/firebaseAdmin';

/**
 * Telegram Notification API
 * 
 * Sends instant alerts to all registered admins when a new order 
 * or marketplace listing is created.
 */
export async function POST(request: Request) {
  try {
    const order = await request.json();

    // 1. Fetch latest settings from Database (Priority for dynamic updates)
    const settingsSnap = await adminDb.ref('settings').get();
    const settings = settingsSnap.val() || {};

    const token = settings.telegramBotToken || process.env.TELEGRAM_BOT_TOKEN;
    const rawChatIds = settings.telegramAdminChatIds || process.env.TELEGRAM_ADMIN_CHAT_IDS;

    const chatIds = rawChatIds
      ?.split(',')
      .map((id: string) => id.trim())
      .filter(Boolean) || [];

    if (!token || chatIds.length === 0) {
      console.error('Telegram config missing: ', { hasToken: !!token, chatIdsCount: chatIds.length });
      return NextResponse.json({ success: false, message: 'Telegram not configured' });
    }

    // 2. Format the message for better readability in Telegram
    const orderType = order.ffUid ? '🎮 Free Fire Top-Up' : '🛍️ Item Order';
    const isMarketplace = order.itemName?.toLowerCase().includes('account');

    const message = `
🛒 *DALAB CUSUB — OskarShop*
━━━━━━━━━━━━━━━━━━

${isMarketplace ? '🏪 Marketplace Listing' : orderType}

👤 *Macmiil-ka:* ${order.customerName || 'Unknown'}
📱 *Telefoon:* ${order.customerPhone || 'N/A'}
🎯 *Alaabta:* ${order.itemName || 'N/A'}
💰 *Lacagta:* $${order.amount || '0'}
${order.ffUid ? `🎮 *Game ID:* \`${order.ffUid}\`` : ''}
${order.ffPlayerName ? `👾 *Player:* ${order.ffPlayerName}` : ''}
${order.promoCode ? `🎟️ *Promo:* ${order.promoCode}` : ''}
${order.discount ? `🏷️ *Discount:* ${order.discount}%` : ''}
🕐 *Waqtiga:* ${new Date().toLocaleString('en-GB')}
🆔 *ID:* \`#${order.orderId || 'N/A'}\`

━━━━━━━━━━━━━━━━━━
✅ [Fur Admin Panel](https://oskarshop.so/admin)
    `.trim();

    // 3. Dispatch to ALL admins simultaneously
    const results = await Promise.all(
      chatIds.map((chatId: string) =>
        fetch(`https://api.telegram.org/bot${token}/sendMessage`, {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({
            chat_id: chatId,
            text: message,
            parse_mode: 'Markdown',
            disable_web_page_preview: true,
          }),
          signal: AbortSignal.timeout(8000),
        }).then(r => r.json()).catch(e => ({ ok: false, error: e.message }))
      )
    );

    return NextResponse.json({
      success: true,
      sent: results.length,
      results,
    });
  } catch (error: any) {
    console.error('Telegram notify error:', error);
    return NextResponse.json({ success: false, error: error.message });
  }
}
