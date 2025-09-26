#!/usr/bin/env node

// Debug script to check environment variables and URL selection
console.log('='.repeat(80));
console.log('🔍 ENVIRONMENT DEBUGGING SCRIPT');
console.log('='.repeat(80));

console.log('\n📋 ENVIRONMENT VARIABLES:');
console.log('NODE_ENV:', process.env.NODE_ENV);
console.log('FRONTEND_URL:', process.env.FRONTEND_URL);
console.log('PRODUCTION_FRONTEND_URL:', process.env.PRODUCTION_FRONTEND_URL);
console.log('BACKEND_URL:', process.env.BACKEND_URL);
console.log('PRODUCTION_BACKEND_URL:', process.env.PRODUCTION_BACKEND_URL);

console.log('\n🎯 URL SELECTION LOGIC:');
const frontendUrl = process.env.NODE_ENV === 'production' 
  ? process.env.PRODUCTION_FRONTEND_URL 
  : process.env.FRONTEND_URL;

console.log('Selected Frontend URL:', frontendUrl);
console.log('Is Production?', process.env.NODE_ENV === 'production');

console.log('\n📁 ENVIRONMENT FILES CHECK:');
const fs = require('fs');
const path = require('path');

const envFiles = ['.env', '.env.production', '.env.local'];
envFiles.forEach(file => {
  const filePath = path.join(__dirname, file);
  if (fs.existsSync(filePath)) {
    console.log(`✅ ${file} exists`);
    try {
      const content = fs.readFileSync(filePath, 'utf8');
      const lines = content.split('\n').filter(line => 
        line.includes('FRONTEND_URL') || 
        line.includes('NODE_ENV') || 
        line.includes('BACKEND_URL')
      );
      console.log(`   Content (relevant lines):`);
      lines.forEach(line => console.log(`   ${line}`));
    } catch (err) {
      console.log(`   ❌ Error reading ${file}:`, err.message);
    }
  } else {
    console.log(`❌ ${file} does not exist`);
  }
});

console.log('\n🔧 DOTENV LOADING TEST:');
try {
  const dotenv = require('dotenv');
  
  // Test loading .env.production
  const prodResult = dotenv.config({ path: '.env.production' });
  if (prodResult.error) {
    console.log('❌ Error loading .env.production:', prodResult.error.message);
  } else {
    console.log('✅ .env.production loaded successfully');
    console.log('   FRONTEND_URL from .env.production:', prodResult.parsed?.FRONTEND_URL);
    console.log('   PRODUCTION_FRONTEND_URL from .env.production:', prodResult.parsed?.PRODUCTION_FRONTEND_URL);
    console.log('   NODE_ENV from .env.production:', prodResult.parsed?.NODE_ENV);
  }
} catch (err) {
  console.log('❌ Error with dotenv:', err.message);
}

console.log('\n🚀 PROCESS INFORMATION:');
console.log('Current Working Directory:', process.cwd());
console.log('Script Directory:', __dirname);
console.log('Process Arguments:', process.argv);

console.log('\n💡 RECOMMENDATIONS:');
if (process.env.NODE_ENV !== 'production') {
  console.log('⚠️  NODE_ENV is not set to "production"');
  console.log('   Set NODE_ENV=production in your production environment');
}

if (!process.env.PRODUCTION_FRONTEND_URL) {
  console.log('⚠️  PRODUCTION_FRONTEND_URL is not set');
  console.log('   Make sure PRODUCTION_FRONTEND_URL=https://protocol.oci.tj is in your .env.production');
}

if (frontendUrl && frontendUrl.includes('localhost')) {
  console.log('⚠️  Frontend URL still contains localhost');
  console.log('   This indicates the production environment is not properly configured');
}

console.log('\n='.repeat(80));
console.log('🏁 DEBUG COMPLETE');
console.log('='.repeat(80));
