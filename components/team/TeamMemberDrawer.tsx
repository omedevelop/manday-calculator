'use client'

import { useState, useEffect } from 'react'
import { Dialog, DialogContent, DialogDescription, DialogFooter, DialogHeader, DialogTitle } from '@/components/ui/dialog'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select'
import { Badge } from '@/components/ui/badge'
import { Loader2, AlertCircle } from 'lucide-react'
import { TeamMemberCreateSchema, TeamMemberUpdateSchema, type TeamMemberCreate, type LevelType } from '@/lib/validators/team'
import { ZodError } from 'zod'

interface TeamMember {
  id: string
  name: string
  roleId?: string | null
  roleName: string
  level: LevelType
  defaultRatePerDay: number
  notes?: string | null
  status: 'ACTIVE' | 'INACTIVE'
}

interface RateCardRole {
  id: string
  name: string
  tiers: {
    id: string
    level: LevelType
    pricePerDay: number
    active: boolean
  }[]
}

interface TeamMemberDrawerProps {
  open: boolean
  onOpenChange: (open: boolean) => void
  member?: TeamMember | null
  onSave: () => void
  rateCardRoles: RateCardRole[]
}

interface FormData {
  name: string
  roleId: string
  roleName: string
  level: LevelType | ''
  defaultRatePerDay: string
  notes: string
  status: 'ACTIVE' | 'INACTIVE'
}

interface FormErrors {
  [key: string]: string
}

export function TeamMemberDrawer({ 
  open, 
  onOpenChange, 
  member, 
  onSave, 
  rateCardRoles 
}: TeamMemberDrawerProps) {
  const [formData, setFormData] = useState<FormData>({
    name: '',
    roleId: '',
    roleName: '',
    level: '',
    defaultRatePerDay: '',
    notes: '',
    status: 'ACTIVE'
  })
  
  const [errors, setErrors] = useState<FormErrors>({})
  const [loading, setLoading] = useState(false)
  const [customRole, setCustomRole] = useState(false)

  // Reset form when drawer opens/closes or member changes
  useEffect(() => {
    if (open) {
      if (member) {
        // Edit mode
        setFormData({
          name: member.name,
          roleId: member.roleId || '',
          roleName: member.roleName,
          level: member.level,
          defaultRatePerDay: member.defaultRatePerDay.toString(),
          notes: member.notes || '',
          status: member.status
        })
        setCustomRole(!member.roleId)
      } else {
        // Add mode
        setFormData({
          name: '',
          roleId: '',
          roleName: '',
          level: '',
          defaultRatePerDay: '',
          notes: '',
          status: 'ACTIVE'
        })
        setCustomRole(false)
      }
      setErrors({})
    }
  }, [open, member])

  // Auto-fill rate when role and level are selected
  useEffect(() => {
    if (formData.roleId && formData.level) {
      const selectedRole = rateCardRoles.find(r => r.id === formData.roleId)
      if (selectedRole) {
        const tier = selectedRole.tiers.find(t => t.level === formData.level && t.active)
        if (tier) {
          setFormData(prev => ({
            ...prev,
            defaultRatePerDay: tier.pricePerDay.toString()
          }))
        }
      }
    }
  }, [formData.roleId, formData.level, rateCardRoles])

  // Get available levels for selected role
  const availableLevels = formData.roleId 
    ? rateCardRoles.find(r => r.id === formData.roleId)?.tiers
        .filter(t => t.active)
        .map(t => t.level) || []
    : ['TEAM_LEAD', 'SENIOR', 'JUNIOR']

  const handleRoleChange = (value: string) => {
    if (value === 'custom') {
      setCustomRole(true)
      setFormData(prev => ({
        ...prev,
        roleId: '',
        roleName: '',
        level: ''
      }))
    } else {
      setCustomRole(false)
      const selectedRole = rateCardRoles.find(r => r.id === value)
      setFormData(prev => ({
        ...prev,
        roleId: value,
        roleName: selectedRole?.name || '',
        level: '' // Reset level when role changes
      }))
    }
  }

  const validateForm = (): boolean => {
    try {
      const data: TeamMemberCreate = {
        name: formData.name.trim(),
        roleId: formData.roleId || null,
        roleName: customRole ? formData.roleName.trim() : (formData.roleName || formData.name.trim()),
        level: formData.level as LevelType,
        defaultRatePerDay: parseInt(formData.defaultRatePerDay),
        notes: formData.notes.trim() || null,
        status: formData.status
      }

      if (member) {
        TeamMemberUpdateSchema.parse({ ...data, id: member.id })
      } else {
        TeamMemberCreateSchema.parse(data)
      }
      
      setErrors({})
      return true
    } catch (error) {
      if (error instanceof ZodError) {
        const newErrors: FormErrors = {}
        error.errors.forEach(err => {
          if (err.path.length > 0) {
            newErrors[err.path[0] as string] = err.message
          }
        })
        setErrors(newErrors)
      }
      return false
    }
  }

  const handleSubmit = async () => {
    if (!validateForm()) return

    setLoading(true)
    try {
      const data: TeamMemberCreate = {
        name: formData.name.trim(),
        roleId: formData.roleId || null,
        roleName: customRole ? formData.roleName.trim() : (formData.roleName || formData.name.trim()),
        level: formData.level as LevelType,
        defaultRatePerDay: parseInt(formData.defaultRatePerDay),
        notes: formData.notes.trim() || null,
        status: formData.status
      }

      const url = member ? `/api/team/${member.id}` : '/api/team'
      const method = member ? 'PATCH' : 'POST'

      const response = await fetch(url, {
        method,
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(data)
      })

      if (response.ok) {
        onSave()
        onOpenChange(false)
      } else {
        const error = await response.json()
        console.error('Save failed:', error)
        // Handle specific errors if needed
      }
    } catch (error) {
      console.error('Error saving team member:', error)
    } finally {
      setLoading(false)
    }
  }

  const handleCancel = () => {
    onOpenChange(false)
  }

  const isFormValid = formData.name && formData.roleName && formData.level && formData.defaultRatePerDay

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-[500px]">
        <DialogHeader>
          <DialogTitle>
            {member ? 'Edit Team Member' : 'Add Team Member'}
          </DialogTitle>
          <DialogDescription>
            {member ? 'Update team member information.' : 'Add a new team member to your library.'}
          </DialogDescription>
        </DialogHeader>

        <div className="space-y-4 py-4">
          {/* Name */}
          <div className="space-y-2">
            <label className="text-sm font-medium">Name *</label>
            <Input
              value={formData.name}
              onChange={(e) => setFormData(prev => ({ ...prev, name: e.target.value }))}
              placeholder="Full name"
              className={errors.name ? 'border-red-500' : ''}
            />
            {errors.name && (
              <p className="text-sm text-red-500 flex items-center">
                <AlertCircle className="h-4 w-4 mr-1" />
                {errors.name}
              </p>
            )}
          </div>

          {/* Role */}
          <div className="space-y-2">
            <label className="text-sm font-medium">Role *</label>
            <Select 
              value={customRole ? 'custom' : formData.roleId} 
              onValueChange={handleRoleChange}
            >
              <SelectTrigger className={errors.roleName ? 'border-red-500' : ''}>
                <SelectValue placeholder="Select role" />
              </SelectTrigger>
              <SelectContent>
                {rateCardRoles.map((role) => (
                  <SelectItem key={role.id} value={role.id}>
                    {role.name}
                  </SelectItem>
                ))}
                <SelectItem value="custom">Custom role...</SelectItem>
              </SelectContent>
            </Select>
            
            {customRole && (
              <Input
                value={formData.roleName}
                onChange={(e) => setFormData(prev => ({ ...prev, roleName: e.target.value }))}
                placeholder="Enter custom role name"
                className={errors.roleName ? 'border-red-500' : ''}
              />
            )}
            
            {errors.roleName && (
              <p className="text-sm text-red-500 flex items-center">
                <AlertCircle className="h-4 w-4 mr-1" />
                {errors.roleName}
              </p>
            )}
          </div>

          {/* Level */}
          <div className="space-y-2">
            <label className="text-sm font-medium">Level *</label>
            <Select 
              value={formData.level} 
              onValueChange={(value: LevelType) => setFormData(prev => ({ ...prev, level: value }))}
            >
              <SelectTrigger className={errors.level ? 'border-red-500' : ''}>
                <SelectValue placeholder="Select level" />
              </SelectTrigger>
              <SelectContent>
                {availableLevels.map((level) => (
                  <SelectItem key={level} value={level}>
                    {level.replace('_', ' ')}
                  </SelectItem>
                ))}
                {/* Show all levels if custom role or no specific role selected */}
                {(customRole || !formData.roleId) && 
                  ['TEAM_LEAD', 'SENIOR', 'JUNIOR'].filter(l => !availableLevels.includes(l as LevelType)).map((level) => (
                    <SelectItem key={level} value={level}>
                      {level.replace('_', ' ')}
                    </SelectItem>
                  ))
                }
              </SelectContent>
            </Select>
            
            {/* Show warning if level not available in rate card */}
            {formData.roleId && formData.level && !availableLevels.includes(formData.level) && (
              <div className="flex items-center space-x-2 text-sm text-amber-600">
                <AlertCircle className="h-4 w-4" />
                <span>Custom rate - level not available in rate card</span>
              </div>
            )}
            
            {errors.level && (
              <p className="text-sm text-red-500 flex items-center">
                <AlertCircle className="h-4 w-4 mr-1" />
                {errors.level}
              </p>
            )}
          </div>

          {/* Default Rate */}
          <div className="space-y-2">
            <label className="text-sm font-medium">Default Rate per Day (THB) *</label>
            <Input
              type="number"
              value={formData.defaultRatePerDay}
              onChange={(e) => setFormData(prev => ({ ...prev, defaultRatePerDay: e.target.value }))}
              placeholder="2500"
              min="1"
              className={errors.defaultRatePerDay ? 'border-red-500' : ''}
            />
            {errors.defaultRatePerDay && (
              <p className="text-sm text-red-500 flex items-center">
                <AlertCircle className="h-4 w-4 mr-1" />
                {errors.defaultRatePerDay}
              </p>
            )}
          </div>

          {/* Status */}
          <div className="space-y-2">
            <label className="text-sm font-medium">Status</label>
            <Select 
              value={formData.status} 
              onValueChange={(value: 'ACTIVE' | 'INACTIVE') => setFormData(prev => ({ ...prev, status: value }))}
            >
              <SelectTrigger>
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="ACTIVE">Active</SelectItem>
                <SelectItem value="INACTIVE">Inactive</SelectItem>
              </SelectContent>
            </Select>
          </div>

          {/* Notes */}
          <div className="space-y-2">
            <label className="text-sm font-medium">Notes</label>
            <Input
              value={formData.notes}
              onChange={(e) => setFormData(prev => ({ ...prev, notes: e.target.value }))}
              placeholder="Additional notes or comments"
            />
          </div>
        </div>

        <DialogFooter>
          <Button variant="outline" onClick={handleCancel} disabled={loading}>
            Cancel
          </Button>
          <Button 
            onClick={handleSubmit} 
            disabled={!isFormValid || loading}
          >
            {loading && <Loader2 className="h-4 w-4 mr-2 animate-spin" />}
            {member ? 'Update' : 'Add'} Member
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  )
}
