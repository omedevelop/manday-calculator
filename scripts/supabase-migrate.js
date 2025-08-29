const { execSync } = require('child_process');
const fs = require('fs');
const path = require('path');

// Function to check if Supabase CLI is installed
function checkSupabaseCLI() {
  try {
    execSync('supabase --version', { stdio: 'pipe' });
    return true;
  } catch (error) {
    return false;
  }
}

// Function to run SQL file directly using Supabase CLI
function runSQLFile(sqlFilePath) {
  try {
    console.log(`🔄 Running SQL file: ${sqlFilePath}`);
    
    // Read the SQL file
    const sqlContent = fs.readFileSync(sqlFilePath, 'utf8');
    
    // Create a temporary file for the SQL content
    const tempFile = path.join(__dirname, 'temp_migration.sql');
    fs.writeFileSync(tempFile, sqlContent);
    
    // Run the SQL using Supabase CLI
    const command = `supabase db reset --linked --db-url postgresql://postgres:[YOUR-PASSWORD]@[YOUR-PROJECT-REF].supabase.co:5432/postgres`;
    
    console.log('⚠️  Note: You need to manually run the SQL files in your Supabase dashboard');
    console.log('📝 SQL content:');
    console.log('='.repeat(50));
    console.log(sqlContent);
    console.log('='.repeat(50));
    
    // Clean up temp file
    fs.unlinkSync(tempFile);
    
    return true;
  } catch (error) {
    console.error(`❌ Error running SQL file ${sqlFilePath}:`, error.message);
    return false;
  }
}

// Main function
function main() {
  console.log('🚀 Supabase Migration Script');
  console.log('='.repeat(40));
  
  // Check if Supabase CLI is available
  if (!checkSupabaseCLI()) {
    console.log('⚠️  Supabase CLI not found. Please install it first:');
    console.log('   npm install -g supabase');
    console.log('   or visit: https://supabase.com/docs/guides/cli');
    console.log('');
  }
  
  const migrationsDir = path.join(__dirname, 'migrations');
  const migrationFiles = [
    '001_initial_schema.sql',
    '002_enhancements.sql'
  ];
  
  console.log('📁 Migration files found:');
  migrationFiles.forEach(file => {
    const filePath = path.join(migrationsDir, file);
    if (fs.existsSync(filePath)) {
      console.log(`   ✅ ${file}`);
    } else {
      console.log(`   ❌ ${file} (not found)`);
    }
  });
  
  console.log('\n📋 To implement these migrations in Supabase:');
  console.log('');
  console.log('1. Go to your Supabase project dashboard');
  console.log('2. Navigate to SQL Editor');
  console.log('3. Copy and paste the SQL content from each migration file');
  console.log('4. Execute the SQL statements');
  console.log('');
  console.log('📝 Migration files to run in order:');
  
  let allSuccess = true;
  
  migrationFiles.forEach((file, index) => {
    const filePath = path.join(migrationsDir, file);
    if (fs.existsSync(filePath)) {
      console.log(`\n${index + 1}. ${file}:`);
      console.log('   Path:', filePath);
      
      // Show first few lines of the SQL file
      const content = fs.readFileSync(filePath, 'utf8');
      const lines = content.split('\n').slice(0, 10);
      console.log('   Preview:');
      lines.forEach(line => {
        if (line.trim()) {
          console.log(`      ${line}`);
        }
      });
      
      if (content.split('\n').length > 10) {
        console.log(`      ... (${content.split('\n').length - 10} more lines)`);
      }
    } else {
      console.log(`\n${index + 1}. ${file}: ❌ File not found`);
      allSuccess = false;
    }
  });
  
  console.log('\n🎯 Next steps:');
  console.log('1. Set up your Supabase project if not already done');
  console.log('2. Configure your environment variables in .env.local');
  console.log('3. Run the SQL migrations in Supabase dashboard');
  console.log('4. Test your application');
  
  if (!allSuccess) {
    console.log('\n⚠️  Some migration files are missing. Please check the file paths.');
    process.exit(1);
  }
}

// Run the script
if (require.main === module) {
  main();
}
