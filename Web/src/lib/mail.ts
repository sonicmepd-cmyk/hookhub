import nodemailer from 'nodemailer';

/**
 * Envío del código de verificación.
 * - MAIL_MODE=console (por defecto): el código se imprime en la consola del servidor.
 * - MAIL_MODE=smtp: correo real con nodemailer y credenciales de .env.
 */
export async function sendVerificationEmail(email: string, code: string): Promise<void> {
  const mode = process.env.MAIL_MODE ?? 'console';
  if (mode === 'smtp') {
    const { SMTP_HOST, SMTP_USER, SMTP_PASS } = process.env;
    if (!SMTP_HOST || !SMTP_USER || !SMTP_PASS) {
      throw new Error('MAIL_MODE=smtp requiere SMTP_HOST, SMTP_USER y SMTP_PASS en .env');
    }
    const transport = nodemailer.createTransport({
      host: SMTP_HOST,
      port: Number(process.env.SMTP_PORT ?? '587'),
      secure: process.env.SMTP_SECURE === 'true',
      auth: { user: SMTP_USER, pass: SMTP_PASS },
    });
    await transport.sendMail({
      from: process.env.MAIL_FROM ?? 'HookHub <no-reply@hookhub.local>',
      to: email,
      subject: 'Tu código de verificación de HookHub',
      text: [
        'Tu código de verificación es:',
        '',
        `  ${code}`,
        '',
        'Caduca en 15 minutos.',
        'Si no has solicitado este código, puedes ignorar este mensaje.',
      ].join('\n'),
    });
    return;
  }
  console.log(
    `\n[HOOKHUB-MAIL:console] Código de verificación para ${email}: ${code} (caduca en 15 minutos)\n`,
  );
}
