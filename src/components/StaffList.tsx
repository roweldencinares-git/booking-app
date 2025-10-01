'use client'

import { useState } from 'react'
import { useRouter } from 'next/navigation'
import DeleteStaffModal from './DeleteStaffModal'

interface Staff {
  id: string
  first_name: string
  last_name: string
  email: string
  role?: string
  timezone: string
  status?: string
  created_at: string
  last_login?: string
}

interface StaffListProps {
  staff: Staff[]
}

export default function StaffList({ staff }: StaffListProps) {
  const router = useRouter()
  const [loading, setLoading] = useState<string | null>(null)
  const [editingStaff, setEditingStaff] = useState<string | null>(null)
  const [configuringStaff, setConfiguringStaff] = useState<string | null>(null)
  const [deletingStaff, setDeletingStaff] = useState<Staff | null>(null)
  const [editForm, setEditForm] = useState({
    first_name: '',
    last_name: '',
    email: '',
    timezone: '',
    role: ''
  })
  const [configForm, setConfigForm] = useState({
    working_hours: {
      monday: { enabled: true, start: '09:00', end: '17:00' },
      tuesday: { enabled: true, start: '09:00', end: '17:00' },
      wednesday: { enabled: true, start: '09:00', end: '17:00' },
      thursday: { enabled: true, start: '09:00', end: '17:00' },
      friday: { enabled: true, start: '09:00', end: '17:00' },
      saturday: { enabled: false, start: '09:00', end: '17:00' },
      sunday: { enabled: false, start: '09:00', end: '17:00' }
    },
    buffer_minutes: 15,
    advance_booking_days: 30
  })

  const roles = [
    { value: 'admin', label: '👑 Admin', description: 'Full access to all features' }
  ]

  const updateStaff = async (staffId: string, updates: any) => {
    setLoading(staffId)

    try {
      const response = await fetch(`/api/staff/${staffId}`, {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(updates)
      })

      if (response.ok) {
        router.refresh()
        setEditingStaff(null)
      } else {
        alert('Failed to update staff member')
      }
    } catch (error) {
      console.error('Error updating staff:', error)
      alert('Error updating staff member')
    } finally {
      setLoading(null)
    }
  }

  const restoreStaff = async (staffId: string, staffName: string) => {
    if (!confirm(`Restore ${staffName} to active status?`)) {
      return
    }

    setLoading(staffId)

    try {
      const response = await fetch(`/api/staff/${staffId}`, {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ status: 'active' })
      })

      if (response.ok) {
        router.refresh()
      } else {
        alert('Failed to restore staff member')
      }
    } catch (error) {
      console.error('Error restoring staff:', error)
      alert('Error restoring staff member')
    } finally {
      setLoading(null)
    }
  }

  const toggleStatus = async (staffId: string, currentStatus: string) => {
    const newStatus = currentStatus === 'active' ? 'inactive' : 'active'
    await updateStaff(staffId, { status: newStatus })
  }

  const startEdit = (member: Staff) => {
    setEditingStaff(member.id)
    setEditForm({
      first_name: member.first_name,
      last_name: member.last_name,
      email: member.email,
      timezone: member.timezone,
      role: member.role || 'admin'
    })
  }

  const startConfig = (member: Staff) => {
    setConfiguringStaff(member.id)
    // Reset to default config (in real app, would load from API)
    setConfigForm({
      working_hours: {
        monday: { enabled: true, start: '09:00', end: '17:00' },
        tuesday: { enabled: true, start: '09:00', end: '17:00' },
        wednesday: { enabled: true, start: '09:00', end: '17:00' },
        thursday: { enabled: true, start: '09:00', end: '17:00' },
        friday: { enabled: true, start: '09:00', end: '17:00' },
        saturday: { enabled: false, start: '09:00', end: '17:00' },
        sunday: { enabled: false, start: '09:00', end: '17:00' }
      },
      buffer_minutes: 15,
      advance_booking_days: 30
    })
  }

  const handleConfigSubmit = async (e: React.FormEvent, staffId: string) => {
    e.preventDefault()
    console.log('Saving config for staff:', staffId, configForm)
    // In real app, would save to API/database
    alert('Configuration saved! (Demo mode)')
    setConfiguringStaff(null)
  }

  const handleEditSubmit = (e: React.FormEvent, staffId: string) => {
    e.preventDefault()
    updateStaff(staffId, editForm)
  }

  const getRoleDisplay = (role?: string) => {
    const roleInfo = roles.find(r => r.value === role)
    return roleInfo ? roleInfo.label : '👑 Admin'
  }

  const getStatusColor = (status?: string) => {
    if (status === 'deleted') return 'bg-red-100 text-red-800'
    return status === 'active' ? 'bg-green-100 text-green-800' : 'bg-yellow-100 text-yellow-800'
  }

  const getStatusLabel = (status?: string) => {
    if (status === 'deleted') return '🗑️ Deleted'
    if (status === 'active') return '✅ Active'
    if (status === 'inactive') return '⏸️ Inactive'
    return '✅ Active'
  }

  const handleDeleteStaff = async (options: any) => {
    if (!deletingStaff) return

    try {
      setLoading(deletingStaff.id)
      console.log('Deleting staff with options:', options)

      const response = await fetch(`/api/staff/${deletingStaff.id}`, {
        method: 'DELETE',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(options)
      })

      const data = await response.json()
      console.log('Delete response:', { status: response.status, data })

      if (!response.ok) {
        throw new Error(data.error || 'Failed to delete staff member')
      }

      // Refresh the page to show updated staff list
      router.refresh()
      setDeletingStaff(null)
    } catch (error) {
      console.error('Error deleting staff:', error)
      throw error
    } finally {
      setLoading(null)
    }
  }

  const startDelete = (member: Staff) => {
    setDeletingStaff(member)
  }

  // Get available staff for transfer (excluding the one being deleted)
  const availableStaff = staff.filter(member =>
    member.id !== deletingStaff?.id &&
    member.status !== 'deleted' &&
    member.status !== 'inactive'
  ).map(member => ({
    id: member.id,
    first_name: member.first_name,
    last_name: member.last_name
  }))

  if (staff.length === 0) {
    return (
      <div className="p-6 text-center">
        <div className="text-accent-grey-400 mb-2">
          <svg className="mx-auto h-12 w-12" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 4.354a4 4 0 110 5.292M15 21H3v-1a6 6 0 0112 0v1zm0 0h6v-1a6 6 0 00-9-5.197m13.5-9a2.25 2.25 0 11-4.5 0 2.25 2.25 0 014.5 0z" />
          </svg>
        </div>
        <h3 className="text-lg font-medium text-accent-grey-900 mb-2">No team members yet</h3>
        <p className="text-accent-grey-500">Add your first team member to get started.</p>
      </div>
    )
  }

  return (
    <div className="divide-y divide-accent-grey-200">
      {staff.map((member) => (
        <div key={member.id} className="p-6">
          {editingStaff === member.id ? (
            // Edit Form
            <form onSubmit={(e) => handleEditSubmit(e, member.id)} className="space-y-4">
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div>
                  <label className="block text-sm font-medium text-accent-grey-700">First Name</label>
                  <input
                    type="text"
                    value={editForm.first_name}
                    onChange={(e) => setEditForm({...editForm, first_name: e.target.value})}
                    className="mt-1 block w-full border border-accent-grey-300 rounded-md px-3 py-2 shadow-sm focus:outline-none focus:ring-primary-blue focus:border-primary-blue"
                    required
                  />
                </div>
                <div>
                  <label className="block text-sm font-medium text-accent-grey-700">Last Name</label>
                  <input
                    type="text"
                    value={editForm.last_name}
                    onChange={(e) => setEditForm({...editForm, last_name: e.target.value})}
                    className="mt-1 block w-full border border-accent-grey-300 rounded-md px-3 py-2 shadow-sm focus:outline-none focus:ring-primary-blue focus:border-primary-blue"
                    required
                  />
                </div>
                <div>
                  <label className="block text-sm font-medium text-accent-grey-700">Email</label>
                  <input
                    type="email"
                    value={editForm.email}
                    onChange={(e) => setEditForm({...editForm, email: e.target.value})}
                    className="mt-1 block w-full border border-accent-grey-300 rounded-md px-3 py-2 shadow-sm focus:outline-none focus:ring-primary-blue focus:border-primary-blue"
                    required
                  />
                </div>
                <div>
                  <label className="block text-sm font-medium text-accent-grey-700">Timezone</label>
                  <select
                    value={editForm.timezone}
                    onChange={(e) => setEditForm({...editForm, timezone: e.target.value})}
                    className="mt-1 block w-full border border-accent-grey-300 rounded-md px-3 py-2 shadow-sm focus:outline-none focus:ring-primary-blue focus:border-primary-blue"
                  >
                    <option value="UTC">UTC</option>
                    <option value="America/New_York">Eastern Time</option>
                    <option value="America/Chicago">Central Time</option>
                    <option value="America/Denver">Mountain Time</option>
                    <option value="America/Los_Angeles">Pacific Time</option>
                    <option value="Asia/Manila">Philippines</option>
                    <option value="Europe/London">London</option>
                  </select>
                </div>
                <div className="md:col-span-2">
                  <label className="block text-sm font-medium text-accent-grey-700">Role</label>
                  <select
                    value={editForm.role}
                    onChange={(e) => setEditForm({...editForm, role: e.target.value})}
                    className="mt-1 block w-full border border-accent-grey-300 rounded-md px-3 py-2 shadow-sm focus:outline-none focus:ring-primary-blue focus:border-primary-blue"
                  >
                    {roles.map(role => (
                      <option key={role.value} value={role.value}>
                        {role.label} - {role.description}
                      </option>
                    ))}
                  </select>
                </div>
              </div>
              <div className="flex justify-end space-x-3">
                <button
                  type="button"
                  onClick={() => setEditingStaff(null)}
                  className="px-4 py-2 border border-accent-grey-300 rounded-md text-sm font-medium text-accent-grey-700 bg-white hover:bg-accent-grey-50 transition-colors"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  disabled={loading === member.id}
                  className="px-4 py-2 border border-transparent rounded-md shadow-sm text-sm font-medium text-white bg-primary-blue hover:bg-primary-teal transition-colors disabled:opacity-50"
                >
                  {loading === member.id ? 'Saving...' : 'Save Changes'}
                </button>
              </div>
            </form>
          ) : configuringStaff === member.id ? (
            // Configuration Form
            <form onSubmit={(e) => handleConfigSubmit(e, member.id)} className="space-y-6">
              <div className="bg-accent-light-blue p-4 rounded-lg">
                <h3 className="text-lg font-medium text-primary-blue mb-2">
                  ⚙️ Configuration for {member.first_name} {member.last_name}
                </h3>
                <p className="text-primary-blue text-sm">
                  Set working hours, booking preferences, and availability settings
                </p>
              </div>

              {/* Working Hours */}
              <div className="bg-white border rounded-lg p-4">
                <h4 className="font-medium text-accent-grey-900 mb-3">🕒 Working Hours</h4>
                <div className="space-y-2">
                  {Object.entries(configForm.working_hours).map(([day, settings]) => (
                    <div key={day} className="flex items-center space-x-3">
                      <div className="w-20">
                        <label className="flex items-center">
                          <input
                            type="checkbox"
                            checked={settings.enabled}
                            onChange={(e) => setConfigForm({
                              ...configForm,
                              working_hours: {
                                ...configForm.working_hours,
                                [day]: { ...settings, enabled: e.target.checked }
                              }
                            })}
                            className="h-4 w-4 text-primary-blue border-accent-grey-300 rounded"
                          />
                          <span className="ml-2 text-sm text-accent-grey-700 capitalize">{day}</span>
                        </label>
                      </div>
                      {settings.enabled && (
                        <>
                          <input
                            type="time"
                            value={settings.start}
                            onChange={(e) => setConfigForm({
                              ...configForm,
                              working_hours: {
                                ...configForm.working_hours,
                                [day]: { ...settings, start: e.target.value }
                              }
                            })}
                            className="border border-accent-grey-300 rounded px-2 py-1 text-sm"
                          />
                          <span className="text-accent-grey-500">to</span>
                          <input
                            type="time"
                            value={settings.end}
                            onChange={(e) => setConfigForm({
                              ...configForm,
                              working_hours: {
                                ...configForm.working_hours,
                                [day]: { ...settings, end: e.target.value }
                              }
                            })}
                            className="border border-accent-grey-300 rounded px-2 py-1 text-sm"
                          />
                        </>
                      )}
                    </div>
                  ))}
                </div>
              </div>

              {/* Booking Settings */}
              <div className="bg-white border rounded-lg p-4">
                <h4 className="font-medium text-accent-grey-900 mb-3">📅 Booking Settings</h4>
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <div>
                    <label className="block text-sm font-medium text-accent-grey-700">
                      Buffer Time (minutes)
                    </label>
                    <input
                      type="number"
                      min="0"
                      max="60"
                      value={configForm.buffer_minutes}
                      onChange={(e) => setConfigForm({ ...configForm, buffer_minutes: parseInt(e.target.value) })}
                      className="mt-1 block w-full border border-accent-grey-300 rounded-md px-3 py-2"
                    />
                    <p className="text-xs text-accent-grey-500 mt-1">Time between bookings</p>
                  </div>
                  <div>
                    <label className="block text-sm font-medium text-accent-grey-700">
                      Advance Booking (days)
                    </label>
                    <input
                      type="number"
                      min="1"
                      max="365"
                      value={configForm.advance_booking_days}
                      onChange={(e) => setConfigForm({ ...configForm, advance_booking_days: parseInt(e.target.value) })}
                      className="mt-1 block w-full border border-accent-grey-300 rounded-md px-3 py-2"
                    />
                    <p className="text-xs text-accent-grey-500 mt-1">How far ahead bookings allowed</p>
                  </div>
                </div>
              </div>

              <div className="flex justify-end space-x-3">
                <button
                  type="button"
                  onClick={() => setConfiguringStaff(null)}
                  className="px-4 py-2 border border-accent-grey-300 rounded-md text-sm font-medium text-accent-grey-700 bg-white hover:bg-accent-grey-50 transition-colors"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  className="px-4 py-2 border border-transparent rounded-md shadow-sm text-sm font-medium text-white bg-primary-blue hover:bg-primary-teal transition-colors"
                >
                  Save Configuration
                </button>
              </div>
            </form>
          ) : (
            // Display Mode
            <div className="flex items-center justify-between">
              <div className="flex-1">
                <div className="flex items-center space-x-3">
                  <div className="flex-shrink-0">
                    <div className="h-12 w-12 rounded-full bg-primary-blue flex items-center justify-center">
                      <span className="text-sm font-medium text-white">
                        {member.first_name?.charAt(0)}{member.last_name?.charAt(0)}
                      </span>
                    </div>
                  </div>
                  <div>
                    <h3 className="text-lg font-medium text-accent-grey-900">
                      {member.first_name} {member.last_name}
                    </h3>
                    <p className="text-sm text-accent-grey-500">{member.email}</p>
                    <div className="mt-1 flex items-center space-x-3 text-xs">
                      <span className="text-accent-grey-400">
                        Joined {new Date(member.created_at).toLocaleDateString()}
                      </span>
                      {member.last_login && (
                        <span className="text-accent-grey-400">
                          Last active {new Date(member.last_login).toLocaleDateString()}
                        </span>
                      )}
                    </div>
                  </div>
                </div>

                <div className="mt-3 flex items-center space-x-3">
                  <span className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium ${getStatusColor(member.status)}`}>
                    {getStatusLabel(member.status)}
                  </span>
                  <span className="inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium bg-accent-light-blue text-primary-blue">
                    {getRoleDisplay(member.role)}
                  </span>
                  <span className="text-sm text-accent-grey-500">🌍 {member.timezone}</span>
                </div>
              </div>

              <div className="flex items-center space-x-2">
                <div className="flex flex-col space-y-1">
                  <a
                    href={`/admin/staff/${member.id}/schedule`}
                    className="inline-flex items-center px-3 py-1 border border-accent-grey-300 text-sm leading-4 font-medium rounded-md text-accent-grey-700 bg-white hover:bg-accent-grey-50 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-primary-blue transition-colors"
                  >
                    📅 Schedule
                  </a>
                  <div className="flex space-x-1">
                    <button
                      onClick={() => startEdit(member)}
                      disabled={loading === member.id}
                      className="inline-flex items-center px-2 py-1 border border-accent-grey-300 text-xs leading-4 font-medium rounded text-accent-grey-700 bg-white hover:bg-accent-grey-50 transition-colors disabled:opacity-50"
                    >
                      ✏️ Edit
                    </button>
                    <button
                      onClick={() => startConfig(member)}
                      disabled={loading === member.id}
                      className="inline-flex items-center px-2 py-1 border border-primary-blue text-xs leading-4 font-medium rounded text-primary-blue bg-accent-light-blue hover:bg-primary-teal hover:text-white transition-colors disabled:opacity-50"
                    >
                      ⚙️ Config
                    </button>
                    {member.status === 'deleted' ? (
                      <button
                        onClick={() => restoreStaff(member.id, `${member.first_name} ${member.last_name}`)}
                        disabled={loading === member.id}
                        className="inline-flex items-center px-2 py-1 border border-green-300 text-xs leading-4 font-medium rounded text-green-700 bg-green-50 hover:bg-green-100 disabled:opacity-50"
                      >
                        🔄 Restore
                      </button>
                    ) : (
                      <>
                        <button
                          onClick={() => startDelete(member)}
                          disabled={loading === member.id}
                          className="inline-flex items-center px-2 py-1 border border-red-300 text-xs leading-4 font-medium rounded text-red-700 bg-red-50 hover:bg-red-100 disabled:opacity-50"
                        >
                          🗑️ Delete
                        </button>
                        <button
                          onClick={() => toggleStatus(member.id, member.status || 'active')}
                          disabled={loading === member.id}
                          className={`inline-flex items-center px-2 py-1 border text-xs leading-4 font-medium rounded disabled:opacity-50 ${
                            member.status === 'active'
                              ? 'border-red-300 text-red-700 bg-red-50 hover:bg-red-100'
                              : 'border-green-300 text-green-700 bg-green-50 hover:bg-green-100'
                          }`}
                        >
                          {member.status === 'active' ? '⏸️ Deactivate' : '▶️ Activate'}
                        </button>
                      </>
                    )}
                  </div>
                </div>
              </div>
            </div>
          )}
        </div>
      ))}

      {/* Delete Staff Modal */}
      <DeleteStaffModal
        isOpen={!!deletingStaff}
        onClose={() => setDeletingStaff(null)}
        staff={deletingStaff || { id: '', first_name: '', last_name: '', email: '' }}
        onDelete={handleDeleteStaff}
        availableStaff={availableStaff}
      />
    </div>
  )
}