import { createTransport } from 'nodemailer'

function transporter() {
  return createTransport({
    host: process.env.SMTP_HOST || 'smtp.gmail.com',
    port: parseInt(process.env.SMTP_PORT || '587'),
    secure: false,
    auth: {
      user: process.env.GMAIL_USER || process.env.SMTP_USER,
      pass: process.env.GMAIL_APP_PASSWORD || process.env.SMTP_PASS,
    },
  })
}

const from = () => `"Rank & Rent OS" <${process.env.GMAIL_USER || process.env.SMTP_USER}>`

function html(body: string) {
  return `<!DOCTYPE html><html><head><meta charset="utf-8"><style>
    body{font-family:-apple-system,BlinkMacSystemFont,'Segoe UI',sans-serif;background:#f9fafb;margin:0;padding:40px 20px}
    .card{background:#fff;border-radius:12px;max-width:520px;margin:0 auto;padding:36px;border:1px solid #e5e7eb}
    .badge{display:inline-block;background:#d1fae5;color:#065f46;font-size:12px;font-weight:700;padding:4px 10px;border-radius:20px;margin-bottom:16px}
    h2{font-size:20px;font-weight:700;color:#111827;margin:0 0 16px}
    .detail{background:#f9fafb;border-radius:8px;padding:16px;margin:16px 0}
    .detail p{margin:4px 0;font-size:14px;color:#374151}
    .detail strong{color:#111827}
    .footer{text-align:center;margin-top:24px;font-size:12px;color:#9ca3af}
  </style></head><body><div class="card">${body}<div class="footer">Rank & Rent OS · Powered by Spearity</div></div></body></html>`
}

export async function sendLeadNotification(to: string, data: {
  clientName: string
  leadName?: string
  leadPhone?: string
  leadEmail?: string
  message?: string
  propertyDomain: string
  propertyLocation?: string
}) {
  if (!process.env.GMAIL_USER && !process.env.SMTP_USER) return

  await transporter().sendMail({
    from: from(),
    to,
    subject: `🔥 New lead from ${data.propertyDomain}`,
    html: html(`
      <div class="badge">NEW LEAD</div>
      <h2>You have a new lead${data.propertyLocation ? ` from ${data.propertyLocation}` : ''}!</h2>
      <div class="detail">
        ${data.leadName ? `<p><strong>Name:</strong> ${data.leadName}</p>` : ''}
        ${data.leadPhone ? `<p><strong>Phone:</strong> <a href="tel:${data.leadPhone}">${data.leadPhone}</a></p>` : ''}
        ${data.leadEmail ? `<p><strong>Email:</strong> <a href="mailto:${data.leadEmail}">${data.leadEmail}</a></p>` : ''}
        ${data.message ? `<p><strong>Message:</strong> ${data.message}</p>` : ''}
        <p style="margin-top:8px;font-size:12px;color:#9ca3af">Source: ${data.propertyDomain}</p>
      </div>
      <p style="font-size:13px;color:#6b7280">Hi ${data.clientName}, contact this lead as soon as possible for the best conversion rate.</p>
    `),
  })
}
