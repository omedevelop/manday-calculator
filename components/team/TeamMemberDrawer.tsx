'use client'

import { useState, useEffect } from 'react'
import { Dialog, DialogContent, DialogDescription, DialogFooter, DialogHeader, DialogTitle } from '@/components/ui/dialog'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select'
import { Badge } from '@/components/ui/badge'
import { Loader2, AlertCircle, User, Briefcase, DollarSign, Info } from 'lucide-react'
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
        level: ''
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

  // Get suggested rate from rate card
  const suggestedRate = formData.roleId && formData.level 
    ? rateCardRoles.find(r => r.id === formData.roleId)?.tiers.find(t => t.level === formData.level && t.active)?.pricePerDay
    : null

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-[600px] max-h-[90vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle className="flex items-center space-x-2">
            <User className="h-5 w-5" />
            <span>{member ? 'Edit Team Member' : 'Add Team Member'}</span>
          </DialogTitle>
          <DialogDescription>
            {member 
              ? 'Update team member information and settings.' 
              : 'Add a new team member to your library. Fill in the required information below.'
            }
          </DialogDescription>
        </DialogHeader>

        <div className="space-y-6 py-4">
          {/* Name */}
          <div className="space-y-2">
            <label className="text-sm font-medium flex items-center">
              <User className="h-4 w-4 mr-2" />
              Full Name *
            </label>
            <Input
              value={formData.name}
              onChange={(e) => setFormData(prev => ({ ...prev, name: e.target.value }))}
              placeholder="Enter full name (e.g., John Doe)"
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
            <label className="text-sm font-medium flex items-center">
              <Briefcase className="h-4 w-4 mr-2" />
              Role *
            </label>
            <Select 
              value={customRole ? 'custom' : formData.roleId} 
              onValueChange={handleRoleChange}
            >
              <SelectTrigger className={errors.roleName ? 'border-red-500' : ''}>
                <SelectValue placeholder="Select a role from rate card or create custom" />
              </SelectTrigger>
              <SelectContent>
                <div className="px-2 py-1.5 text-xs font-medium text-muted-foreground">
                  Rate Card Roles
                </div>
                {rateCardRoles.map((role) => (
                  <SelectItem key={role.id} value={role.id}>
                    {role.name}
                  </SelectItem>
                ))}
                <div className="px-2 py-1.5 text-xs font-medium text-muted-foreground">
                  Custom Role
                </div>
                <SelectItem value="custom">Create custom role...</SelectItem>
              </SelectContent>
            </Select>
            
            {customRole && (
              <Input
                value={formData.roleName}
                onChange={(e) => setFormData(prev => ({ ...prev, roleName: e.target.value }))}
                placeholder="Enter custom role name (e.g., Senior Frontend Developer)"
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
            <label className="text-sm font-medium">Experience Level *</label>
            <Select 
              value={formData.level} 
              onValueChange={(value: LevelType) => setFormData(prev => ({ ...prev, level: value }))}
            >
              <SelectTrigger className={errors.level ? 'border-red-500' : ''}>
                <SelectValue placeholder="Select experience level" />
              </SelectTrigger>
              <SelectContent>
                {availableLevels.map((level) => (
                  <SelectItem key={level} value={level}>
                    <div className="flex items-center space-x-2">
                      <span>{level.replace('_', ' ')}</span>
                      {formData.roleId && rateCardRoles.find(r => r.id === formData.roleId)?.tiers.find(t => t.level === level && t.active) && (
                        <Badge variant="outline" className="text-xs">
                          ฿{rateCardRoles.find(r => r.id === formData.roleId)?.tiers.find(t => t.level === level && t.active)?.pricePerDay.toLocaleString()}
                        </Badge>
                      )}
                    </div>
                  </SelectItem>
                ))}
                {(customRole || !formData.roleId) && 
                  ['TEAM_LEAD', 'SENIOR', 'JUNIOR'].filter(l => !availableLevels.includes(l as LevelType)).map((level) => (
                    <SelectItem key={level} value={level}>
                      {level.replace('_', ' ')}
                    </SelectItem>
                  ))
                }
              </SelectContent>
            </Select>
            
            {formData.roleId && formData.level && !availableLevels.includes(formData.level) && (
              <div className="flex items-center space-x-2 text-sm text-amber-600 bg-amber-50 p-2 rounded">
                <Info className="h-4 w-4" />
                <span>Custom rate - this level is not available in the rate card</span>
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
            <label className="text-sm font-medium flex items-center">
              <DollarSign className="h-4 w-4 mr-2" />
              Default Rate per Day (THB) *
            </label>
            <div className="relative">
              <Input
                type="number"
                value={formData.defaultRatePerDay}
                onChange={(e) => setFormData(prev => ({ ...prev, defaultRatePerDay: e.target.value }))}
                placeholder="2500"
                min="1"
                className={errors.defaultRatePerDay ? 'border-red-500' : ''}
              />
              {suggestedRate && suggestedRate.toString() !== formData.defaultRatePerDay && (
                <div className="absolute right-3 top-1/2 transform -translate-y-1/2">
                  <Button
                    type="button"
                    variant="ghost"
                    size="sm"
                    onClick={() => setFormData(prev => ({ ...prev, defaultRatePerDay: suggestedRate.toString() }))}
                    className="h-6 px-2 text-xs"
                  >
                    Use ฿{suggestedRate.toLocaleString()}
                  </Button>
                </div>
              )}
            </div>
            {suggestedRate && (
              <p className="text-xs text-muted-foreground">
                Suggested rate from rate card: ฿{suggestedRate.toLocaleString()}
              </p>
            )}
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
                <SelectItem value="ACTIVE">
                  <div className="flex items-center space-x-2">
                    <div className="w-2 h-2 bg-green-500 rounded-full"></div>
                    <span>Active</span>
                  </div>
                </SelectItem>
                <SelectItem value="INACTIVE">
                  <div className="flex items-center space-x-2">
                    <div className="w-2 h-2 bg-gray-400 rounded-full"></div>
                    <span>Inactive</span>
                  </div>
                </SelectItem>
              </SelectContent>
            </Select>
            <p className="text-xs text-muted-foreground">
              Active members can be assigned to projects. Inactive members are hidden from project assignments.
            </p>
          </div>

          {/* Notes */}
          <div className="space-y-2">
            <label className="text-sm font-medium">Notes</label>
            <Input
              value={formData.notes}
              onChange={(e) => setFormData(prev => ({ ...prev, notes: e.target.value }))}
              placeholder="Additional notes, skills, or comments (optional)"
            />
            <p className="text-xs text-muted-foreground">
              Add any relevant information about this team member's skills, experience, or specializations.
            </p>
          </div>
        </div>

        <DialogFooter className="flex-col sm:flex-row gap-2">
          <Button variant="outline" onClick={handleCancel} disabled={loading} className="w-full sm:w-auto">
            Cancel
          </Button>
          <Button 
            onClick={handleSubmit} 
            disabled={!isFormValid || loading}
            className="w-full sm:w-auto"
          >
            {loading && <Loader2 className="h-4 w-4 mr-2 animate-spin" />}
            {member ? 'Update' : 'Add'} Team Member
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  )
}
