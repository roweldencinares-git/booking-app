import { createTransport } from 'nodemailer'
import { format } from 'date-fns'

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

const from = () => `"${process.env.CRM_FROM_NAME || 'Spearity Coaching'}" <${process.env.GMAIL_USER || process.env.SMTP_USER}>`

function html(title: string, body: string) {
  return `<!DOCTYPE html><html><head><meta charset="utf-8"><style>
    body{font-family:-apple-system,BlinkMacSystemFont,'Segoe UI',sans-serif;background:#f9fafb;margin:0;padding:40px 20px}
    .card{background:#fff;border-radius:12px;max-width:520px;margin:0 auto;padding:36px;border:1px solid #e5e7eb}
    .logo{font-size:20px;font-weight:800;color:#4f46e5;margin-bottom:28px}
    h2{font-size:22px;font-weight:700;color:#111827;margin:0 0 8px}
    p{color:#6b7280;line-height:1.6;margin:0 0 16px}
    .detail{background:#f9fafb;border-radius:8px;padding:16px;margin:20px 0}
    .detail p{margin:4px 0;font-size:14px}
    .detail strong{color:#111827}
    .btn{display:inline-block;background:#4f46e5;color:#fff;font-weight:600;padding:12px 24px;border-radius:8px;text-decoration:none;margin:8px 4px 8px 0}
    .btn-outline{background:#fff;color:#4f46e5;border:2px solid #4f46e5}
    .footer{text-align:center;margin-top:24px;font-size:12px;color:#9ca3af}
  </style></head><body>
  <div class="card">
    <div class="logo">Spearity</div>
    ${body}
    <div class="footer">Spearity Coaching · meetings.spearity.com</div>
  </div></body></html>`
}

export async function sendBookingConfirmation(to: string, data: {
  clientName: string
  sessionType: string
  startTime: string
  duration: number
  zoomJoinUrl?: string
  zoomPassword?: string
}) {
  if (!process.env.GMAIL_USER && !process.env.SMTP_USER) return

  const date = format(new Date(data.startTime), 'EEEE, MMMM d, yyyy')
  const time = format(new Date(data.startTime), 'h:mm a')

  await transporter().sendMail({
    from: from(),
    to,
    subject: `✅ Confirmed: ${data.sessionType} on ${date}`,
    html: html('Booking Confirmed', `
      <h2>You're booked! 🎉</h2>
      <p>Hi ${data.clientName}, your coaching session is confirmed. See you soon.</p>
      <div class="detail">
        <p><strong>${data.sessionType}</strong></p>
        <p>📅 ${date}</p>
        <p>🕐 ${time} · ${data.duration} minutes</p>
        ${data.zoomJoinUrl ? `<p>💻 <a href="${data.zoomJoinUrl}">Join Zoom</a>${data.zoomPassword ? ` · Password: ${data.zoomPassword}` : ''}</p>` : ''}
      </div>
      ${data.zoomJoinUrl ? `<a href="${data.zoomJoinUrl}" class="btn">Join Zoom Meeting</a>` : ''}
      <a href="https://meetings.spearity.com/portal/sessions" class="btn btn-outline">View My Sessions</a>
      <p style="margin-top:20px;font-size:13px">Need to reschedule? Reply to this email or visit your client portal.</p>
    `),
  })
}

export async function sendSessionReminder(to: string, data: {
  clientName: string
  sessionType: string
  startTime: string
  duration: number
  zoomJoinUrl?: string
  zoomPassword?: string
  hoursUntil: number
}) {
  if (!process.env.GMAIL_USER && !process.env.SMTP_USER) return

  const date = format(new Date(data.startTime), 'EEEE, MMMM d')
  const time = format(new Date(data.startTime), 'h:mm a')
  const label = data.hoursUntil <= 1 ? 'starting soon' : `in ${data.hoursUntil} hours`

  await transporter().sendMail({
    from: from(),
    to,
    subject: `⏰ Reminder: ${data.sessionType} ${label}`,
    html: html('Session Reminder', `
      <h2>Your session is ${label} 🔔</h2>
      <p>Hi ${data.clientName}, just a reminder about your upcoming coaching session.</p>
      <div class="detail">
        <p><strong>${data.sessionType}</strong></p>
        <p>📅 ${date} at ${time}</p>
        <p>⏱ ${data.duration} minutes</p>
        ${data.zoomJoinUrl ? `<p>💻 <a href="${data.zoomJoinUrl}">Zoom link</a>${data.zoomPassword ? ` · Password: ${data.zoomPassword}` : ''}</p>` : ''}
      </div>
      ${data.zoomJoinUrl ? `<a href="${data.zoomJoinUrl}" class="btn">Join Zoom Meeting</a>` : ''}
    `),
  })
}

export async function sendPostSessionFollowUp(to: string, data: {
  clientName: string
  sessionType: string
}) {
  if (!process.env.GMAIL_USER && !process.env.SMTP_USER) return

  await transporter().sendMail({
    from: from(),
    to,
    subject: `Thanks for today's session 🙏`,
    html: html('Session Follow-up', `
      <h2>Great session today, ${data.clientName}!</h2>
      <p>Thank you for your time and energy in today's <strong>${data.sessionType}</strong> session.</p>
      <p>Take a moment to reflect on your key takeaways and action items before our next call.</p>
      <a href="https://meetings.spearity.com" class="btn">Book Your Next Session</a>
      <p style="margin-top:20px;font-size:13px;color:#9ca3af">Have questions or want to share a win? Just reply to this email.</p>
    `),
  })
}
