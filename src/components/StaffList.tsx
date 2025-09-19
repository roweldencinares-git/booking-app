'use client'

import { useState } from 'react'
import { useRouter } from 'next/navigation'

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
  const [editForm, setEditForm] = useState({
    first_name: '',
    last_name: '',
    email: '',
    timezone: '',
    role: ''
  })

  const roles = [
    { value: 'admin', label: '👑 Admin', description: 'Full access to all features' },
    { value: 'manager', label: '👔 Manager', description: 'Manage bookings and staff' },
    { value: 'staff', label: '👤 Staff', description: 'View own bookings and schedule' },
    { value: 'viewer', label: '👁️ Viewer', description: 'View-only access' }
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

  const deleteStaff = async (staffId: string, staffName: string) => {
    if (!confirm(`Are you sure you want to remove ${staffName} from your team?\n\nThis action cannot be undone.`)) {
      return
    }

    setLoading(staffId)

    try {
      const response = await fetch(`/api/staff/${staffId}`, {
        method: 'DELETE'
      })

      if (response.ok) {
        router.refresh()
      } else {
        alert('Failed to delete staff member')
      }
    } catch (error) {
      console.error('Error deleting staff:', error)
      alert('Error deleting staff member')
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
      role: member.role || 'staff'
    })
  }

  const handleEditSubmit = (e: React.FormEvent, staffId: string) => {
    e.preventDefault()
    updateStaff(staffId, editForm)
  }

  const getRoleDisplay = (role?: string) => {
    const roleInfo = roles.find(r => r.value === role)
    return roleInfo ? roleInfo.label : '👤 Staff'
  }

  const getStatusColor = (status?: string) => {
    return status === 'active' ? 'bg-green-100 text-green-800' : 'bg-red-100 text-red-800'
  }

  if (staff.length === 0) {
    return (
      <div className="p-6 text-center">
        <div className="text-gray-400 mb-2">
          <svg className="mx-auto h-12 w-12" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 4.354a4 4 0 110 5.292M15 21H3v-1a6 6 0 0112 0v1zm0 0h6v-1a6 6 0 00-9-5.197m13.5-9a2.25 2.25 0 11-4.5 0 2.25 2.25 0 014.5 0z" />
          </svg>
        </div>
        <h3 className="text-lg font-medium text-gray-900 mb-2">No team members yet</h3>
        <p className="text-gray-500">Add your first team member to get started.</p>
      </div>
    )
  }

  return (
    <div className="divide-y divide-gray-200">
      {staff.map((member) => (
        <div key={member.id} className="p-6">
          {editingStaff === member.id ? (
            // Edit Form
            <form onSubmit={(e) => handleEditSubmit(e, member.id)} className="space-y-4">
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div>
                  <label className="block text-sm font-medium text-gray-700">First Name</label>
                  <input
                    type="text"
                    value={editForm.first_name}
                    onChange={(e) => setEditForm({...editForm, first_name: e.target.value})}
                    className="mt-1 block w-full border border-gray-300 rounded-md px-3 py-2 shadow-sm focus:outline-none focus:ring-indigo-500 focus:border-indigo-500"
                    required
                  />
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700">Last Name</label>
                  <input
                    type="text"
                    value={editForm.last_name}
                    onChange={(e) => setEditForm({...editForm, last_name: e.target.value})}
                    className="mt-1 block w-full border border-gray-300 rounded-md px-3 py-2 shadow-sm focus:outline-none focus:ring-indigo-500 focus:border-indigo-500"
                    required
                  />
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700">Email</label>
                  <input
                    type="email"
                    value={editForm.email}
                    onChange={(e) => setEditForm({...editForm, email: e.target.value})}
                    className="mt-1 block w-full border border-gray-300 rounded-md px-3 py-2 shadow-sm focus:outline-none focus:ring-indigo-500 focus:border-indigo-500"
                    required
                  />
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700">Timezone</label>
                  <select
                    value={editForm.timezone}
                    onChange={(e) => setEditForm({...editForm, timezone: e.target.value})}
                    className="mt-1 block w-full border border-gray-300 rounded-md px-3 py-2 shadow-sm focus:outline-none focus:ring-indigo-500 focus:border-indigo-500"
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
                  <label className="block text-sm font-medium text-gray-700">Role</label>
                  <select
                    value={editForm.role}
                    onChange={(e) => setEditForm({...editForm, role: e.target.value})}
                    className="mt-1 block w-full border border-gray-300 rounded-md px-3 py-2 shadow-sm focus:outline-none focus:ring-indigo-500 focus:border-indigo-500"
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
                  className="px-4 py-2 border border-gray-300 rounded-md text-sm font-medium text-gray-700 bg-white hover:bg-gray-50"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  disabled={loading === member.id}
                  className="px-4 py-2 border border-transparent rounded-md shadow-sm text-sm font-medium text-white bg-indigo-600 hover:bg-indigo-700 disabled:opacity-50"
                >
                  {loading === member.id ? 'Saving...' : 'Save Changes'}
                </button>
              </div>
            </form>
          ) : (
            // Display Mode
            <div className="flex items-center justify-between">
              <div className="flex-1">
                <div className="flex items-center space-x-3">
                  <div className="flex-shrink-0">
                    <div className="h-12 w-12 rounded-full bg-indigo-500 flex items-center justify-center">
                      <span className="text-sm font-medium text-white">
                        {member.first_name?.charAt(0)}{member.last_name?.charAt(0)}
                      </span>
                    </div>
                  </div>
                  <div>
                    <h3 className="text-lg font-medium text-gray-900">
                      {member.first_name} {member.last_name}
                    </h3>
                    <p className="text-sm text-gray-500">{member.email}</p>
                    <div className="mt-1 flex items-center space-x-3 text-xs">
                      <span className="text-gray-400">
                        Joined {new Date(member.created_at).toLocaleDateString()}
                      </span>
                      {member.last_login && (
                        <span className="text-gray-400">
                          Last active {new Date(member.last_login).toLocaleDateString()}
                        </span>
                      )}
                    </div>
                  </div>
                </div>

                <div className="mt-3 flex items-center space-x-3">
                  <span className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium ${getStatusColor(member.status)}`}>
                    {member.status === 'active' ? '✅ Active' : '❌ Inactive'}
                  </span>
                  <span className="inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium bg-blue-100 text-blue-800">
                    {getRoleDisplay(member.role)}
                  </span>
                  <span className="text-sm text-gray-500">🌍 {member.timezone}</span>
                </div>
              </div>

              <div className="flex items-center space-x-2">
                <div className="flex flex-col space-y-1">
                  <a
                    href={`/dashboard/staff/${member.id}/schedule`}
                    className="inline-flex items-center px-3 py-1 border border-gray-300 text-sm leading-4 font-medium rounded-md text-gray-700 bg-white hover:bg-gray-50 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-indigo-500"
                  >
                    📅 Schedule
                  </a>
                  <div className="flex space-x-1">
                    <button
                      onClick={() => startEdit(member)}
                      disabled={loading === member.id}
                      className="inline-flex items-center px-2 py-1 border border-gray-300 text-xs leading-4 font-medium rounded text-gray-700 bg-white hover:bg-gray-50 disabled:opacity-50"
                    >
                      ✏️ Edit
                    </button>
                    <a
                      href={`/dashboard/staff/${member.id}/config`}
                      className="inline-flex items-center px-2 py-1 border border-blue-300 text-xs leading-4 font-medium rounded text-blue-700 bg-blue-50 hover:bg-blue-100"
                    >
                      ⚙️ Config
                    </a>
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
                    <button
                      onClick={() => deleteStaff(member.id, `${member.first_name} ${member.last_name}`)}
                      disabled={loading === member.id}
                      className="inline-flex items-center px-2 py-1 border border-red-300 text-xs leading-4 font-medium rounded text-red-700 bg-red-50 hover:bg-red-100 disabled:opacity-50"
                    >
                      🗑️ Delete
                    </button>
                  </div>
                </div>
              </div>
            </div>
          )}
        </div>
      ))}
    </div>
  )
}