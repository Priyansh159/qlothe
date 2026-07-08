import { Resend } from "resend";

// Lazy init (matches lib/razorpay.ts's pattern): fails clearly at send-time
// with a readable message if RESEND_API_KEY is missing, rather than crashing
// at module import for routes that don't even send email.
function getResend(): Resend {
  const apiKey = process.env.RESEND_API_KEY;
  if (!apiKey) throw new Error("Email is not configured (RESEND_API_KEY missing)");
  return new Resend(apiKey);
}

// Resend's sandbox sender works with zero setup (no domain verification) but
// can only deliver to the email address you signed up to Resend with. Once
// qlothe.in is verified in the Resend dashboard, switch EMAIL_FROM to
// something like "QLOTHE <no-reply@qlothe.in>" to send to real customers.
const FROM = process.env.EMAIL_FROM ?? "QLOTHE <onboarding@resend.dev>";

export async function sendEmailChangeConfirmation(to: string, confirmUrl: string): Promise<void> {
  const resend = getResend();
  const { error } = await resend.emails.send({
    from: FROM,
    to,
    subject: "Confirm your new email — QLOTHE",
    html: `
      <div style="font-family:sans-serif;max-width:480px;margin:0 auto;padding:32px 24px;">
        <h1 style="font-size:20px;color:#06402B;margin:0 0 16px;">Confirm your new email</h1>
        <p style="font-size:14px;line-height:1.6;color:#333;">
          You asked to change the email on your QLOTHE account to this address.
          Click below to confirm — this link expires in 30 minutes.
        </p>
        <a href="${confirmUrl}"
           style="display:inline-block;margin-top:16px;padding:12px 24px;background:#06402B;color:#fff;
                  text-decoration:none;border-radius:999px;font-weight:600;font-size:14px;">
          Confirm email change
        </a>
        <p style="font-size:12px;color:#888;margin-top:24px;">
          If you didn't request this, you can safely ignore this email — your address won't change.
        </p>
      </div>
    `,
  });
  if (error) throw new Error(`Resend failed to send: ${error.message}`);
}
