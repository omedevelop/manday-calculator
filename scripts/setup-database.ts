#!/usr/bin/env tsx

/**
 * Database Setup Script - Pure Supabase
 * 
 * This script sets up your Supabase database with the required schema and sample data.
 * Run with: npm run db:setup
 */

import { config } from 'dotenv'
import { join } from 'path'
import { readFileSync } from 'fs'

// Load environment variables
config({ path: join(process.cwd(), '.env.local') })

import { supabase } from '../lib/database'

async function setupDatabase() {
  console.log('🚀 Setting up Supabase database...')

  try {
    // Test database connection
    console.log('📡 Testing database connection...')
    const { data, error } = await supabase.from('team_members').select('count').limit(1)
    if (error && !error.message.includes('does not exist')) {
      throw error
    }
    console.log('✅ Database connection successful!')

    // Check if schema exists
    const { data: tables } = await supabase.rpc('get_tables')
    const tableNames = tables?.map(t => t.table_name) || []
    
    if (!tableNames.includes('team_members')) {
      console.log('📦 Creating database schema...')
      
      // Read and execute the initial schema
      const schemaSQL = readFileSync(
        join(__dirname, 'migrations', '001_initial_schema.sql'), 
        'utf-8'
      )
      
      // Note: In production, you'd run this through Supabase CLI or dashboard
      console.log('⚠️  Please run the following SQL in your Supabase SQL editor:')
      console.log('----------------------------------------')
      console.log(schemaSQL)
      console.log('----------------------------------------')
      console.log('Then run this script again.')
      return
    }

    console.log('✅ Database schema exists!')

    // Check for sample data
    const { count: teamMemberCount } = await supabase
      .from('team_members')
      .select('*', { count: 'exact', head: true })

    const { count: rateCardRoleCount } = await supabase
      .from('rate_card_roles')
      .select('*', { count: 'exact', head: true })

    console.log(`👥 Team members: ${teamMemberCount || 0}`)
    console.log(`💼 Rate card roles: ${rateCardRoleCount || 0}`)

    // Create sample rate card roles if none exist
    if ((rateCardRoleCount || 0) === 0) {
      console.log('📝 Creating sample rate card roles...')
      
      const sampleRoles = [
        {
          name: 'Frontend Developer',
          tiers: [
            { level: 'JUNIOR' as const, pricePerDay: 8000 },
            { level: 'SENIOR' as const, pricePerDay: 12000 },
            { level: 'TEAM_LEAD' as const, pricePerDay: 16000 }
          ]
        },
        {
          name: 'Backend Developer',
          tiers: [
            { level: 'JUNIOR' as const, pricePerDay: 9000 },
            { level: 'SENIOR' as const, pricePerDay: 14000 },
            { level: 'TEAM_LEAD' as const, pricePerDay: 18000 }
          ]
        },
        {
          name: 'Full Stack Developer',
          tiers: [
            { level: 'JUNIOR' as const, pricePerDay: 10000 },
            { level: 'SENIOR' as const, pricePerDay: 15000 },
            { level: 'TEAM_LEAD' as const, pricePerDay: 20000 }
          ]
        },
        {
          name: 'UI/UX Designer',
          tiers: [
            { level: 'JUNIOR' as const, pricePerDay: 7000 },
            { level: 'SENIOR' as const, pricePerDay: 11000 },
            { level: 'TEAM_LEAD' as const, pricePerDay: 15000 }
          ]
        }
      ]

      for (const roleData of sampleRoles) {
        // Create role
        const { data: role, error: roleError } = await supabase
          .from('rate_card_roles')
          .insert({ name: roleData.name })
          .select()
          .single()

        if (roleError) throw roleError

        // Create tiers
        const tiersToInsert = roleData.tiers.map(tier => ({
          roleId: role.id,
          level: tier.level,
          pricePerDay: tier.pricePerDay
        }))

        const { error: tiersError } = await supabase
          .from('rate_card_tiers')
          .insert(tiersToInsert)

        if (tiersError) throw tiersError

        console.log(`✅ Created role: ${role.name}`)
      }
    }

    // Create sample team members if none exist
    if ((teamMemberCount || 0) === 0) {
      console.log('👤 Creating sample team members...')
      
      const { data: roles } = await supabase
        .from('rate_card_roles')
        .select(`
          *,
          tiers:rate_card_tiers(*)
        `)

      const sampleMembers = [
        {
          name: 'John Smith',
          roleName: 'Frontend Developer',
          level: 'SENIOR' as const,
          defaultRatePerDay: 12000,
          notes: 'React and TypeScript specialist'
        },
        {
          name: 'Sarah Johnson',
          roleName: 'Backend Developer',
          level: 'TEAM_LEAD' as const,
          defaultRatePerDay: 18000,
          notes: 'Node.js and PostgreSQL expert'
        },
        {
          name: 'Mike Chen',
          roleName: 'UI/UX Designer',
          level: 'SENIOR' as const,
          defaultRatePerDay: 11000,
          notes: 'Figma and user research specialist'
        }
      ]

      for (const memberData of sampleMembers) {
        const role = roles?.find(r => r.name === memberData.roleName)
        
        const { data: member, error } = await supabase
          .from('team_members')
          .insert({
            ...memberData,
            roleId: role?.id || null,
            status: 'ACTIVE'
          })
          .select()
          .single()

        if (error) throw error
        console.log(`✅ Created team member: ${member.name}`)
      }
    }

    console.log('🎉 Database setup completed successfully!')
    console.log('')
    console.log('Next steps:')
    console.log('1. Start your development server: npm run dev')
    console.log('2. Visit http://localhost:3000/team to see your Team Library')
    console.log('3. Generate types: npm run supabase:types')

  } catch (error) {
    console.error('❌ Setup failed:', error)
    process.exit(1)
  }
}

// Helper function to check if we can create the get_tables function
async function createHelperFunctions() {
  const { error } = await supabase.rpc('create_helper_functions', {
    sql: `
      CREATE OR REPLACE FUNCTION get_tables()
      RETURNS TABLE(table_name text) AS $$
      BEGIN
        RETURN QUERY
        SELECT t.table_name::text
        FROM information_schema.tables t
        WHERE t.table_schema = 'public'
        AND t.table_type = 'BASE TABLE';
      END;
      $$ LANGUAGE plpgsql;
    `
  })

  if (error) {
    console.log('Note: Could not create helper functions. This is normal.')
  }
}

// Run the setup
createHelperFunctions().then(() => setupDatabase())
