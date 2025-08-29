'use client'

import { useState, useEffect } from 'react'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select'
import { Plus, Edit, Trash2, UserPlus } from 'lucide-react'
import { getRoleLevelColor, getStatusColor } from '@/lib/utils'

interface TeamMember {
  id: string
  name: string
  roleId?: string
  level?: 'TEAM_LEAD' | 'SENIOR' | 'JUNIOR'
  defaultRatePerDay: number
  notes?: string
  status: 'ACTIVE' | 'INACTIVE'
  role?: {
    id: string
    name: string
  }
}

interface RateCardRole {
  id: string
  name: string
}

export default function TeamPage() {
  const [teamMembers, setTeamMembers] = useState<TeamMember[]>([])
  const [rateCardRoles, setRateCardRoles] = useState<RateCardRole[]>([])
  const [loading, setLoading] = useState(true)
  const [showAddForm, setShowAddForm] = useState(false)
  const [editingMember, setEditingMember] = useState<TeamMember | null>(null)
  const [formData, setFormData] = useState<{
    name: string
    roleId: string
    level: string
    defaultRatePerDay: number
    notes: string
    status: 'ACTIVE' | 'INACTIVE'
  }>({
    name: '',
    roleId: '',
    level: '',
    defaultRatePerDay: 0,
    notes: '',
    status: 'ACTIVE',
  })

  useEffect(() => {
    fetchTeamMembers()
    fetchRateCardRoles()
  }, [])

  const fetchTeamMembers = async () => {
    try {
      const response = await fetch('/api/team')
      if (response.ok) {
        const data = await response.json()
        setTeamMembers(data)
      }
    } catch (error) {
      console.error('Error fetching team members:', error)
    } finally {
      setLoading(false)
    }
  }

  const fetchRateCardRoles = async () => {
    try {
      const response = await fetch('/api/rate-card')
      if (response.ok) {
        const data = await response.json()
        setRateCardRoles(data)
      }
    } catch (error) {
      console.error('Error fetching rate card roles:', error)
    }
  }

  const resetForm = () => {
    setFormData({
      name: '',
      roleId: '',
      level: '',
      defaultRatePerDay: 0,
      notes: '',
      status: 'ACTIVE',
    })
    setEditingMember(null)
    setShowAddForm(false)
  }

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    
    try {
      const url = editingMember ? `/api/team/${editingMember.id}` : '/api/team'
      const method = editingMember ? 'PATCH' : 'POST'
      
      const response = await fetch(url, {
        method,
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          ...formData,
          defaultRatePerDay: parseInt(formData.defaultRatePerDay.toString()),
          roleId: formData.roleId || undefined,
          level: formData.level || undefined,
        }),
      })

      if (response.ok) {
        await fetchTeamMembers()
        resetForm()
        alert(editingMember ? 'Team member updated successfully!' : 'Team member added successfully!')
      } else {
        alert('Failed to save team member')
      }
    } catch (error) {
      console.error('Error saving team member:', error)
      alert('Failed to save team member')
    }
  }

  const handleEdit = (member: TeamMember) => {
    setEditingMember(member)
    setFormData({
      name: member.name,
      roleId: member.roleId || '',
      level: member.level || '',
      defaultRatePerDay: member.defaultRatePerDay,
      notes: member.notes || '',
      status: member.status,
    })
    setShowAddForm(true)
  }

  const handleDelete = async (id: string) => {
    if (!confirm('Are you sure you want to delete this team member?')) return
    
    try {
      const response = await fetch(`/api/team/${id}`, { method: 'DELETE' })
      if (response.ok) {
        await fetchTeamMembers()
        alert('Team member deleted successfully!')
      } else {
        alert('Failed to delete team member')
      }
    } catch (error) {
      console.error('Error deleting team member:', error)
      alert('Failed to delete team member')
    }
  }

  if (loading) {
    return (
      <div className="container mx-auto px-4 py-8">
        <div className="text-center">Loading...</div>
      </div>
    )
  }

  return (
    <div className="container mx-auto px-4 py-8">
      {/* Header */}
      <div className="mb-8">
        <h1 className="text-4xl font-bold text-gray-900 mb-2">Team Library</h1>
        <p className="text-lg text-gray-600">
          Manage your team members and their default rates
        </p>
      </div>

      {/* Add/Edit Form */}
      {showAddForm && (
        <Card className="mb-6">
          <CardHeader>
            <CardTitle>
              {editingMember ? 'Edit Team Member' : 'Add New Team Member'}
            </CardTitle>
          </CardHeader>
          <CardContent>
            <form onSubmit={handleSubmit} className="space-y-4">
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div>
                  <label className="block text-sm font-medium mb-2">Name</label>
                  <Input
                    value={formData.name}
                    onChange={(e) => setFormData({ ...formData, name: e.target.value })}
                    placeholder="Full name"
                    required
                  />
                </div>
                <div>
                  <label className="block text-sm font-medium mb-2">Role</label>
                  <Select value={formData.roleId} onValueChange={(value) => setFormData({ ...formData, roleId: value })}>
                    <SelectTrigger>
                      <SelectValue placeholder="Select role" />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="">No specific role</SelectItem>
                      {rateCardRoles.map((role) => (
                        <SelectItem key={role.id} value={role.id}>
                          {role.name}
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </div>
                <div>
                  <label className="block text-sm font-medium mb-2">Level</label>
                  <Select value={formData.level} onValueChange={(value) => setFormData({ ...formData, level: value })}>
                    <SelectTrigger>
                      <SelectValue placeholder="Select level" />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="">No specific level</SelectItem>
                      <SelectItem value="TEAM_LEAD">Team Lead</SelectItem>
                      <SelectItem value="SENIOR">Senior</SelectItem>
                      <SelectItem value="JUNIOR">Junior</SelectItem>
                    </SelectContent>
                  </Select>
                </div>
                <div>
                  <label className="block text-sm font-medium mb-2">Default Rate per Day (THB)</label>
                  <Input
                    type="number"
                    value={formData.defaultRatePerDay}
                    onChange={(e) => setFormData({ ...formData, defaultRatePerDay: parseInt(e.target.value) || 0 })}
                    placeholder="2500"
                    min="0"
                    required
                  />
                </div>
                <div>
                  <label className="block text-sm font-medium mb-2">Status</label>
                  <Select value={formData.status} onValueChange={(value: 'ACTIVE' | 'INACTIVE') => setFormData({ ...formData, status: value })}>
                    <SelectTrigger>
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="ACTIVE">Active</SelectItem>
                      <SelectItem value="INACTIVE">Inactive</SelectItem>
                    </SelectContent>
                  </Select>
                </div>
                <div className="md:col-span-2">
                  <label className="block text-sm font-medium mb-2">Notes</label>
                  <Input
                    value={formData.notes}
                    onChange={(e) => setFormData({ ...formData, notes: e.target.value })}
                    placeholder="Additional notes or comments"
                  />
                </div>
              </div>
              <div className="flex space-x-2">
                <Button type="submit">
                  {editingMember ? 'Update Member' : 'Add Member'}
                </Button>
                <Button type="button" variant="outline" onClick={resetForm}>
                  Cancel
                </Button>
              </div>
            </form>
          </CardContent>
        </Card>
      )}

      {/* Team Members List */}
      <Card>
        <CardHeader>
          <div className="flex items-center justify-between">
            <div>
              <CardTitle>Team Members</CardTitle>
              <CardDescription>
                {teamMembers.length} team member{teamMembers.length !== 1 ? 's' : ''}
              </CardDescription>
            </div>
            {!showAddForm && (
              <Button onClick={() => setShowAddForm(true)}>
                <UserPlus className="w-4 h-4 mr-2" />
                Add Member
              </Button>
            )}
          </div>
        </CardHeader>
        <CardContent>
          <div className="overflow-x-auto">
            <table className="w-full">
              <thead>
                <tr className="border-b">
                  <th className="text-left py-3 px-4 font-semibold">Name</th>
                  <th className="text-left py-3 px-4 font-semibold">Role</th>
                  <th className="text-left py-3 px-4 font-semibold">Level</th>
                  <th className="text-left py-3 px-4 font-semibold">Rate/Day</th>
                  <th className="text-left py-3 px-4 font-semibold">Status</th>
                  <th className="text-left py-3 px-4 font-semibold">Notes</th>
                  <th className="text-left py-3 px-4 font-semibold">Actions</th>
                </tr>
              </thead>
              <tbody>
                {teamMembers.map((member) => (
                  <tr key={member.id} className="border-b">
                    <td className="py-4 px-4 font-medium">{member.name}</td>
                    <td className="py-4 px-4">{member.role?.name || '-'}</td>
                    <td className="py-4 px-4">
                      {member.level ? (
                        <span className={`px-2 py-1 rounded-full text-xs font-medium ${getRoleLevelColor(member.level)}`}>
                          {member.level}
                        </span>
                      ) : (
                        '-'
                      )}
                    </td>
                    <td className="py-4 px-4">฿{member.defaultRatePerDay.toLocaleString()}</td>
                    <td className="py-4 px-4">
                      <span className={`px-2 py-1 rounded-full text-xs font-medium ${getStatusColor(member.status)}`}>
                        {member.status}
                      </span>
                    </td>
                    <td className="py-4 px-4 text-sm text-gray-600 max-w-xs truncate">
                      {member.notes || '-'}
                    </td>
                    <td className="py-4 px-4">
                      <div className="flex space-x-2">
                        <Button
                          variant="outline"
                          size="sm"
                          onClick={() => handleEdit(member)}
                        >
                          <Edit className="w-4 h-4" />
                        </Button>
                        <Button
                          variant="outline"
                          size="sm"
                          onClick={() => handleDelete(member.id)}
                        >
                          <Trash2 className="w-4 h-4" />
                        </Button>
                      </div>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </CardContent>
      </Card>
    </div>
  )
}
