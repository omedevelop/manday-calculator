export const revalidate = 300
export const runtime = 'nodejs'
import { NextResponse } from 'next/server'
import { supabase } from '@/lib/database'

export async function GET() {
  try {
    const { data, error } = await supabase
      .from('project_templates')
      .select('*')
      .order('updatedAt', { ascending: false })

    if (error) throw error

    const res = NextResponse.json(data || [])
    res.headers.set('Cache-Control', 's-maxage=300, stale-while-revalidate=600')
    return res
  } catch (error) {
    console.error('Error fetching templates:', error)
    return NextResponse.json(
      { error: 'Failed to fetch templates' },
      { status: 500 }
    )
  }
}


