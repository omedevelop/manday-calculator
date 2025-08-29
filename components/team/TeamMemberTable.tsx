'use client'

import { useState, useEffect } from 'react'
import { subscribeToTeamMembers, createClientSupabase } from '@/lib/database'
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table'
import { Checkbox } from '@/components/ui/checkbox'
import { Badge } from '@/components/ui/badge'
import { Button } from '@/components/ui/button'
import { Edit, Trash2, ChevronUp, ChevronDown } from 'lucide-react'

interface TeamMember {
  id: string
  name: string
  roleId?: string | null
  roleName: string
  level: 'TEAM_LEAD' | 'SENIOR' | 'JUNIOR'
  defaultRatePerDay: number
  notes?: string | null
  status: 'ACTIVE' | 'INACTIVE'
  createdAt: string
  updatedAt: string
  role?: {
    id: string
    name: string
  } | null
}

interface TeamMemberTableProps {
  teamMembers: TeamMember[]
  selectedMembers: Set<string>
  sortField: string
  sortDirection: 'asc' | 'desc'
  onSelectAll: (checked: boolean) => void
  onSelectMember: (id: string, checked: boolean) => void
  onSort: (field: string) => void
  onEdit: (member: TeamMember) => void
  onDelete: (id: string) => void
  onRefresh: () => void
}

function getLevelBadgeVariant(level: string) {
  switch (level) {
    case 'TEAM_LEAD': return 'default'
    case 'SENIOR': return 'secondary' 
    case 'JUNIOR': return 'outline'
    default: return 'outline'
  }
}

function getStatusBadgeVariant(status: string) {
  return status === 'ACTIVE' ? 'success' : 'secondary'
}

export function TeamMemberTable({
  teamMembers,
  selectedMembers,
  sortField,
  sortDirection,
  onSelectAll,
  onSelectMember,
  onSort,
  onEdit,
  onDelete,
  onRefresh
}: TeamMemberTableProps) {
  const [realtimeEnabled, setRealtimeEnabled] = useState(false)

  // Set up real-time subscription
  useEffect(() => {
    if (realtimeEnabled) {
      const subscription = subscribeToTeamMembers((payload) => {
        console.log('Real-time update:', payload)
        // Refresh the data when changes occur
        onRefresh()
      })

      return () => {
        subscription.unsubscribe()
      }
    }
  }, [realtimeEnabled, onRefresh])

  const SortableHeader = ({ field, children }: { field: string; children: React.ReactNode }) => (
    <TableHead 
      className="cursor-pointer select-none hover:bg-muted/50" 
      onClick={() => onSort(field)}
    >
      <div className="flex items-center space-x-1">
        <span>{children}</span>
        {sortField === field && (
          sortDirection === 'asc' ? 
            <ChevronUp className="h-4 w-4" /> : 
            <ChevronDown className="h-4 w-4" />
        )}
      </div>
    </TableHead>
  )

  return (
    <div className="space-y-4">
      {/* Real-time toggle */}
      <div className="flex items-center space-x-2">
        <Checkbox
          id="realtime"
          checked={realtimeEnabled}
          onCheckedChange={setRealtimeEnabled}
        />
        <label htmlFor="realtime" className="text-sm">
          Enable real-time updates
        </label>
        {realtimeEnabled && (
          <Badge variant="outline" className="text-green-600 border-green-600">
            Live
          </Badge>
        )}
      </div>

      {/* Table */}
      <Table>
        <TableHeader>
          <TableRow>
            <TableHead className="w-12">
              <Checkbox
                checked={selectedMembers.size === teamMembers.length && teamMembers.length > 0}
                onCheckedChange={onSelectAll}
              />
            </TableHead>
            <SortableHeader field="name">Name</SortableHeader>
            <SortableHeader field="roleName">Role</SortableHeader>
            <SortableHeader field="level">Level</SortableHeader>
            <SortableHeader field="defaultRatePerDay">Rate/Day</SortableHeader>
            <SortableHeader field="status">Status</SortableHeader>
            <TableHead>Notes</TableHead>
            <TableHead className="w-24">Actions</TableHead>
          </TableRow>
        </TableHeader>
        <TableBody>
          {teamMembers.map((member) => (
            <TableRow key={member.id}>
              <TableCell>
                <Checkbox
                  checked={selectedMembers.has(member.id)}
                  onCheckedChange={(checked) => onSelectMember(member.id, checked)}
                />
              </TableCell>
              <TableCell className="font-medium">{member.name}</TableCell>
              <TableCell>{member.roleName}</TableCell>
              <TableCell>
                <Badge variant={getLevelBadgeVariant(member.level)}>
                  {member.level.replace('_', ' ')}
                </Badge>
              </TableCell>
              <TableCell>฿{member.defaultRatePerDay.toLocaleString()}</TableCell>
              <TableCell>
                <Badge variant={getStatusBadgeVariant(member.status)}>
                  {member.status}
                </Badge>
              </TableCell>
              <TableCell className="max-w-xs truncate">
                {member.notes || '-'}
              </TableCell>
              <TableCell>
                <div className="flex items-center space-x-1">
                  <Button
                    size="sm"
                    variant="ghost"
                    onClick={() => onEdit(member)}
                  >
                    <Edit className="h-4 w-4" />
                  </Button>
                  <Button
                    size="sm"
                    variant="ghost"
                    onClick={() => onDelete(member.id)}
                  >
                    <Trash2 className="h-4 w-4" />
                  </Button>
                </div>
              </TableCell>
            </TableRow>
          ))}
        </TableBody>
      </Table>
    </div>
  )
}
