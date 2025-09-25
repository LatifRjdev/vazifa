import axios from 'axios';

const testCloudinaryUpload = async () => {
  const cloudName = 'dlvubqfkj';
  const uploadPreset = 'ml_default';
  
  console.log('Testing Cloudinary configuration...');
  console.log('Cloud Name:', cloudName);
  console.log('Upload Preset:', uploadPreset);
  
  // Create a simple test file (base64 encoded 1x1 pixel image)
  const testImageData = 'data:image/png;base64,iVBORw0KGgoAAAANSUhEUgAAAAEAAAABCAYAAAAfFcSJAAAADUlEQVR42mNkYPhfDwAChwGA60e6kgAAAABJRU5ErkJggg==';
  
  const url = `https://api.cloudinary.com/v1_1/${cloudName}/upload`;
  
  const formData = new FormData();
  formData.append('file', testImageData);
  formData.append('upload_preset', uploadPreset);
  
  try {
    const response = await axios.post(url, formData, {
      headers: { 'Content-Type': 'multipart/form-data' }
    });
    
    console.log('✅ Cloudinary upload successful!');
    console.log('Response:', response.data);
    return true;
  } catch (error) {
    console.log('❌ Cloudinary upload failed!');
    console.log('Error:', error.response?.data || error.message);
    return false;
  }
};

testCloudinaryUpload();
