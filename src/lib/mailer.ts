import nodemailer from "nodemailer";
import type Mail from "nodemailer/lib/mailer";

// Mirrors pms-connect-api's EmailService: same MAIL_* env var convention,
// same Ethereal dev fallback. Kept separate from the backend's mailer since
// it serves a different auth system (Better Auth's user-facing emails vs.
// the backend's admin-only reset flow).
let transporterPromise: Promise<Mail> | null = null;

async function createTransporter(): Promise<Mail> {
  if (process.env.MAIL_HOST === "ethereal") {
    const account = await nodemailer.createTestAccount();
    console.log(
      `[mailer] Ethereal test account created: ${account.user} / ${account.pass}`,
    );
    return nodemailer.createTransport({
      host: "smtp.ethereal.email",
      port: 587,
      secure: false,
      auth: { user: account.user, pass: account.pass },
    });
  }
  return nodemailer.createTransport({
    host: process.env.MAIL_HOST,
    port: Number(process.env.MAIL_PORT) || 587,
    secure: process.env.MAIL_SECURE === "true",
    auth: {
      user: process.env.MAIL_USER,
      pass: process.env.MAIL_PASSWORD,
    },
  });
}

function getTransporter(): Promise<Mail> {
  if (!transporterPromise) {
    transporterPromise = createTransporter();
  }
  return transporterPromise;
}

export async function sendMail(options: Mail.Options) {
  const transporter = await getTransporter();
  const info = await transporter.sendMail({
    from: `"${process.env.MAIL_FROM_NAME || "PMSCONNECT"}" <${process.env.MAIL_FROM_ADDRESS || "noreply@pmsconnect.com"}>`,
    ...options,
  });
  if (process.env.MAIL_HOST === "ethereal") {
    console.log(`[mailer] Preview URL: ${nodemailer.getTestMessageUrl(info)}`);
  }
  return info;
}
