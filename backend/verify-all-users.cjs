const mongoose = require('mongoose');
require('dotenv').config();

const userSchema = new mongoose.Schema({}, { strict: false });
const User = mongoose.model('User', userSchema);

mongoose.connect(process.env.MONGODB_URI)
  .then(async () => {
    console.log('✅ Connected to MongoDB');
    console.log('='.repeat(60));
    
    // Find all users
    const users = await User.find({});
    console.log(`📊 Found ${users.length} users in database`);
    console.log('='.repeat(60));
    
    let updatedCount = 0;
    let alreadyVerifiedCount = 0;
    
    for (const user of users) {
      const wasPhoneVerified = user.isPhoneVerified;
      const wasEmailVerified = user.isEmailVerified;
      
      // Update verification status
      user.isPhoneVerified = true;
      user.isEmailVerified = true;
      await user.save();
      
      if (!wasPhoneVerified || !wasEmailVerified) {
        updatedCount++;
        console.log(`✅ Verified: ${user.name} (${user.email || user.phoneNumber})`);
        console.log(`   - Phone: ${wasPhoneVerified ? 'already verified' : 'NOW VERIFIED'}`);
        console.log(`   - Email: ${wasEmailVerified ? 'already verified' : 'NOW VERIFIED'}`);
      } else {
        alreadyVerifiedCount++;
      }
    }
    
    console.log('='.repeat(60));
    console.log('📊 SUMMARY:');
    console.log(`   Total users: ${users.length}`);
    console.log(`   Updated: ${updatedCount}`);
    console.log(`   Already verified: ${alreadyVerifiedCount}`);
    console.log('='.repeat(60));
    console.log('✅ All users are now verified!');
    
    process.exit(0);
  })
  .catch(err => {
    console.error('❌ Error:', err.message);
    process.exit(1);
  });
