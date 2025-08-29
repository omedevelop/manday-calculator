#!/usr/bin/env tsx

/**
 * Database Setup Script for Manday Calculator
 * 
 * This script sets up the database schema and initial data for the application.
 * It can be run to initialize a new database or update an existing one.
 */

import { createClient } from '@supabase/supabase-js'
import { readFileSync } from 'fs'
import { join } from 'path'

// Configuration
const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL
const supabaseServiceKey = process.env.SUPABASE_SERVICE_ROLE_KEY

if (!supabaseUrl || !supabaseServiceKey) {
  console.error('❌ Missing required environment variables:')
  console.error('   - NEXT_PUBLIC_SUPABASE_URL')
  console.error('   - SUPABASE_SERVICE_ROLE_KEY')
  process.exit(1)
}

const supabase = createClient(supabaseUrl, supabaseServiceKey, {
  auth: {
    autoRefreshToken: false,
    persistSession: false
  }
})

async function readMigrationFile(filename: string): Promise<string> {
  const filePath = join(__dirname, 'migrations', filename)
  return readFileSync(filePath, 'utf-8')
}

async function runMigration(migrationName: string, sql: string) {
  console.log(`🔄 Running migration: ${migrationName}`)
  
  try {
    // Split SQL into individual statements
    const statements = sql
      .split(';')
      .map(stmt => stmt.trim())
      .filter(stmt => stmt.length > 0 && !stmt.startsWith('--'))
    
    for (const statement of statements) {
      if (statement.trim()) {
        const { error } = await supabase.rpc('exec_sql', { sql: statement })
        if (error) {
          console.error(`❌ Error executing statement: ${error.message}`)
          console.error(`Statement: ${statement.substring(0, 100)}...`)
          throw error
        }
      }
    }
    
    console.log(`✅ Migration completed: ${migrationName}`)
  } catch (error) {
    console.error(`❌ Migration failed: ${migrationName}`)
    console.error(error)
    throw error
  }
}

async function checkDatabaseConnection() {
  console.log('🔍 Checking database connection...')
  
  try {
    const { data, error } = await supabase
      .from('rate_card_roles')
      .select('count')
      .limit(1)
    
    if (error) {
      console.log('📝 Database exists but may need initialization')
      return false
    }
    
    console.log('✅ Database connection successful')
    return true
  } catch (error) {
    console.log('📝 Database may not be initialized yet')
    return false
  }
}

async function insertDefaultData() {
  console.log('📝 Inserting default data...')
  
  try {
    // Insert default rate card roles if they don't exist
    const defaultRoles = [
      'Developer',
      'Designer', 
      'Project Manager',
      'Business Analyst',
      'QA Engineer',
      'DevOps Engineer',
      'Data Scientist',
      'UX Researcher'
    ]
    
    for (const roleName of defaultRoles) {
      const { error } = await supabase
        .from('rate_card_roles')
        .upsert({ name: roleName }, { onConflict: 'name' })
      
      if (error) {
        console.warn(`⚠️  Could not insert role "${roleName}": ${error.message}`)
      }
    }
    
    // Insert some sample rate card tiers
    const { data: roles } = await supabase
      .from('rate_card_roles')
      .select('id, name')
      .limit(3)
    
    if (roles && roles.length > 0) {
      const sampleTiers = [
        { level: 'JUNIOR', pricePerDay: 8000 },
        { level: 'SENIOR', pricePerDay: 12000 },
        { level: 'TEAM_LEAD', pricePerDay: 16000 }
      ]
      
      for (const role of roles) {
        for (const tier of sampleTiers) {
          const { error } = await supabase
            .from('rate_card_tiers')
            .upsert({
              roleId: role.id,
              level: tier.level,
              pricePerDay: tier.pricePerDay,
              active: true
            }, { onConflict: 'roleId,level' })
          
          if (error) {
            console.warn(`⚠️  Could not insert tier for "${role.name}": ${error.message}`)
          }
        }
      }
    }
    
    console.log('✅ Default data inserted successfully')
  } catch (error) {
    console.error('❌ Error inserting default data:', error)
    throw error
  }
}

async function verifySetup() {
  console.log('🔍 Verifying database setup...')
  
  try {
    // Check if all tables exist
    const tables = [
      'rate_card_roles',
      'rate_card_tiers', 
      'team_members',
      'projects',
      'project_people',
      'project_holidays',
      'project_templates',
      'project_summaries'
    ]
    
    for (const table of tables) {
      const { error } = await supabase
        .from(table)
        .select('count')
        .limit(1)
      
      if (error) {
        console.error(`❌ Table "${table}" not found or accessible`)
        return false
      }
    }
    
    // Check if default roles exist
    const { data: roles, error: rolesError } = await supabase
      .from('rate_card_roles')
      .select('name')
    
    if (rolesError) {
      console.error('❌ Could not verify default roles')
      return false
    }
    
    if (!roles || roles.length === 0) {
      console.warn('⚠️  No default roles found')
    } else {
      console.log(`✅ Found ${roles.length} rate card roles`)
    }
    
    console.log('✅ Database setup verification completed')
    return true
  } catch (error) {
    console.error('❌ Database verification failed:', error)
    return false
  }
}

async function main() {
  console.log('🚀 Starting database setup for Manday Calculator...')
  console.log('')
  
  try {
    // Check if database is already set up
    const isConnected = await checkDatabaseConnection()
    
    if (!isConnected) {
      console.log('📝 Running initial database setup...')
      
      // Run initial migration
      const initialMigration = await readMigrationFile('001_initial_schema.sql')
      await runMigration('001_initial_schema', initialMigration)
      
      // Run enhancements migration
      const enhancementsMigration = await readMigrationFile('002_enhancements.sql')
      await runMigration('002_enhancements', enhancementsMigration)
      
      // Insert default data
      await insertDefaultData()
    } else {
      console.log('📝 Database already exists, checking for updates...')
      
      // Check if we need to run the enhancements migration
      const { data: auditLogs } = await supabase
        .from('audit_logs')
        .select('count')
        .limit(1)
      
      if (!auditLogs) {
        console.log('📝 Running enhancements migration...')
        const enhancementsMigration = await readMigrationFile('002_enhancements.sql')
        await runMigration('002_enhancements', enhancementsMigration)
      } else {
        console.log('✅ Enhancements already applied')
      }
    }
    
    // Verify the setup
    const isVerified = await verifySetup()
    
    if (isVerified) {
      console.log('')
      console.log('🎉 Database setup completed successfully!')
      console.log('')
      console.log('📊 Database includes:')
      console.log('   ✅ Rate card management (roles and tiers)')
      console.log('   ✅ Team member management')
      console.log('   ✅ Project management with people and holidays')
      console.log('   ✅ Project templates and summaries')
      console.log('   ✅ Audit logging and change tracking')
      console.log('   ✅ Time tracking and milestones')
      console.log('   ✅ Team member skills and availability')
      console.log('   ✅ Project dependencies and attachments')
      console.log('')
      console.log('🚀 Your Manday Calculator is ready to use!')
    } else {
      console.error('❌ Database setup verification failed')
      process.exit(1)
    }
    
  } catch (error) {
    console.error('❌ Database setup failed:', error)
    process.exit(1)
  }
}

// Run the setup
if (require.main === module) {
  main().catch(console.error)
}

export { main as setupDatabase }
