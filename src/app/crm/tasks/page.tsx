'use client'

import { useEffect, useState } from 'react'
import { PRIORITY_BADGE, type CrmTask, type TaskPriority } from '@/lib/crm-types'

export default function TasksPage() {
  const [tasks, setTasks] = useState<CrmTask[]>([])
  const [showDone, setShowDone] = useState(false)
  const [loading, setLoading] = useState(true)
  const [showForm, setShowForm] = useState(false)
  const [form, setForm] = useState({ title: '', due_date: '', priority: 'medium' as TaskPriority })
  const [saving, setSaving] = useState(false)

  const load = async () => {
    setLoading(true)
    const url = showDone ? '/api/crm/tasks' : '/api/crm/tasks?completed=false'
    const data = await fetch(url).then(r => r.json())
    setTasks(Array.isArray(data) ? data : [])
    setLoading(false)
  }

  useEffect(() => { load() }, [showDone])

  const toggle = async (task: CrmTask) => {
    await fetch(`/api/crm/tasks/${task.id}`, {
      method: 'PUT',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ completed: !task.completed })
    })
    load()
  }

  const saveTask = async (e: React.FormEvent) => {
    e.preventDefault()
    setSaving(true)
    const body = { ...form, due_date: form.due_date || null }
    const res = await fetch('/api/crm/tasks', { method: 'POST', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify(body) })
    if (res.ok) { setShowForm(false); setForm({ title: '', due_date: '', priority: 'medium' }); load() }
    setSaving(false)
  }

  const deleteTask = async (id: string) => {
    await fetch(`/api/crm/tasks/${id}`, { method: 'DELETE' })
    load()
  }

  const overdue = (t: CrmTask) => !t.completed && t.due_date && new Date(t.due_date) < new Date()

  return (
    <div className="p-8 max-w-3xl">
      <div className="flex items-center justify-between mb-6">
        <div>
          <h1 className="text-2xl font-bold text-gray-900">Tasks</h1>
          <p className="text-gray-500 mt-1">{tasks.filter(t => !t.completed).length} open</p>
        </div>
        <div className="flex gap-2">
          <button onClick={() => setShowDone(!showDone)} className={`text-sm px-3 py-2 rounded-lg border transition-colors ${showDone ? 'bg-gray-100 border-gray-300' : 'border-gray-200 text-gray-500 hover:bg-gray-50'}`}>
            {showDone ? 'Hide Done' : 'Show Done'}
          </button>
          <button onClick={() => setShowForm(!showForm)} className="bg-indigo-600 text-white px-4 py-2 rounded-lg text-sm font-medium hover:bg-indigo-700">
            + New Task
          </button>
        </div>
      </div>

      {showForm && (
        <form onSubmit={saveTask} className="bg-white rounded-xl border border-indigo-200 p-4 mb-5">
          <div className="flex gap-3 items-end">
            <div className="flex-1">
              <input required placeholder="Task title *" value={form.title} onChange={e => setForm(f => ({...f, title: e.target.value}))}
                className="w-full border border-gray-200 rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-indigo-500" />
            </div>
            <input type="datetime-local" value={form.due_date} onChange={e => setForm(f => ({...f, due_date: e.target.value}))}
              className="border border-gray-200 rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-indigo-500" />
            <select value={form.priority} onChange={e => setForm(f => ({...f, priority: e.target.value as TaskPriority}))}
              className="border border-gray-200 rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-indigo-500">
              <option value="low">Low</option>
              <option value="medium">Medium</option>
              <option value="high">High</option>
            </select>
            <button type="submit" disabled={saving} className="bg-indigo-600 text-white px-4 py-2 rounded-lg text-sm font-medium hover:bg-indigo-700 disabled:opacity-50 whitespace-nowrap">
              {saving ? 'Adding...' : 'Add Task'}
            </button>
          </div>
        </form>
      )}

      {loading ? (
        <div className="text-gray-400 text-sm">Loading...</div>
      ) : tasks.length === 0 ? (
        <div className="bg-white rounded-xl border border-gray-200 p-12 text-center">
          <p className="text-gray-400 mb-2">No tasks</p>
          <button onClick={() => setShowForm(true)} className="text-indigo-600 text-sm hover:underline">Add your first task</button>
        </div>
      ) : (
        <div className="bg-white rounded-xl border border-gray-200 divide-y divide-gray-100">
          {tasks.map(t => (
            <div key={t.id} className={`flex items-center gap-3 px-4 py-3 ${t.completed ? 'opacity-50' : ''}`}>
              <button onClick={() => toggle(t)} className={`w-5 h-5 rounded border-2 flex-shrink-0 flex items-center justify-center transition-colors ${t.completed ? 'bg-indigo-600 border-indigo-600 text-white' : 'border-gray-300 hover:border-indigo-400'}`}>
                {t.completed && <svg className="w-3 h-3" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={3} d="M5 13l4 4L19 7" /></svg>}
              </button>

              <div className="flex-1 min-w-0">
                <p className={`text-sm text-gray-900 ${t.completed ? 'line-through' : ''}`}>{t.title}</p>
                <div className="flex items-center gap-2 mt-0.5">
                  {t.contact && <span className="text-xs text-gray-400">{t.contact.first_name} {t.contact.last_name}</span>}
                  {t.due_date && (
                    <span className={`text-xs ${overdue(t) ? 'text-red-500 font-medium' : 'text-gray-400'}`}>
                      {overdue(t) ? '⚠ ' : ''}{new Date(t.due_date).toLocaleDateString()}
                    </span>
                  )}
                </div>
              </div>

              <span className={`text-xs px-2 py-0.5 rounded-full font-medium flex-shrink-0 ${PRIORITY_BADGE[t.priority]}`}>{t.priority}</span>

              <button onClick={() => deleteTask(t.id)} className="text-gray-300 hover:text-red-400 flex-shrink-0 text-sm">✕</button>
            </div>
          ))}
        </div>
      )}
    </div>
  )
}
