import { Resend } from 'resend';

// Initialize Resend (free: 3,000 emails/month)
const resend = process.env.RESEND_API_KEY
  ? new Resend(process.env.RESEND_API_KEY)
  : null;

interface EmailOptions {
  to: string;
  subject: string;
  html: string;
}

export const sendEmail = async (options: EmailOptions): Promise<boolean> => {
  if (!resend) {
    console.warn('RESEND_API_KEY not configured. Email not sent.');
    return false;
  }

  try {
    const { error } = await resend.emails.send({
      from: process.env.RESEND_FROM_EMAIL || 'CulinaryAI <onboarding@resend.dev>',
      to: [options.to],
      subject: options.subject,
      html: options.html,
    });

    if (error) {
      console.error('Email error:', error);
      return false;
    }

    console.log(`Email sent to ${options.to}`);
    return true;
  } catch (error) {
    console.error('Error sending email:', error);
    return false;
  }
};

export const sendTeamInvitationEmail = async (
  email: string,
  restaurantName: string,
  role: string,
  invitationToken: string
) => {
  const invitationUrl = `${process.env.NEXT_PUBLIC_APP_URL || 'http://localhost:3000'}/invite?token=${invitationToken}`;

  const html = `
    <!DOCTYPE html>
    <html>
    <head>
      <meta charset="utf-8">
      <meta name="viewport" content="width=device-width, initial-scale=1.0">
    </head>
    <body style="font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, sans-serif; background-color: #FAF8F5; padding: 40px 20px; margin: 0;">
      <div style="max-width: 500px; margin: 0 auto; background: white; border: 2px solid #000; border-radius: 16px; padding: 40px; box-shadow: 8px 8px 0px 0px rgba(0,0,0,1);">
        <div style="text-align: center; margin-bottom: 30px;">
          <div style="display: inline-block; background: #DC143C; color: white; padding: 12px 24px; border-radius: 12px; font-weight: bold; font-size: 20px;">
            🍽️ CulinaryAI
          </div>
        </div>
        
        <h1 style="text-align: center; color: #111; font-size: 24px; margin-bottom: 10px;">
          You're Invited! 🎉
        </h1>
        
        <p style="text-align: center; color: #666; font-size: 16px; margin-bottom: 30px;">
          You've been invited to join <strong>${restaurantName}</strong> as a <strong style="text-transform: capitalize;">${role}</strong>.
        </p>
        
        <div style="text-align: center; margin-bottom: 30px;">
          <a href="${invitationUrl}" style="display: inline-block; background: #DC143C; color: white; padding: 16px 40px; border-radius: 12px; text-decoration: none; font-weight: bold; font-size: 16px; box-shadow: 4px 4px 0px 0px rgba(0,0,0,1);">
            Accept Invitation →
          </a>
        </div>
        
        <p style="text-align: center; color: #999; font-size: 14px;">
          This invitation expires in 7 days.
        </p>
        
        <hr style="border: none; border-top: 1px solid #eee; margin: 30px 0;">
        
        <p style="text-align: center; color: #999; font-size: 12px;">
          If you didn't expect this invitation, you can safely ignore this email.
        </p>
      </div>
    </body>
    </html>
  `;

  return sendEmail({
    to: email,
    subject: `You're invited to join ${restaurantName} on CulinaryAI`,
    html,
  });
};

export const sendOrderConfirmationEmail = async (
  email: string,
  orderDetails: {
    orderId: string;
    restaurantName: string;
    items: Array<{ name: string; quantity: number; price: number }>;
    total: number;
  }
) => {
  const itemsList = orderDetails.items
    .map(item => `<tr><td style="padding: 8px 0;">${item.quantity}x ${item.name}</td><td style="text-align: right;">€${item.price.toFixed(2)}</td></tr>`)
    .join('');

  const html = `
    <!DOCTYPE html>
    <html>
    <head>
      <meta charset="utf-8">
      <meta name="viewport" content="width=device-width, initial-scale=1.0">
    </head>
    <body style="font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, sans-serif; background-color: #FAF8F5; padding: 40px 20px; margin: 0;">
      <div style="max-width: 500px; margin: 0 auto; background: white; border: 2px solid #000; border-radius: 16px; padding: 40px; box-shadow: 8px 8px 0px 0px rgba(0,0,0,1);">
        <div style="text-align: center; margin-bottom: 30px;">
          <div style="display: inline-block; background: #DC143C; color: white; padding: 12px 24px; border-radius: 12px; font-weight: bold; font-size: 20px;">
            🍽️ CulinaryAI
          </div>
        </div>
        
        <h1 style="text-align: center; color: #111; font-size: 24px; margin-bottom: 10px;">
          Order Confirmed! ✅
        </h1>
        
        <p style="text-align: center; color: #666; font-size: 16px; margin-bottom: 20px;">
          Thanks for ordering from <strong>${orderDetails.restaurantName}</strong>
        </p>
        
        <div style="background: #f9f9f9; border-radius: 12px; padding: 20px; margin-bottom: 20px;">
          <p style="margin: 0 0 10px 0; color: #666; font-size: 14px;">Order #${orderDetails.orderId.slice(-8).toUpperCase()}</p>
          <table style="width: 100%; font-size: 14px;">
            ${itemsList}
          </table>
          <hr style="border: none; border-top: 1px dashed #ddd; margin: 15px 0;">
          <table style="width: 100%; font-size: 16px; font-weight: bold;">
            <tr><td>Total</td><td style="text-align: right; color: #DC143C;">€${orderDetails.total.toFixed(2)}</td></tr>
          </table>
        </div>
        
        <p style="text-align: center; color: #666; font-size: 14px;">
          We'll notify you when your order is ready!
        </p>
        
        <hr style="border: none; border-top: 1px solid #eee; margin: 30px 0;">
        
        <p style="text-align: center; color: #999; font-size: 12px;">
          © 2025 CulinaryAI. All rights reserved.
        </p>
      </div>
    </body>
    </html>
  `;

  return sendEmail({
    to: email,
    subject: `Order Confirmed - ${orderDetails.restaurantName}`,
    html,
  });
};
