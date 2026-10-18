const { Resend } = require('resend');

const escapeHtml = (value) => String(value || '')
  .replace(/&/g, '&amp;')
  .replace(/</g, '&lt;')
  .replace(/>/g, '&gt;')
  .replace(/"/g, '&quot;')
  .replace(/'/g, '&#039;');

/**
 * Send order notification email to admin
 */
const sendOrderNotificationEmail = async (adminEmail, order) => {
  const resend = process.env.RESEND_API_KEY && process.env.RESEND_API_KEY !== 're_your_api_key_here'
    ? new Resend(process.env.RESEND_API_KEY)
    : null;

  const fromEmail = process.env.RESEND_FROM_EMAIL || 'onboarding@resend.dev';

  if (!resend) {
    if (process.env.NODE_ENV === 'development') {
      console.log(`\n=========================================`);
      console.log(`LOCAL DEV ORDER NOTIFICATION for ${adminEmail}`);
      console.log(`Order: ${order.orderRef} | Total: ₹${order.totalAmount}`);
      console.log(`=========================================\n`);
      return { success: true };
    }
    return { success: false, error: 'Email service is not configured' };
  }

  const itemsHtml = order.items.map((i) => `
    <tr>
      <td style="padding: 8px; border-bottom: 1px solid #eee;">${escapeHtml(i.title)}</td>
      <td style="padding: 8px; border-bottom: 1px solid #eee; text-align: center;">${i.quantity}</td>
      <td style="padding: 8px; border-bottom: 1px solid #eee; text-align: right;">₹${(i.price * i.quantity).toLocaleString('en-IN')}</td>
    </tr>
  `).join('');

  try {
    const { error } = await resend.emails.send({
      from: fromEmail,
      to: adminEmail,
      subject: `🛒 New Order ${order.orderRef} — ₹${order.totalAmount.toLocaleString('en-IN')}`,
      html: `
        <div style="font-family: 'DM Sans', Arial, sans-serif; max-width: 600px; margin: 0 auto; padding: 20px; border: 1px solid #eaeaea; border-radius: 10px;">
          <h2 style="color: #C65B3D;">New Order Received!</h2>
          <p><strong>Order Ref:</strong> ${escapeHtml(order.orderRef)}</p>
          <p><strong>Customer:</strong> ${escapeHtml(order.customerName)}</p>
          <p><strong>Phone:</strong> ${escapeHtml(order.customerPhone)}</p>
          <p><strong>Email:</strong> ${escapeHtml(order.customerEmail)}</p>
          ${order.deliveryAddress ? `<p><strong>Address:</strong> ${escapeHtml(order.deliveryAddress)}, ${escapeHtml(order.deliveryCity)} ${escapeHtml(order.deliveryPincode)}</p>` : ''}
          ${order.orderNotes ? `<p><strong>Notes:</strong> ${escapeHtml(order.orderNotes)}</p>` : ''}

          <table style="width: 100%; border-collapse: collapse; margin: 20px 0;">
            <thead>
              <tr style="background: #F6F0E4;">
                <th style="padding: 8px; text-align: left;">Item</th>
                <th style="padding: 8px; text-align: center;">Qty</th>
                <th style="padding: 8px; text-align: right;">Amount</th>
              </tr>
            </thead>
            <tbody>${itemsHtml}</tbody>
          </table>

          <p><strong>Subtotal:</strong> ₹${order.subtotal.toLocaleString('en-IN')}</p>
          <p><strong>Shipping:</strong> ₹${order.shippingCharge.toLocaleString('en-IN')}</p>
          <p style="font-size: 18px;"><strong>Total: ₹${order.totalAmount.toLocaleString('en-IN')}</strong></p>

          <p><strong>Status:</strong> ${order.status.replace(/_/g, ' ').toUpperCase()}</p>
          ${order.paymentScreenshotUrl ? `<p><strong>Payment Screenshot:</strong> <a href="${order.paymentScreenshotUrl}">View Screenshot</a></p>` : '<p><em>No payment screenshot uploaded yet.</em></p>'}

          <hr style="border: none; border-top: 1px solid #eaeaea; margin: 24px 0;" />
          <p style="font-size: 12px; color: #64748b; text-align: center;">ParthCraft12 — Handmade Art & Craft</p>
        </div>
      `,
    });

    if (error) {
      console.error('Resend order notification error:', error);
      return { success: false, error: error.message };
    }
    return { success: true };
  } catch (err) {
    console.error('Failed to send order notification:', err);
    return { success: false, error: 'Failed to send email' };
  }
};

module.exports = { sendOrderNotificationEmail };
