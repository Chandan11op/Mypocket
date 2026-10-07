const mongoose = require('mongoose');
const bcrypt = require('bcryptjs');

async function createTestUser() {
  const uri = 'mongodb+srv://chandan110906_db_user:atanHTUABsF38UEB@mypockectdb.2uefvdm.mongodb.net';
  const client = new mongoose.mongo.MongoClient(uri);
  await client.connect();
  
  const db = client.db('test');
  
  const salt = await bcrypt.genSalt(12);
  const password_hash = await bcrypt.hash('user123', salt);
  
  const testUser = {
    mobile_number: '+911234567890',
    username: 'test_user_1234567890',
    email: 'testuser_1234567890@example.com',
    full_name: 'Antigravity Test User',
    date_of_birth: new Date('1990-01-01'),
    password_hash,
    is_verified: true,
    created_at: new Date(),
    updated_at: new Date()
  };
  
  const result = await db.collection('users').updateOne(
    { mobile_number: testUser.mobile_number },
    { $set: testUser },
    { upsert: true }
  );
  
  console.log('Test user created successfully in test DB:', result);
  await client.close();
}

createTestUser().catch(console.error);
