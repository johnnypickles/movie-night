import { Resend } from "resend";

let resendClient: Resend | null = null;

function getResend(): Resend | null {
  const key = process.env.RESEND_API_KEY;
  if (!key) return null;
  if (!resendClient) resendClient = new Resend(key);
  return resendClient;
}

const FROM = "MovieMatch <onboarding@resend.dev>";

export async function sendPasswordReset(
  to: string,
  resetUrl: string
): Promise<void> {
  const resend = getResend();
  if (!resend) {
    console.error("[email] RESEND_API_KEY missing — cannot send");
    throw new Error("Email service not configured");
  }

  await resend.emails.send({
    from: FROM,
    to,
    subject: "Reset your MovieMatch password",
    html: `
<!doctype html>
<html>
  <body style="font-family: Georgia, serif; background: #f8f1de; color: #261a0e; padding: 24px;">
    <div style="max-width: 480px; margin: 0 auto; background: #f8f1de; border: 2px solid #261a0e; padding: 28px;">
      <h1 style="font-family: 'Georgia', serif; color: #a62828; margin: 0 0 16px 0;">Reset your password</h1>
      <p style="line-height: 1.5;">Someone (hopefully you) asked to reset the password for your MovieMatch account. Click the button below to set a new one. This link is good for 1 hour.</p>
      <p style="margin: 24px 0;">
        <a href="${resetUrl}" style="display: inline-block; background: #a62828; color: #f8f1de; padding: 12px 24px; text-decoration: none; font-family: 'Impact', sans-serif; letter-spacing: 2px; text-transform: uppercase; border: 2px solid #261a0e;">Reset Password</a>
      </p>
      <p style="line-height: 1.5; font-size: 14px; color: #5c4525;">If you didn't ask for this, you can safely ignore this email — nothing will change.</p>
      <p style="line-height: 1.5; font-size: 12px; color: #5c4525; margin-top: 32px;">Or paste this into your browser: ${resetUrl}</p>
    </div>
  </body>
</html>
    `.trim(),
    text: `Reset your MovieMatch password.\n\nVisit this link within 1 hour:\n${resetUrl}\n\nIf you didn't ask for this, ignore this email.`,
  });
}
