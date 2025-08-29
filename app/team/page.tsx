'use client'

import { useState, useEffect, useMemo, useRef } from 'react'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select'
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table'
import { Checkbox } from '@/components/ui/checkbox'
import { Badge } from '@/components/ui/badge'
import { Dialog, DialogContent, DialogDescription, DialogFooter, DialogHeader, DialogTitle } from '@/components/ui/dialog'
import { 
  Plus, 
  Edit, 
  Trash2, 
  UserPlus, 
  Upload, 
  Download, 
  Search, 
  ChevronUp, 
  ChevronDown,
  MoreHorizontal,
  FileText,
  Users,
  Filter,
  X
} from 'lucide-react'
import { cn } from '@/lib/utils'
import { TeamMemberDrawer } from '@/components/team/TeamMemberDrawer'
import { CSVImportDialog } from '@/components/team/CSVImportDialog'

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

interface RateCardRole {
  id: string
  name: string
  tiers: {
    id: string
    level: 'TEAM_LEAD' | 'SENIOR' | 'JUNIOR'
    pricePerDay: number
    active: boolean
  }[]
}

interface TeamResponse {
  data: TeamMember[]
  pagination: {
    page: number
    size: number
    total: number
    pages: number
  }
}

type SortField = 'name' | 'roleName' | 'level' | 'defaultRatePerDay' | 'status' | 'createdAt'
type SortDirection = 'asc' | 'desc'

const LEVEL_ORDER = { 'TEAM_LEAD': 3, 'SENIOR': 2, 'JUNIOR': 1 }

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

export default function TeamPage() {
  // State management
  const [teamMembers, setTeamMembers] = useState<TeamMember[]>([])
  const [rateCardRoles, setRateCardRoles] = useState<RateCardRole[]>([])
  const [pagination, setPagination] = useState({ page: 1, size: 25, total: 0, pages: 0 })
  const [loading, setLoading] = useState(true)
  const [selectedMembers, setSelectedMembers] = useState<Set<string>>(new Set())
  
  // Filters and sorting
  const [searchTerm, setSearchTerm] = useState('')
  const [statusFilter, setStatusFilter] = useState<string>('')
  const [roleFilter, setRoleFilter] = useState<string>('')
  const [levelFilter, setLevelFilter] = useState<string>('')
  const [sortField, setSortField] = useState<SortField>('name')
  const [sortDirection, setSortDirection] = useState<SortDirection>('asc')
  
  // UI state
  const [showDrawer, setShowDrawer] = useState(false)
  const [editingMember, setEditingMember] = useState<TeamMember | null>(null)
  const [showImportDialog, setShowImportDialog] = useState(false)
  const [showBulkConfirm, setShowBulkConfirm] = useState(false)
  const [bulkAction, setBulkAction] = useState<'activate' | 'deactivate' | 'delete'>('activate')
  
  // Refs
  const fileInputRef = useRef<HTMLInputElement>(null)
  
  // Debounced search
  const [searchDebounced, setSearchDebounced] = useState('')
  useEffect(() => {
    const timer = setTimeout(() => setSearchDebounced(searchTerm), 300)
    return () => clearTimeout(timer)
  }, [searchTerm])

  // Fetch data
  useEffect(() => {
    fetchTeamMembers()
  }, [searchDebounced, statusFilter, roleFilter, levelFilter, sortField, sortDirection, pagination.page, pagination.size])

  useEffect(() => {
    fetchRateCardRoles()
  }, [])

  const fetchTeamMembers = async () => {
    try {
      setLoading(true)
      const params = new URLSearchParams({
        page: pagination.page.toString(),
        size: pagination.size.toString(),
      })
      
      if (searchDebounced) params.append('search', searchDebounced)
      if (statusFilter) params.append('status', statusFilter)
      if (roleFilter) params.append('roleId', roleFilter)
      if (levelFilter) params.append('level', levelFilter)
      if (sortField && sortDirection) params.append('sort', `${sortField}:${sortDirection}`)

      const response = await fetch(`/api/team?${params}`)
      if (response.ok) {
        const data: TeamResponse = await response.json()
        setTeamMembers(data.data)
        setPagination(data.pagination)
      } else {
        console.error('Failed to fetch team members')
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

  // Handlers
  const handleSort = (field: SortField) => {
    if (sortField === field) {
      setSortDirection(sortDirection === 'asc' ? 'desc' : 'asc')
    } else {
      setSortField(field)
      setSortDirection('asc')
    }
  }

  const handleSelectAll = (checked: boolean) => {
    if (checked) {
      setSelectedMembers(new Set(teamMembers.map(m => m.id)))
    } else {
      setSelectedMembers(new Set())
    }
  }

  const handleSelectMember = (id: string, checked: boolean) => {
    const newSelected = new Set(selectedMembers)
    if (checked) {
      newSelected.add(id)
    } else {
      newSelected.delete(id)
    }
    setSelectedMembers(newSelected)
  }

  const handleEdit = (member: TeamMember) => {
    setEditingMember(member)
    setShowDrawer(true)
  }

  const handleDelete = async (id: string) => {
    if (!confirm('Are you sure you want to delete this team member?')) return
    
    try {
      const response = await fetch(`/api/team/${id}`, { method: 'DELETE' })
      if (response.ok) {
        await fetchTeamMembers()
        alert('Team member deleted successfully!')
      } else {
        const error = await response.json()
        if (response.status === 409) {
          alert(error.message || 'Cannot delete team member - referenced by projects')
        } else {
          alert('Failed to delete team member')
        }
      }
    } catch (error) {
      console.error('Error deleting team member:', error)
      alert('Failed to delete team member')
    }
  }

  const handleBulkAction = async () => {
    if (selectedMembers.size === 0) return
    
    try {
      const response = await fetch('/api/team/bulk', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          action: bulkAction,
          ids: Array.from(selectedMembers)
        })
      })
      
      if (response.ok) {
        const result = await response.json()
        await fetchTeamMembers()
        setSelectedMembers(new Set())
        setShowBulkConfirm(false)
        alert(`Successfully ${bulkAction}d ${result.affected} team member(s)`)
      } else {
        const error = await response.json()
        if (response.status === 409) {
          alert(error.message || 'Some members cannot be deleted - referenced by projects')
        } else {
          alert(`Failed to ${bulkAction} team members`)
        }
      }
    } catch (error) {
      console.error(`Error performing bulk ${bulkAction}:`, error)
      alert(`Failed to ${bulkAction} team members`)
    }
  }

  const handleExportCSV = () => {
    const params = new URLSearchParams()
    if (searchDebounced) params.append('search', searchDebounced)
    if (statusFilter) params.append('status', statusFilter)
    if (roleFilter) params.append('roleId', roleFilter)
    if (levelFilter) params.append('level', levelFilter)
    if (sortField && sortDirection) params.append('sort', `${sortField}:${sortDirection}`)
    
    window.open(`/api/team/export.csv?${params}`, '_blank')
  }

  const clearFilters = () => {
    setSearchTerm('')
    setStatusFilter('')
    setRoleFilter('')
    setLevelFilter('')
  }

  const hasActiveFilters = searchTerm || statusFilter || roleFilter || levelFilter

  // Render helpers
  const SortableHeader = ({ field, children }: { field: SortField; children: React.ReactNode }) => (
    <TableHead 
      className="cursor-pointer select-none hover:bg-muted/50" 
      onClick={() => handleSort(field)}
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

  if (loading && teamMembers.length === 0) {
    return (
      <div className="container mx-auto px-4 py-8">
        <div className="text-center">Loading...</div>
      </div>
    )
  }

  return (
    <div className="container mx-auto px-4 py-8 space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold">Team Members</h1>
          <p className="text-muted-foreground mt-1">
            Manage your team members and their rates
          </p>
        </div>
        <div className="flex items-center space-x-2">
          <Button onClick={() => setShowImportDialog(true)} variant="outline">
            <Upload className="h-4 w-4 mr-2" />
            Import CSV
          </Button>
          <Button onClick={handleExportCSV} variant="outline">
            <Download className="h-4 w-4 mr-2" />
            Export CSV
          </Button>
          <Button onClick={() => setShowDrawer(true)}>
            <UserPlus className="h-4 w-4 mr-2" />
            Add Member
          </Button>
        </div>
      </div>

      {/* Filters */}
      <Card>
        <CardHeader className="pb-3">
          <CardTitle className="text-lg flex items-center">
            <Filter className="h-5 w-5 mr-2" />
            Filters
          </CardTitle>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="flex flex-wrap gap-4">
            <div className="flex-1 min-w-[200px]">
              <div className="relative">
                <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 h-4 w-4 text-muted-foreground" />
                <Input
                  placeholder="Search members..."
                  value={searchTerm}
                  onChange={(e) => setSearchTerm(e.target.value)}
                  className="pl-9"
                />
              </div>
            </div>
            <Select value={statusFilter} onValueChange={setStatusFilter}>
              <SelectTrigger className="w-[140px]">
                <SelectValue placeholder="Status" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="">All Status</SelectItem>
                <SelectItem value="ACTIVE">Active</SelectItem>
                <SelectItem value="INACTIVE">Inactive</SelectItem>
              </SelectContent>
            </Select>
            <Select value={roleFilter} onValueChange={setRoleFilter}>
              <SelectTrigger className="w-[160px]">
                <SelectValue placeholder="Role" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="">All Roles</SelectItem>
                {rateCardRoles.map((role) => (
                  <SelectItem key={role.id} value={role.id}>
                    {role.name}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
            <Select value={levelFilter} onValueChange={setLevelFilter}>
              <SelectTrigger className="w-[140px]">
                <SelectValue placeholder="Level" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="">All Levels</SelectItem>
                <SelectItem value="TEAM_LEAD">Team Lead</SelectItem>
                <SelectItem value="SENIOR">Senior</SelectItem>
                <SelectItem value="JUNIOR">Junior</SelectItem>
              </SelectContent>
            </Select>
            {hasActiveFilters && (
              <Button variant="outline" onClick={clearFilters}>
                <X className="h-4 w-4 mr-2" />
                Clear
              </Button>
            )}
          </div>
        </CardContent>
      </Card>

      {/* Bulk Actions */}
      {selectedMembers.size > 0 && (
        <Card className="border-blue-200 bg-blue-50">
          <CardContent className="pt-4">
            <div className="flex items-center justify-between">
              <span className="text-sm text-blue-900">
                {selectedMembers.size} member(s) selected
              </span>
              <div className="flex items-center space-x-2">
                <Button 
                  size="sm" 
                  variant="outline"
                  onClick={() => { setBulkAction('activate'); setShowBulkConfirm(true) }}
                >
                  Activate
                </Button>
                <Button 
                  size="sm" 
                  variant="outline"
                  onClick={() => { setBulkAction('deactivate'); setShowBulkConfirm(true) }}
                >
                  Deactivate
                </Button>
                <Button 
                  size="sm" 
                  variant="destructive"
                  onClick={() => { setBulkAction('delete'); setShowBulkConfirm(true) }}
                >
                  Delete
                </Button>
              </div>
            </div>
          </CardContent>
        </Card>
      )}

      {/* Table */}
      <Card>
        <CardContent className="p-0">
          {teamMembers.length === 0 ? (
            <div className="text-center py-12">
              <Users className="h-12 w-12 text-muted-foreground mx-auto mb-4" />
              <h3 className="text-lg font-semibold mb-2">No team members found</h3>
              <p className="text-muted-foreground mb-4">
                {hasActiveFilters ? 'Try adjusting your filters' : 'Add your first team member to get started'}
              </p>
              <Button onClick={() => setShowDrawer(true)}>
                <UserPlus className="h-4 w-4 mr-2" />
                Add Member
              </Button>
            </div>
          ) : (
            <>
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead className="w-12">
                      <Checkbox
                        checked={selectedMembers.size === teamMembers.length && teamMembers.length > 0}
                        onCheckedChange={(checked) => handleSelectAll(!!checked)}
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
                          onCheckedChange={(checked) => handleSelectMember(member.id, !!checked)}
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
                            onClick={() => handleEdit(member)}
                          >
                            <Edit className="h-4 w-4" />
                          </Button>
                          <Button
                            size="sm"
                            variant="ghost"
                            onClick={() => handleDelete(member.id)}
                          >
                            <Trash2 className="h-4 w-4" />
                          </Button>
                        </div>
                      </TableCell>
                    </TableRow>
                  ))}
                </TableBody>
              </Table>

              {/* Pagination */}
              <div className="flex items-center justify-between p-4 border-t">
                <div className="flex items-center space-x-2">
                  <span className="text-sm text-muted-foreground">
                    Showing {((pagination.page - 1) * pagination.size) + 1} to {Math.min(pagination.page * pagination.size, pagination.total)} of {pagination.total}
                  </span>
                  <Select
                    value={pagination.size.toString()}
                    onValueChange={(value) => setPagination({ ...pagination, size: parseInt(value), page: 1 })}
                  >
                    <SelectTrigger className="w-20">
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="10">10</SelectItem>
                      <SelectItem value="25">25</SelectItem>
                      <SelectItem value="50">50</SelectItem>
                    </SelectContent>
                  </Select>
                  <span className="text-sm text-muted-foreground">per page</span>
                </div>
                <div className="flex items-center space-x-2">
                  <Button
                    variant="outline"
                    size="sm"
                    disabled={pagination.page <= 1}
                    onClick={() => setPagination({ ...pagination, page: pagination.page - 1 })}
                  >
                    Previous
                  </Button>
                  <span className="text-sm">
                    Page {pagination.page} of {pagination.pages}
                  </span>
                  <Button
                    variant="outline"
                    size="sm"
                    disabled={pagination.page >= pagination.pages}
                    onClick={() => setPagination({ ...pagination, page: pagination.page + 1 })}
                  >
                    Next
                  </Button>
                </div>
              </div>
            </>
          )}
        </CardContent>
      </Card>

      {/* Dialogs */}
      <TeamMemberDrawer
        open={showDrawer}
        onOpenChange={setShowDrawer}
        member={editingMember}
        onSave={fetchTeamMembers}
        rateCardRoles={rateCardRoles}
      />

      <CSVImportDialog
        open={showImportDialog}
        onOpenChange={setShowImportDialog}
        onSuccess={fetchTeamMembers}
      />

      <Dialog open={showBulkConfirm} onOpenChange={setShowBulkConfirm}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Confirm Bulk Action</DialogTitle>
            <DialogDescription>
              Are you sure you want to {bulkAction} {selectedMembers.size} selected team member(s)?
              {bulkAction === 'delete' && ' This action cannot be undone.'}
            </DialogDescription>
          </DialogHeader>
          <DialogFooter>
            <Button variant="outline" onClick={() => setShowBulkConfirm(false)}>
              Cancel
            </Button>
            <Button 
              variant={bulkAction === 'delete' ? 'destructive' : 'default'}
              onClick={handleBulkAction}
            >
              {bulkAction === 'delete' ? 'Delete' : bulkAction === 'activate' ? 'Activate' : 'Deactivate'}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  )
}