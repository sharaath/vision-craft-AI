import nodemailer from 'nodemailer';

export default async function handler(req, res) {
  if (req.method !== 'POST') {
    return res.status(405).json({ error: 'Method not allowed' });
  }

  const { auth, to, subject, html } = req.body || {};

  if (!auth || !to || !subject || !html) {
    return res.status(400).json({ error: 'Missing required parameters' });
  }

  const transporter = nodemailer.createTransport({
    host: auth.host,
    port: parseInt(auth.port) || 587,
    secure: parseInt(auth.port) === 465,
    auth: {
      user: auth.user,
      pass: auth.pass,
    },
  });

  try {
    const info = await transporter.sendMail({
      from: `"${auth.senderName || 'VisionCraft AI'}" <${auth.user}>`,
      to,
      subject,
      html,
    });
    return res.status(200).json({ success: true, messageId: info.messageId });
  } catch (error) {
    console.error('SMTP send failure:', error);
    return res.status(500).json({ error: error.message || 'SMTP send failure' });
  }
}
