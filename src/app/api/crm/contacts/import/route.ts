import { NextRequest, NextResponse } from 'next/server'
import { auth } from '@clerk/nextjs/server'
import { supabase } from '@/lib/supabase'

interface ImportRow {
  first_name: string
  last_name: string
  email?: string
  phone?: string
  type?: string
  tags?: string
  notes?: string
  company?: string
}

export async function POST(req: NextRequest) {
  const { userId } = await auth()
  if (!userId) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })

  const { rows }: { rows: ImportRow[] } = await req.json()
  if (!rows?.length) return NextResponse.json({ error: 'No rows provided' }, { status: 400 })

  let created = 0
  let updated = 0
  let skipped = 0
  const errors: string[] = []

  for (const row of rows) {
    if (!row.first_name && !row.last_name) { skipped++; continue }

    const tags = row.tags ? row.tags.split(/[,;]/).map(t => t.trim()).filter(Boolean) : []
    const type = ['lead', 'customer', 'partner'].includes(row.type || '') ? row.type : 'lead'

    const contactData = {
      first_name: row.first_name || '—',
      last_name: row.last_name || '—',
      email: row.email?.toLowerCase() || null,
      phone: row.phone || null,
      type,
      tags,
      notes: row.notes || null,
    }

    try {
      if (row.email) {
        const { data: existing } = await supabase
          .from('crm_contacts')
          .select('id, tags')
          .eq('email', row.email.toLowerCase())
          .single()

        if (existing) {
          const mergedTags = Array.from(new Set([...(existing.tags || []), ...tags]))
          await supabase.from('crm_contacts').update({ ...contactData, tags: mergedTags }).eq('id', existing.id)
          updated++
          continue
        }
      }

      await supabase.from('crm_contacts').insert(contactData)
      created++
    } catch (e) {
      errors.push(`Row ${created + updated + skipped + 1}: ${e}`)
      skipped++
    }
  }

  return NextResponse.json({ created, updated, skipped, errors: errors.slice(0, 5) })
}
