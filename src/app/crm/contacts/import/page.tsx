'use client'

import { useState, useRef } from 'react'
import { useRouter } from 'next/navigation'

interface ParsedRow {
  first_name: string
  last_name: string
  email: string
  phone: string
  type: string
  tags: string
  notes: string
}

const COLUMN_ALIASES: Record<string, keyof ParsedRow> = {
  'first name': 'first_name', 'firstname': 'first_name', 'first': 'first_name', 'given name': 'first_name',
  'last name': 'last_name', 'lastname': 'last_name', 'last': 'last_name', 'surname': 'last_name', 'family name': 'last_name',
  'name': 'first_name',
  'email': 'email', 'email address': 'email', 'e-mail': 'email',
  'phone': 'phone', 'phone number': 'phone', 'mobile': 'phone', 'cell': 'phone', 'telephone': 'phone',
  'type': 'type', 'contact type': 'type', 'lead type': 'type',
  'tags': 'tags', 'tag': 'tags', 'labels': 'tags',
  'notes': 'notes', 'note': 'notes', 'comments': 'notes', 'description': 'notes',
}

function parseCSV(text: string): { headers: string[]; rows: string[][] } {
  const lines = text.trim().split(/\r?\n/)
  const parse = (line: string) => {
    const result: string[] = []
    let cur = '', inQuote = false
    for (let i = 0; i < line.length; i++) {
      const c = line[i]
      if (c === '"') { inQuote = !inQuote }
      else if (c === ',' && !inQuote) { result.push(cur.trim()); cur = '' }
      else { cur += c }
    }
    result.push(cur.trim())
    return result
  }
  return { headers: parse(lines[0]), rows: lines.slice(1).map(parse) }
}

function mapHeaders(headers: string[]): (keyof ParsedRow | null)[] {
  return headers.map(h => COLUMN_ALIASES[h.toLowerCase().trim()] ?? null)
}

function rowToContact(row: string[], mapping: (keyof ParsedRow | null)[]): ParsedRow {
  const c: ParsedRow = { first_name: '', last_name: '', email: '', phone: '', type: 'lead', tags: '', notes: '' }
  mapping.forEach((field, i) => {
    if (field && row[i]) {
      if (field === 'first_name' && !c.first_name) {
        // Handle "Full Name" in first_name column
        const parts = row[i].trim().split(' ')
        c.first_name = parts[0]
        if (!c.last_name && parts.length > 1) c.last_name = parts.slice(1).join(' ')
      } else {
        c[field] = row[i].trim()
      }
    }
  })
  return c
}

export default function ImportContactsPage() {
  const router = useRouter()
  const fileRef = useRef<HTMLInputElement>(null)
  const [rows, setRows] = useState<ParsedRow[]>([])
  const [headers, setHeaders] = useState<string[]>([])
  const [mapping, setMapping] = useState<(keyof ParsedRow | null)[]>([])
  const [importing, setImporting] = useState(false)
  const [result, setResult] = useState<{ created: number; updated: number; skipped: number } | null>(null)
  const [error, setError] = useState('')

  const handleFile = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0]
    if (!file) return
    const reader = new FileReader()
    reader.onload = (ev) => {
      const text = ev.target?.result as string
      const { headers, rows } = parseCSV(text)
      const mapped = mapHeaders(headers)
      setHeaders(headers)
      setMapping(mapped)
      setRows(rows.slice(0, 500).map(r => rowToContact(r, mapped)))
      setResult(null)
      setError('')
    }
    reader.readAsText(file)
  }

  const updateMapping = (colIdx: number, field: keyof ParsedRow | '') => {
    const newMapping = [...mapping]
    newMapping[colIdx] = field || null
    setMapping(newMapping)
    // Re-parse rows with new mapping
    const file = fileRef.current?.files?.[0]
    if (!file) return
    const reader = new FileReader()
    reader.onload = (ev) => {
      const text = ev.target?.result as string
      const { rows } = parseCSV(text)
      setRows(rows.slice(0, 500).map(r => rowToContact(r, newMapping)))
    }
    reader.readAsText(file)
  }

  const runImport = async () => {
    setImporting(true)
    setError('')
    const res = await fetch('/api/crm/contacts/import', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ rows }),
    })
    const data = await res.json()
    if (!res.ok) { setError(data.error || 'Import failed'); setImporting(false); return }
    setResult(data)
    setImporting(false)
  }

  const fields: { value: keyof ParsedRow; label: string }[] = [
    { value: 'first_name', label: 'First Name' },
    { value: 'last_name', label: 'Last Name' },
    { value: 'email', label: 'Email' },
    { value: 'phone', label: 'Phone' },
    { value: 'type', label: 'Type (lead/customer/partner)' },
    { value: 'tags', label: 'Tags (comma-separated)' },
    { value: 'notes', label: 'Notes' },
  ]

  return (
    <div className="p-8 max-w-5xl">
      <div className="mb-6">
        <button onClick={() => router.back()} className="text-sm text-gray-400 hover:text-gray-600 mb-3">← Contacts</button>
        <h1 className="text-2xl font-bold text-gray-900">Import Contacts</h1>
        <p className="text-gray-500 mt-1">Upload a CSV — up to 500 rows per import. Duplicates (by email) are updated, not doubled.</p>
      </div>

      {/* Upload */}
      <div className="bg-white rounded-xl border-2 border-dashed border-gray-200 p-8 text-center mb-6 hover:border-indigo-300 transition-colors">
        <input ref={fileRef} type="file" accept=".csv" onChange={handleFile} className="hidden" id="csv-upload" />
        <label htmlFor="csv-upload" className="cursor-pointer">
          <div className="text-3xl mb-2">📄</div>
          <p className="text-sm font-medium text-gray-700">Click to upload CSV file</p>
          <p className="text-xs text-gray-400 mt-1">Supports exports from Zoho, HubSpot, Google Contacts, Excel</p>
        </label>
      </div>

      {headers.length > 0 && (
        <>
          {/* Column mapping */}
          <div className="bg-white rounded-xl border border-gray-200 p-5 mb-5">
            <h3 className="font-semibold text-gray-900 mb-3 text-sm">Map Columns ({rows.length} rows detected)</h3>
            <div className="grid grid-cols-2 md:grid-cols-4 gap-3">
              {headers.map((h, i) => (
                <div key={i}>
                  <p className="text-xs text-gray-500 mb-1 truncate">{h}</p>
                  <select
                    value={mapping[i] || ''}
                    onChange={e => updateMapping(i, e.target.value as keyof ParsedRow)}
                    className="w-full border border-gray-200 rounded-lg px-2 py-1.5 text-xs focus:outline-none focus:ring-2 focus:ring-indigo-500"
                  >
                    <option value="">(skip)</option>
                    {fields.map(f => <option key={f.value} value={f.value}>{f.label}</option>)}
                  </select>
                </div>
              ))}
            </div>
          </div>

          {/* Preview */}
          <div className="bg-white rounded-xl border border-gray-200 overflow-hidden mb-5">
            <div className="px-4 py-3 bg-gray-50 border-b border-gray-200">
              <h3 className="font-semibold text-sm text-gray-900">Preview (first 5 rows)</h3>
            </div>
            <table className="w-full text-xs">
              <thead className="bg-gray-50">
                <tr>
                  {['First Name','Last Name','Email','Phone','Type','Tags'].map(h => (
                    <th key={h} className="text-left px-3 py-2 font-semibold text-gray-500">{h}</th>
                  ))}
                </tr>
              </thead>
              <tbody className="divide-y divide-gray-100">
                {rows.slice(0, 5).map((r, i) => (
                  <tr key={i} className={!r.first_name && !r.email ? 'opacity-40' : ''}>
                    <td className="px-3 py-2">{r.first_name || <span className="text-red-400">missing</span>}</td>
                    <td className="px-3 py-2">{r.last_name}</td>
                    <td className="px-3 py-2 text-gray-500">{r.email}</td>
                    <td className="px-3 py-2 text-gray-500">{r.phone}</td>
                    <td className="px-3 py-2">
                      <span className="px-1.5 py-0.5 rounded bg-gray-100 text-gray-600">{r.type || 'lead'}</span>
                    </td>
                    <td className="px-3 py-2 text-gray-500">{r.tags}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>

          {error && <p className="text-sm text-red-500 mb-4">{error}</p>}

          {result ? (
            <div className="bg-green-50 border border-green-200 rounded-xl p-5">
              <p className="font-semibold text-green-700 mb-1">Import complete!</p>
              <p className="text-sm text-green-600">
                <strong>{result.created}</strong> created · <strong>{result.updated}</strong> updated · <strong>{result.skipped}</strong> skipped
              </p>
              <button onClick={() => router.push('/crm/contacts')} className="mt-3 text-sm bg-indigo-600 text-white px-4 py-2 rounded-lg hover:bg-indigo-700">
                View Contacts →
              </button>
            </div>
          ) : (
            <button onClick={runImport} disabled={importing || rows.length === 0}
              className="bg-indigo-600 text-white px-6 py-2.5 rounded-lg text-sm font-medium hover:bg-indigo-700 disabled:opacity-50">
              {importing ? `Importing ${rows.length} contacts...` : `Import ${rows.length} Contacts`}
            </button>
          )}
        </>
      )}
    </div>
  )
}
