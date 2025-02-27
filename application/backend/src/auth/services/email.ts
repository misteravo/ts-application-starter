import { eq } from 'drizzle-orm';
import mailer from 'nodemailer';
import type Mail from 'nodemailer/lib/mailer';
import { db, s } from '../../db';
import { env } from '../../env';

export function verifyEmailInput(email: string): boolean {
  return /^.+@.+\..+$/.test(email) && email.length < 256;
}

export async function checkEmailAvailability(email: string) {
  const user = await db.query.user.findFirst({ where: eq(s.user.email, email) });
  return user === undefined;
}

function createTransporter() {
  return mailer.createTransport({
    host: env.SMTP_HOST,
    port: env.SMTP_PORT,
    secure: false,
    tls: {
      rejectUnauthorized: false,
    },
    connectionTimeout: 3000,
  });
}

export type MailOptions = Pick<Mail.Options, 'to' | 'cc' | 'bcc' | 'subject' | 'html' | 'text' | 'attachments'>;

export async function sendEmail(mailOptions: MailOptions) {
  if (!mailOptions.to) throw new Error('Missing email recipient : ' + mailOptions.subject);

  return new Promise<boolean>((resolve) => {
    createTransporter().sendMail(
      {
        ...mailOptions,
        from: env.MAIL_FROM,
        replyTo: env.REPLY_TO ?? env.MAIL_FROM,
        to: env.DEV_EMAIL ?? mailOptions.to,
        cc: env.DEV_EMAIL ? undefined : mailOptions.cc,
        bcc: env.DEV_EMAIL ? undefined : mailOptions.bcc,
      },
      (error, info) => {
        resolve(!error && Boolean(info.messageId));
      },
    );
  });
}
