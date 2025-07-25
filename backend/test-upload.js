import axios from 'axios';
import FormData from 'form-data';
import fs from 'fs';

const testUpload = async () => {
  try {
    // First, let's login to get a token
    const loginResponse = await axios.post('http://localhost:5001/api-v1/auth/login', {
      email: 'testuser@example.com',
      password: 'password123'
    });
    
    const token = loginResponse.data.token;
    console.log('✅ Login successful, token obtained');
    
    // Create a simple test file
    const testContent = 'This is a test file for upload functionality';
    fs.writeFileSync('/tmp/test-upload.txt', testContent);
    
    // Test the upload endpoint
    const formData = new FormData();
    formData.append('file', fs.createReadStream('/tmp/test-upload.txt'));
    
    const uploadResponse = await axios.post('http://localhost:5001/api-v1/upload', formData, {
      headers: {
        ...formData.getHeaders(),
        'Authorization': `Bearer ${token}`
      }
    });
    
    console.log('✅ Upload successful!');
    console.log('Upload response:', uploadResponse.data);
    
    // Clean up
    fs.unlinkSync('/tmp/test-upload.txt');
    
  } catch (error) {
    console.log('❌ Test failed!');
    console.log('Error:', error.response?.data || error.message);
  }
};

testUpload();
