#!/usr/bin/env node

const fs = require('fs');
const path = require('path');
const readline = require('readline');

const rl = readline.createInterface({
  input: process.stdin,
  output: process.stdout
});

function question(prompt) {
  return new Promise((resolve) => {
    rl.question(prompt, resolve);
  });
}

async function main() {
  console.log('🚀 Supabase Migration Runner');
  console.log('='.repeat(40));
  console.log('');
  
  const migrationsDir = path.join(__dirname, 'migrations');
  const migrationFiles = [
    '001_initial_schema.sql',
    '002_enhancements.sql'
  ];
  
  // Check if migration files exist
  console.log('📁 Checking migration files...');
  const existingFiles = [];
  const missingFiles = [];
  
  migrationFiles.forEach(file => {
    const filePath = path.join(migrationsDir, file);
    if (fs.existsSync(filePath)) {
      existingFiles.push(file);
      console.log(`   ✅ ${file}`);
    } else {
      missingFiles.push(file);
      console.log(`   ❌ ${file} (not found)`);
    }
  });
  
  if (missingFiles.length > 0) {
    console.log('\n❌ Some migration files are missing. Please check the file paths.');
    process.exit(1);
  }
  
  console.log('\n✅ All migration files found!');
  
  // Ask user if they want to proceed
  const proceed = await question('\nDo you want to proceed with the migration instructions? (y/N): ');
  
  if (proceed.toLowerCase() !== 'y' && proceed.toLowerCase() !== 'yes') {
    console.log('\n👋 Migration cancelled. Goodbye!');
    rl.close();
    return;
  }
  
  console.log('\n📋 Migration Instructions:');
  console.log('='.repeat(40));
  
  for (let i = 0; i < existingFiles.length; i++) {
    const file = existingFiles[i];
    const filePath = path.join(migrationsDir, file);
    const content = fs.readFileSync(filePath, 'utf8');
    
    console.log(`\n${i + 1}. Migration: ${file}`);
    console.log(`   Lines: ${content.split('\n').length}`);
    console.log(`   Size: ${(content.length / 1024).toFixed(2)} KB`);
    
    // Show preview
    const lines = content.split('\n').slice(0, 5);
    console.log('   Preview:');
    lines.forEach(line => {
      if (line.trim()) {
        console.log(`      ${line}`);
      }
    });
    
    if (content.split('\n').length > 5) {
      console.log(`      ... (${content.split('\n').length - 5} more lines)`);
    }
    
    const showContent = await question(`\n   Show full content for ${file}? (y/N): `);
    
    if (showContent.toLowerCase() === 'y' || showContent.toLowerCase() === 'yes') {
      console.log('\n   Full SQL content:');
      console.log('   ' + '='.repeat(50));
      console.log(content);
      console.log('   ' + '='.repeat(50));
    }
    
    const ready = await question(`\n   Ready to proceed to next migration? (y/N): `);
    
    if (ready.toLowerCase() !== 'y' && ready.toLowerCase() !== 'yes') {
      console.log('\n⏸️  Migration paused. You can continue later.');
      break;
    }
  }
  
  console.log('\n🎯 Next Steps:');
  console.log('1. Go to your Supabase project dashboard');
  console.log('2. Navigate to SQL Editor');
  console.log('3. Copy and paste each migration file content');
  console.log('4. Execute the SQL statements in order');
  console.log('5. Verify the tables and enums were created');
  
  console.log('\n📚 Additional Resources:');
  console.log('- Supabase Documentation: https://supabase.com/docs');
  console.log('- SQL Editor Guide: https://supabase.com/docs/guides/database/sql-editor');
  console.log('- Migration Guide: scripts/implement-supabase.md');
  
  console.log('\n✅ Migration instructions completed!');
  rl.close();
}

// Handle process termination
process.on('SIGINT', () => {
  console.log('\n\n👋 Migration cancelled. Goodbye!');
  rl.close();
  process.exit(0);
});

// Run the script
if (require.main === module) {
  main().catch(error => {
    console.error('\n❌ Error:', error.message);
    rl.close();
    process.exit(1);
  });
}
