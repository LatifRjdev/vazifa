/**
 * Migration Script: Remove Verification Fields
 *
 * This script removes the verification system from the database:
 * 1. Removes isEmailVerified and isPhoneVerified fields from all users
 * 2. Drops the verifications collection
 * 3. Drops the phoneverifications collection
 *
 * Run with: node scripts/remove-verification-fields.js
 */

import mongoose from 'mongoose';
import dotenv from 'dotenv';

dotenv.config();

const MONGODB_URI = process.env.MONGODB_URI || 'mongodb://localhost:27017/vazifa';

async function runMigration() {
  console.log('='.repeat(60));
  console.log('Starting Migration: Remove Verification Fields');
  console.log('='.repeat(60));

  try {
    // Connect to MongoDB
    console.log('\n1. Connecting to MongoDB...');
    await mongoose.connect(MONGODB_URI);
    console.log('   Connected to:', MONGODB_URI.replace(/\/\/[^:]+:[^@]+@/, '//***:***@'));

    const db = mongoose.connection.db;

    // Step 1: Remove verification fields from all users
    console.log('\n2. Removing verification fields from users...');
    const usersCollection = db.collection('users');

    const updateResult = await usersCollection.updateMany(
      {},
      {
        $unset: {
          isEmailVerified: '',
          isPhoneVerified: ''
        }
      }
    );

    console.log(`   Modified ${updateResult.modifiedCount} user documents`);
    console.log(`   Matched ${updateResult.matchedCount} user documents`);

    // Step 2: Drop verifications collection
    console.log('\n3. Dropping verifications collection...');
    try {
      await db.collection('verifications').drop();
      console.log('   Verifications collection dropped');
    } catch (err) {
      if (err.code === 26) { // NamespaceNotFound
        console.log('   Verifications collection does not exist (already dropped or never created)');
      } else {
        throw err;
      }
    }

    // Step 3: Drop phoneverifications collection
    console.log('\n4. Dropping phoneverifications collection...');
    try {
      await db.collection('phoneverifications').drop();
      console.log('   PhoneVerifications collection dropped');
    } catch (err) {
      if (err.code === 26) { // NamespaceNotFound
        console.log('   PhoneVerifications collection does not exist (already dropped or never created)');
      } else {
        throw err;
      }
    }

    console.log('\n' + '='.repeat(60));
    console.log('Migration completed successfully!');
    console.log('='.repeat(60));

  } catch (error) {
    console.error('\nMigration failed:', error.message);
    process.exit(1);
  } finally {
    await mongoose.disconnect();
    console.log('\nDisconnected from MongoDB');
  }
}

runMigration();
