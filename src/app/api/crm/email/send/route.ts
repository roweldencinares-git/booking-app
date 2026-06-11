import { NextRequest, NextResponse } from 'next/server'
import { auth } from '@clerk/nextjs/server'
import { createTransport } from 'nodemailer'
import { supabase } from '@/lib/supabase'

export async function POST(req: NextRequest) {
  const { userId } = await auth()
  if (!userId) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })

  const { to, subject, body, contact_id, deal_id } = await req.json()

  if (!to || !subject || !body) {
    return NextResponse.json({ error: 'to, subject, and body are required' }, { status: 400 })
  }

  const fromEmail = process.env.CRM_FROM_EMAIL || process.env.GMAIL_USER
  const fromName = process.env.CRM_FROM_NAME || 'Rowel CRM'

  if (!fromEmail) {
    return NextResponse.json({ error: 'CRM_FROM_EMAIL not configured' }, { status: 500 })
  }

  const transporter = createTransport({
    host: process.env.SMTP_HOST || 'smtp.gmail.com',
    port: parseInt(process.env.SMTP_PORT || '587'),
    secure: false,
    auth: {
      user: process.env.GMAIL_USER || process.env.SMTP_USER,
      pass: process.env.GMAIL_APP_PASSWORD || process.env.SMTP_PASS,
    },
  })

  await transporter.sendMail({
    from: `"${fromName}" <${fromEmail}>`,
    to,
    subject,
    text: body,
    html: body.replace(/\n/g, '<br>'),
  })

  // Auto-log as activity
  await supabase.from('crm_activities').insert({
    type: 'email',
    content: `**To:** ${to}\n**Subject:** ${subject}\n\n${body}`,
    contact_id: contact_id || null,
    deal_id: deal_id || null,
  })

  return NextResponse.json({ success: true })
}
