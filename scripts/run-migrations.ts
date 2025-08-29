import { createClient } from '@supabase/supabase-js'
import * as fs from 'fs'
import * as path from 'path'

// Load environment variables
require('dotenv').config({ path: '.env.local' })

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL!
const supabaseServiceKey = process.env.SUPABASE_SERVICE_ROLE_KEY!

if (!supabaseUrl || !supabaseServiceKey) {
  console.error('Missing required environment variables:')
  console.error('- NEXT_PUBLIC_SUPABASE_URL')
  console.error('- SUPABASE_SERVICE_ROLE_KEY')
  console.error('\nPlease check your .env.local file')
  process.exit(1)
}

// Create Supabase client with service role key for admin operations
const supabase = createClient(supabaseUrl, supabaseServiceKey)

async function runMigration(migrationFile: string) {
  console.log(`\n🔄 Running migration: ${migrationFile}`)
  
  try {
    const filePath = path.join(__dirname, 'migrations', migrationFile)
    const sqlContent = fs.readFileSync(filePath, 'utf8')
    
    // Split SQL content into individual statements
    const statements = sqlContent
      .split(';')
      .map(stmt => stmt.trim())
      .filter(stmt => stmt.length > 0 && !stmt.startsWith('--'))
    
    console.log(`📝 Found ${statements.length} SQL statements to execute`)
    
    let successCount = 0
    let errorCount = 0
    
    for (let i = 0; i < statements.length; i++) {
      const statement = statements[i]
      
      if (statement.trim()) {
        try {
          const { error } = await supabase.rpc('exec_sql', { sql: statement })
          
          if (error) {
            console.error(`❌ Error in statement ${i + 1}:`, error.message)
            errorCount++
          } else {
            successCount++
          }
        } catch (err) {
          console.error(`❌ Error in statement ${i + 1}:`, err)
          errorCount++
        }
      }
    }
    
    console.log(`✅ Migration ${migrationFile} completed:`)
    console.log(`   - Successful statements: ${successCount}`)
    console.log(`   - Failed statements: ${errorCount}`)
    
    return errorCount === 0
  } catch (error) {
    console.error(`❌ Failed to run migration ${migrationFile}:`, error)
    return false
  }
}

async function runMigrations() {
  console.log('🚀 Starting Supabase migrations...')
  console.log(`📡 Connecting to: ${supabaseUrl}`)
  
  // Check if we can connect to Supabase
  try {
    const { data, error } = await supabase.from('projects').select('count').limit(1)
    if (error && error.code !== 'PGRST116') { // PGRST116 is "relation does not exist" which is expected
      console.error('❌ Cannot connect to Supabase:', error.message)
      process.exit(1)
    }
  } catch (error) {
    console.error('❌ Cannot connect to Supabase:', error)
    process.exit(1)
  }
  
  // Migration files in order
  const migrations = [
    '001_initial_schema.sql',
    '002_enhancements.sql'
  ]
  
  let allSuccess = true
  
  for (const migration of migrations) {
    const success = await runMigration(migration)
    if (!success) {
      allSuccess = false
      console.log(`⚠️  Migration ${migration} had errors, but continuing...`)
    }
  }
  
  if (allSuccess) {
    console.log('\n🎉 All migrations completed successfully!')
  } else {
    console.log('\n⚠️  Some migrations had errors. Please check the output above.')
    process.exit(1)
  }
}

// Alternative approach using direct SQL execution
async function runMigrationsDirect() {
  console.log('🚀 Starting Supabase migrations (direct SQL)...')
  console.log(`📡 Connecting to: ${supabaseUrl}`)
  
  // Migration files in order
  const migrations = [
    '001_initial_schema.sql',
    '002_enhancements.sql'
  ]
  
  let allSuccess = true
  
  for (const migration of migrations) {
    console.log(`\n🔄 Running migration: ${migration}`)
    
    try {
      const filePath = path.join(__dirname, 'migrations', migration)
      const sqlContent = fs.readFileSync(filePath, 'utf8')
      
      // Execute the entire SQL file as one statement
      const { error } = await supabase.rpc('exec_sql', { sql: sqlContent })
      
      if (error) {
        console.error(`❌ Error in migration ${migration}:`, error.message)
        allSuccess = false
      } else {
        console.log(`✅ Migration ${migration} completed successfully`)
      }
    } catch (error) {
      console.error(`❌ Failed to run migration ${migration}:`, error)
      allSuccess = false
    }
  }
  
  if (allSuccess) {
    console.log('\n🎉 All migrations completed successfully!')
  } else {
    console.log('\n⚠️  Some migrations had errors. Please check the output above.')
    process.exit(1)
  }
}

// Run the migrations
if (require.main === module) {
  // Try direct SQL execution first, fallback to statement-by-statement
  runMigrationsDirect().catch(() => {
    console.log('\n🔄 Falling back to statement-by-statement execution...')
    runMigrations()
  })
}
