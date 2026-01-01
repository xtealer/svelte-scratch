import nodemailer from 'nodemailer';
import config from './db/config';

// Create reusable transporter
const transporter = nodemailer.createTransport({
  host: config.email.host,
  port: config.email.port,
  secure: config.email.secure,
  auth: {
    user: config.email.user,
    pass: config.email.pass,
  },
});

export interface SendEmailOptions {
  to: string;
  subject: string;
  text: string;
  html?: string;
}

export async function sendEmail(options: SendEmailOptions): Promise<boolean> {
  try {
    // Skip sending if email is not configured
    if (!config.email.user || !config.email.pass) {
      console.log('[Email] SMTP not configured, logging email instead:');
      console.log(`  To: ${options.to}`);
      console.log(`  Subject: ${options.subject}`);
      console.log(`  Text: ${options.text}`);
      return true; // Return true for development
    }

    await transporter.sendMail({
      from: config.email.from,
      to: options.to,
      subject: options.subject,
      text: options.text,
      html: options.html,
    });

    return true;
  } catch (error) {
    console.error('[Email] Failed to send email:', error);
    return false;
  }
}

export async function send2FACode(email: string, code: string): Promise<boolean> {
  const subject = 'Your Gold Games Verification Code';
  const text = `Your verification code is: ${code}\n\nThis code will expire in 5 minutes.\n\nIf you did not request this code, please ignore this email.`;
  const html = `
    <div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto; padding: 20px;">
      <div style="background: linear-gradient(135deg, #1a2c38, #213743); padding: 30px; border-radius: 16px; text-align: center;">
        <h1 style="color: #00e701; margin: 0 0 20px 0; font-size: 24px;">Gold Games</h1>
        <p style="color: #b1bad3; margin: 0 0 20px 0;">Your verification code is:</p>
        <div style="background: #0f1923; border: 2px solid #00e701; border-radius: 12px; padding: 20px; margin: 20px 0;">
          <span style="font-size: 32px; font-weight: bold; color: #00e701; letter-spacing: 8px;">${code}</span>
        </div>
        <p style="color: #888; font-size: 14px; margin: 20px 0 0 0;">This code will expire in 5 minutes.</p>
        <p style="color: #666; font-size: 12px; margin: 10px 0 0 0;">If you did not request this code, please ignore this email.</p>
      </div>
    </div>
  `;

  return sendEmail({ to: email, subject, text, html });
}
