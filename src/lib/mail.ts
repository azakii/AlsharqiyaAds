import nodemailer from "nodemailer";

/** Sends via SMTP (SMTP_* env). Without SMTP_HOST it logs the message so dev flows still work. */
export async function sendMail(to: string, subject: string, text: string): Promise<void> {
  if (!process.env.SMTP_HOST) {
    console.log(`[mail:dev] to=${to}\n${subject}\n${text}`);
    return;
  }
  const t = nodemailer.createTransport({
    host: process.env.SMTP_HOST,
    port: Number(process.env.SMTP_PORT || 465),
    secure: Number(process.env.SMTP_PORT || 465) === 465,
    auth: { user: process.env.SMTP_USER, pass: process.env.SMTP_PASSWORD },
  });
  await t.sendMail({ from: process.env.MAIL_FROM || process.env.SMTP_USER, to, subject, text });
}
