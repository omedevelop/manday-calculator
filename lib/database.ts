import { createClient } from '@supabase/supabase-js'
import type { Database } from './supabase-types'

// Supabase client configuration
const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL
const supabaseServiceKey = process.env.SUPABASE_SERVICE_ROLE_KEY

if (!supabaseUrl) {
  console.error('NEXT_PUBLIC_SUPABASE_URL is not set in environment variables')
  process.exit(1)
}

if (!supabaseServiceKey) {
  console.error('SUPABASE_SERVICE_ROLE_KEY is not set in environment variables')
  process.exit(1)
}

export const supabase = createClient<Database>(supabaseUrl, supabaseServiceKey, {
  auth: {
    autoRefreshToken: false,
    persistSession: false
  }
})

// Client-side Supabase for frontend use
export function createClientSupabase() {
  const supabaseAnonKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!
  return createClient<Database>(supabaseUrl!, supabaseAnonKey)
}

// Type definitions for better TypeScript support
export type TeamMemberRow = Database['public']['Tables']['team_members']['Row']
export type TeamMemberInsert = Database['public']['Tables']['team_members']['Insert']
export type TeamMemberUpdate = Database['public']['Tables']['team_members']['Update']

export type RateCardRoleRow = Database['public']['Tables']['rate_card_roles']['Row']
export type RateCardTierRow = Database['public']['Tables']['rate_card_tiers']['Row']
export type ProjectRow = Database['public']['Tables']['projects']['Row']
export type ProjectPersonRow = Database['public']['Tables']['project_people']['Row']

// Team Members Operations
export async function getTeamMembers(params: {
  search?: string
  status?: 'ACTIVE' | 'INACTIVE'
  roleId?: string
  level?: 'TEAM_LEAD' | 'SENIOR' | 'JUNIOR'
  page?: number
  size?: number
  sort?: string
} = {}) {
  let query = supabase
    .from('team_members')
    .select(`
      *,
      role:rate_card_roles(*)
    `)

  // Apply filters
  if (params.search) {
    query = query.or(`name.ilike.%${params.search}%,roleName.ilike.%${params.search}%`)
  }
  
  if (params.status) {
    query = query.eq('status', params.status)
  }
  
  if (params.roleId) {
    query = query.eq('roleId', params.roleId)
  }
  
  if (params.level) {
    query = query.eq('level', params.level)
  }

  // Apply sorting
  if (params.sort) {
    const [field, direction] = params.sort.split(':')
    const ascending = direction === 'asc'
    
    const validSortFields = ['name', 'roleName', 'level', 'defaultRatePerDay', 'status', 'createdAt']
    if (validSortFields.includes(field)) {
      query = query.order(field as keyof TeamMemberRow, { ascending })
    }
  } else {
    query = query.order('name', { ascending: true })
  }

  // Apply pagination
  const page = params.page || 1
  const size = params.size || 25
  const from = (page - 1) * size
  const to = from + size - 1

  // Get total count for pagination
  const { count } = await supabase
    .from('team_members')
    .select('*', { count: 'exact', head: true })
    .match(params.status ? { status: params.status } : {})

  // Get paginated data
  const { data, error } = await query.range(from, to)

  if (error) throw error

  return {
    data: data || [],
    pagination: {
      page,
      size,
      total: count || 0,
      pages: Math.ceil((count || 0) / size)
    }
  }
}

export async function createTeamMember(member: TeamMemberInsert) {
  const { data, error } = await supabase
    .from('team_members')
    .insert(member)
    .select(`
      *,
      role:rate_card_roles(*)
    `)
    .single()

  if (error) throw error
  return data
}

export async function updateTeamMember(id: string, updates: TeamMemberUpdate) {
  const { data, error } = await supabase
    .from('team_members')
    .update(updates)
    .eq('id', id)
    .select(`
      *,
      role:rate_card_roles(*)
    `)
    .single()

  if (error) throw error
  return data
}

export async function deleteTeamMember(id: string) {
  // Check if member is referenced by projects
  const { data: projectPeople, error: checkError } = await supabase
    .from('project_people')
    .select('id')
    .eq('teamMemberId', id)
    .limit(1)

  if (checkError) throw checkError

  if (projectPeople && projectPeople.length > 0) {
    throw new Error('Cannot delete team member - referenced by projects')
  }

  const { error } = await supabase
    .from('team_members')
    .delete()
    .eq('id', id)

  if (error) throw error
  return true
}

export async function bulkUpdateTeamMembers(
  ids: string[], 
  updates: { status?: 'ACTIVE' | 'INACTIVE' }
) {
  const { data, error } = await supabase
    .from('team_members')
    .update(updates)
    .in('id', ids)
    .select('id')

  if (error) throw error
  return { affected: data?.length || 0 }
}

export async function bulkDeleteTeamMembers(ids: string[]) {
  // Check if any members are referenced by projects
  const { data: projectPeople, error: checkError } = await supabase
    .from('project_people')
    .select(`
      teamMemberId,
      team_members!inner(name)
    `)
    .in('teamMemberId', ids)

  if (checkError) throw checkError

  if (projectPeople && projectPeople.length > 0) {
    const referencedMembers = projectPeople.map(p => ({
      id: p.teamMemberId,
      name: (p as any).team_members?.name || 'Unknown'
    }))
    
    const error = new Error('Cannot delete team members - some are referenced by projects')
    ;(error as any).referencedMembers = referencedMembers
    throw error
  }

  const { data, error } = await supabase
    .from('team_members')
    .delete()
    .in('id', ids)
    .select('id')

  if (error) throw error
  return { affected: data?.length || 0 }
}

// Rate Card Operations
export async function getRateCardRoles() {
  const { data, error } = await supabase
    .from('rate_card_roles')
    .select(`
      *,
      tiers:rate_card_tiers(*)
    `)
    .order('name')

  if (error) throw error
  return data || []
}

// Active team members for library selection
export async function getActiveTeamMembers() {
  const { data, error } = await supabase
    .from('team_members')
    .select(`
      *,
      role:rate_card_roles(*)
    `)
    .eq('status', 'ACTIVE')
    .order('name')

  if (error) throw error
  return data || []
}

// Projects Operations (migrated from Prisma)
export async function getProjects() {
  const { data, error } = await supabase
    .from('projects')
    .select(`
      *,
      people:project_people(
        *,
        teamMember:team_members(*),
        role:rate_card_roles(*)
      ),
      holidays:project_holidays(*),
      summary:project_summaries(*)
    `)
    .order('updatedAt', { ascending: false })

  if (error) throw error
  return data || []
}

export async function getProject(id: string) {
  const { data, error } = await supabase
    .from('projects')
    .select(`
      *,
      people:project_people(
        *,
        teamMember:team_members(*),
        role:rate_card_roles(*)
      ),
      holidays:project_holidays(*),
      summary:project_summaries(*)
    `)
    .eq('id', id)
    .single()

  if (error) throw error
  return data
}

export async function getProjectSummary(projectId: string) {
  const { data, error } = await supabase
    .from('projects')
    .select(`
      *,
      people:project_people(*),
      summary:project_summaries(*)
    `)
    .eq('id', projectId)
    .single()

  if (error) {
    if (error.code === 'PGRST116') {
      throw new Error('Project not found')
    }
    throw error
  }

  return data
}

// Real-time subscriptions
export function subscribeToTeamMembers(callback: (payload: any) => void) {
  return supabase
    .channel('team_members_changes')
    .on('postgres_changes', {
      event: '*',
      schema: 'public',
      table: 'team_members'
    }, callback)
    .subscribe()
}

export function subscribeToProjects(callback: (payload: any) => void) {
  return supabase
    .channel('projects_changes')
    .on('postgres_changes', {
      event: '*',
      schema: 'public',
      table: 'projects'
    }, callback)
    .subscribe()
}
