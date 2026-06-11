'use client'

import { useEffect, useRef, useState } from 'react'
import type { CrmTask, TaskPriority } from '@/lib/crm-types'

const COLUMNS = [
  { id: 'high',   label: 'High Priority',   color: 'bg-red-50',    badge: 'bg-red-100 text-red-700',    dot: 'bg-red-400' },
  { id: 'medium', label: 'Medium Priority',  color: 'bg-yellow-50', badge: 'bg-yellow-100 text-yellow-700', dot: 'bg-yellow-400' },
  { id: 'low',    label: 'Low Priority',     color: 'bg-blue-50',   badge: 'bg-blue-100 text-blue-600',  dot: 'bg-blue-400' },
  { id: 'done',   label: 'Done',             color: 'bg-gray-50',   badge: 'bg-gray-100 text-gray-500',  dot: 'bg-gray-300' },
] as const

type ColId = (typeof COLUMNS)[number]['id']

function taskColumn(t: CrmTask): ColId {
  return t.completed ? 'done' : (t.priority as ColId)
}

export default function TasksPage() {
  const [tasks, setTasks] = useState<CrmTask[]>([])
  const [loading, setLoading] = useState(true)
  const [showForm, setShowForm] = useState(false)
  const [form, setForm] = useState({ title: '', due_date: '', priority: 'medium' as TaskPriority })
  const [saving, setSaving] = useState(false)
  const [dragOver, setDragOver] = useState<ColId | null>(null)
  const dragging = useRef<string | null>(null)

  const load = async () => {
    setLoading(true)
    const data = await fetch('/api/crm/tasks').then(r => r.json())
    setTasks(Array.isArray(data) ? data : [])
    setLoading(false)
  }

  useEffect(() => { load() }, [])

  const update = async (id: string, patch: Partial<CrmTask>) => {
    setTasks(prev => prev.map(t => t.id === id ? { ...t, ...patch } : t))
    await fetch(`/api/crm/tasks/${id}`, {
      method: 'PUT',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(patch),
    })
  }

  const deleteTask = async (id: string) => {
    setTasks(prev => prev.filter(t => t.id !== id))
    await fetch(`/api/crm/tasks/${id}`, { method: 'DELETE' })
  }

  const saveTask = async (e: React.FormEvent) => {
    e.preventDefault()
    setSaving(true)
    const body = { ...form, due_date: form.due_date || null }
    const res = await fetch('/api/crm/tasks', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(body),
    })
    if (res.ok) {
      setShowForm(false)
      setForm({ title: '', due_date: '', priority: 'medium' })
      load()
    }
    setSaving(false)
  }

  const onDragStart = (id: string) => { dragging.current = id }

  const onDrop = (col: ColId) => {
    const id = dragging.current
    if (!id) return
    dragging.current = null
    setDragOver(null)
    if (col === 'done') {
      update(id, { completed: true })
    } else {
      update(id, { priority: col as TaskPriority, completed: false })
    }
  }

  const overdue = (t: CrmTask) => !t.completed && t.due_date && new Date(t.due_date) < new Date()

  return (
    <div className="p-8">
      <div className="flex items-center justify-between mb-6">
        <div>
          <h1 className="text-2xl font-bold text-gray-900">Tasks</h1>
          <p className="text-gray-500 mt-1">{tasks.filter(t => !t.completed).length} open · drag cards to reprioritize</p>
        </div>
        <button
          onClick={() => setShowForm(!showForm)}
          className="bg-indigo-600 text-white px-4 py-2 rounded-lg text-sm font-medium hover:bg-indigo-700"
        >
          + New Task
        </button>
      </div>

      {showForm && (
        <form onSubmit={saveTask} className="bg-white rounded-xl border border-indigo-200 p-4 mb-6">
          <div className="flex gap-3 items-end flex-wrap">
            <div className="flex-1 min-w-48">
              <input
                required
                placeholder="Task title *"
                value={form.title}
                onChange={e => setForm(f => ({ ...f, title: e.target.value }))}
                className="w-full border border-gray-200 rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-indigo-500"
              />
            </div>
            <input
              type="datetime-local"
              value={form.due_date}
              onChange={e => setForm(f => ({ ...f, due_date: e.target.value }))}
              className="border border-gray-200 rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-indigo-500"
            />
            <select
              value={form.priority}
              onChange={e => setForm(f => ({ ...f, priority: e.target.value as TaskPriority }))}
              className="border border-gray-200 rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-indigo-500"
            >
              <option value="high">High</option>
              <option value="medium">Medium</option>
              <option value="low">Low</option>
            </select>
            <button
              type="submit"
              disabled={saving}
              className="bg-indigo-600 text-white px-4 py-2 rounded-lg text-sm font-medium hover:bg-indigo-700 disabled:opacity-50 whitespace-nowrap"
            >
              {saving ? 'Adding...' : 'Add Task'}
            </button>
          </div>
        </form>
      )}

      {loading ? (
        <div className="text-gray-400 text-sm">Loading...</div>
      ) : (
        <div className="grid grid-cols-4 gap-4 items-start">
          {COLUMNS.map(col => {
            const colTasks = tasks.filter(t => taskColumn(t) === col.id)
            const isOver = dragOver === col.id
            return (
              <div
                key={col.id}
                onDragOver={e => { e.preventDefault(); setDragOver(col.id) }}
                onDragLeave={() => setDragOver(null)}
                onDrop={() => onDrop(col.id)}
                className={`rounded-xl border-2 transition-colors min-h-32 ${isOver ? 'border-indigo-400 bg-indigo-50' : `border-transparent ${col.color}`}`}
              >
                {/* Column header */}
                <div className="px-3 pt-3 pb-2 flex items-center justify-between">
                  <div className="flex items-center gap-2">
                    <span className={`w-2 h-2 rounded-full ${col.dot}`} />
                    <span className="text-xs font-semibold text-gray-600 uppercase tracking-wider">{col.label}</span>
                  </div>
                  <span className={`text-xs font-bold px-2 py-0.5 rounded-full ${col.badge}`}>{colTasks.length}</span>
                </div>

                {/* Drop hint */}
                {isOver && (
                  <div className="mx-3 mb-2 border-2 border-dashed border-indigo-300 rounded-lg h-14 flex items-center justify-center">
                    <span className="text-xs text-indigo-400">Drop here</span>
                  </div>
                )}

                {/* Cards */}
                <div className="px-3 pb-3 space-y-2">
                  {colTasks.length === 0 && !isOver && (
                    <p className="text-xs text-gray-300 text-center py-6">No tasks</p>
                  )}
                  {colTasks.map(t => (
                    <div
                      key={t.id}
                      draggable
                      onDragStart={() => onDragStart(t.id)}
                      className={`bg-white rounded-lg border border-gray-100 p-3 cursor-grab active:cursor-grabbing shadow-sm hover:shadow-md transition-shadow select-none ${t.completed ? 'opacity-60' : ''}`}
                    >
                      <div className="flex items-start justify-between gap-2">
                        <p className={`text-sm text-gray-900 flex-1 leading-snug ${t.completed ? 'line-through text-gray-400' : ''}`}>
                          {t.title}
                        </p>
                        <button
                          onClick={() => deleteTask(t.id)}
                          className="text-gray-200 hover:text-red-400 flex-shrink-0 leading-none mt-0.5"
                        >
                          ✕
                        </button>
                      </div>

                      <div className="mt-2 flex flex-wrap items-center gap-1.5">
                        {t.contact && (
                          <span className="text-xs text-gray-400 bg-gray-50 px-1.5 py-0.5 rounded">
                            {t.contact.first_name} {t.contact.last_name}
                          </span>
                        )}
                        {t.due_date && (
                          <span className={`text-xs px-1.5 py-0.5 rounded font-medium ${overdue(t) ? 'bg-red-50 text-red-500' : 'text-gray-400 bg-gray-50'}`}>
                            {overdue(t) ? '⚠ ' : ''}{new Date(t.due_date).toLocaleDateString()}
                          </span>
                        )}
                        {col.id !== 'done' && (
                          <button
                            onClick={() => update(t.id, { completed: true })}
                            className="ml-auto text-xs text-gray-300 hover:text-green-500 transition-colors"
                            title="Mark done"
                          >
                            ✓
                          </button>
                        )}
                        {col.id === 'done' && (
                          <button
                            onClick={() => update(t.id, { completed: false })}
                            className="ml-auto text-xs text-gray-300 hover:text-indigo-500 transition-colors"
                            title="Reopen"
                          >
                            ↩
                          </button>
                        )}
                      </div>
                    </div>
                  ))}
                </div>
              </div>
            )
          })}
        </div>
      )}
    </div>
  )
}
