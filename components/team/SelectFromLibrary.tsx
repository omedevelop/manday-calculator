'use client'

import { useState, useEffect, useMemo } from 'react'
import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle, DialogTrigger } from '@/components/ui/dialog'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Badge } from '@/components/ui/badge'
import { Card, CardContent } from '@/components/ui/card'
import { Users, Search, UserPlus } from 'lucide-react'
import { cn } from '@/lib/utils'

interface TeamMember {
  id: string
  name: string
  roleId?: string | null
  roleName: string
  level: 'TEAM_LEAD' | 'SENIOR' | 'JUNIOR'
  defaultRatePerDay: number
  notes?: string | null
  status: 'ACTIVE' | 'INACTIVE'
  role?: {
    id: string
    name: string
  } | null
}

interface SelectedMember {
  id: string
  name: string
  roleId?: string | null
  roleName: string
  level: 'TEAM_LEAD' | 'SENIOR' | 'JUNIOR'
  defaultRatePerDay: number
}

interface SelectFromLibraryProps {
  onSelect: (member: SelectedMember) => void
  children?: React.ReactNode
  disabled?: boolean
}

function getLevelBadgeVariant(level: string) {
  switch (level) {
    case 'TEAM_LEAD': return 'default'
    case 'SENIOR': return 'secondary' 
    case 'JUNIOR': return 'outline'
    default: return 'outline'
  }
}

export function SelectFromLibrary({ onSelect, children, disabled }: SelectFromLibraryProps) {
  const [open, setOpen] = useState(false)
  const [teamMembers, setTeamMembers] = useState<TeamMember[]>([])
  const [loading, setLoading] = useState(false)
  const [searchTerm, setSearchTerm] = useState('')

  // Fetch active team members when dialog opens
  useEffect(() => {
    if (open && teamMembers.length === 0) {
      fetchTeamMembers()
    }
  }, [open])

  const fetchTeamMembers = async () => {
    setLoading(true)
    try {
      // Fetch only active members with a large page size to get all
      const response = await fetch('/api/team?status=ACTIVE&size=1000')
      if (response.ok) {
        const data = await response.json()
        setTeamMembers(data.data || [])
      } else {
        console.error('Failed to fetch team members')
      }
    } catch (error) {
      console.error('Error fetching team members:', error)
    } finally {
      setLoading(false)
    }
  }

  // Filter members based on search term
  const filteredMembers = useMemo(() => {
    if (!searchTerm) return teamMembers
    
    const term = searchTerm.toLowerCase()
    return teamMembers.filter(member => 
      member.name.toLowerCase().includes(term) ||
      member.roleName.toLowerCase().includes(term) ||
      member.level.toLowerCase().includes(term)
    )
  }, [teamMembers, searchTerm])

  const handleSelect = (member: TeamMember) => {
    const selectedMember: SelectedMember = {
      id: member.id,
      name: member.name,
      roleId: member.roleId,
      roleName: member.roleName,
      level: member.level,
      defaultRatePerDay: member.defaultRatePerDay
    }
    
    onSelect(selectedMember)
    setOpen(false)
    setSearchTerm('') // Reset search when closing
  }

  const handleOpenChange = (newOpen: boolean) => {
    setOpen(newOpen)
    if (!newOpen) {
      setSearchTerm('') // Reset search when closing
    }
  }

  return (
    <Dialog open={open} onOpenChange={handleOpenChange}>
      <DialogTrigger asChild>
        {children || (
          <Button variant="outline" disabled={disabled}>
            <Users className="h-4 w-4 mr-2" />
            Select from Library
          </Button>
        )}
      </DialogTrigger>
      <DialogContent className="sm:max-w-[600px] max-h-[80vh]">
        <DialogHeader>
          <DialogTitle>Select Team Member</DialogTitle>
          <DialogDescription>
            Choose a team member from your library to prefill the calculator row
          </DialogDescription>
        </DialogHeader>

        <div className="space-y-4">
          {/* Search */}
          <div className="relative">
            <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 h-4 w-4 text-muted-foreground" />
            <Input
              placeholder="Search team members..."
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              className="pl-9"
            />
          </div>

          {/* Members List */}
          <div className="max-h-[400px] overflow-y-auto space-y-2">
            {loading ? (
              <div className="text-center py-8 text-muted-foreground">
                Loading team members...
              </div>
            ) : filteredMembers.length === 0 ? (
              <div className="text-center py-8">
                {teamMembers.length === 0 ? (
                  <>
                    <Users className="h-12 w-12 text-muted-foreground mx-auto mb-4" />
                    <h3 className="text-lg font-semibold mb-2">No Active Team Members</h3>
                    <p className="text-muted-foreground mb-4">
                      Add team members to your library first
                    </p>
                  </>
                ) : (
                  <>
                    <Search className="h-8 w-8 text-muted-foreground mx-auto mb-4" />
                    <p className="text-muted-foreground">
                      No team members found matching "{searchTerm}"
                    </p>
                  </>
                )}
              </div>
            ) : (
              filteredMembers.map((member) => (
                <Card 
                  key={member.id} 
                  className="cursor-pointer hover:bg-muted/50 transition-colors"
                  onClick={() => handleSelect(member)}
                >
                  <CardContent className="p-4">
                    <div className="flex items-center justify-between">
                      <div className="space-y-1">
                        <div className="flex items-center space-x-2">
                          <h4 className="font-medium">{member.name}</h4>
                          <Badge variant={getLevelBadgeVariant(member.level)}>
                            {member.level.replace('_', ' ')}
                          </Badge>
                        </div>
                        <p className="text-sm text-muted-foreground">
                          {member.roleName}
                        </p>
                        {member.notes && (
                          <p className="text-xs text-muted-foreground truncate max-w-xs">
                            {member.notes}
                          </p>
                        )}
                      </div>
                      <div className="text-right">
                        <div className="font-semibold">
                          ฿{member.defaultRatePerDay.toLocaleString()}
                        </div>
                        <div className="text-sm text-muted-foreground">
                          per day
                        </div>
                      </div>
                    </div>
                  </CardContent>
                </Card>
              ))
            )}
          </div>
        </div>
      </DialogContent>
    </Dialog>
  )
}
