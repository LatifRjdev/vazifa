const mongoose = require('mongoose');
require('dotenv').config();

const userSchema = new mongoose.Schema({}, { strict: false });
const User = mongoose.model('User', userSchema);

mongoose.connect(process.env.MONGODB_URI)
  .then(async () => {
    console.log('✅ Connected to MongoDB');
    
    const phoneNumber = '+992989328080';
    const email = 'latifrj78@gmail.com';
    
    const user = await User.findOne({ $or: [{ phoneNumber }, { email }] });
    
    if (user) {
      console.log('📱 Found user:', user.name, user.email, user.phoneNumber);
      await User.deleteOne({ _id: user._id });
      console.log('✅ User deleted successfully');
    } else {
      console.log('❌ No user found with phone:', phoneNumber, 'or email:', email);
    }
    
    process.exit(0);
  })
  .catch(err => {
    console.error('❌ Error:', err.message);
    process.exit(1);
  });
