const mongoose = require('mongoose');

async function getCollections() {
  const uri = 'mongodb+srv://chandan110906_db_user:atanHTUABsF38UEB@mypockectdb.2uefvdm.mongodb.net';
  await mongoose.connect(uri);
  const db = mongoose.connection.useDb('test');
  
  const collections = await db.listCollections().toArray();
  console.log('Collections:');
  for (const c of collections) {
    const count = await db.collection(c.name).countDocuments();
    console.log(`- ${c.name}: ${count}`);
  }
  
  const users = await db.collection('users').find({}).toArray();
  console.log('Users:', users.map(u => ({ id: u._id, username: u.username })));

  await mongoose.disconnect();
}

getCollections().catch(console.error);
