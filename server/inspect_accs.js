const mongoose = require('mongoose');

async function inspectAccs() {
  const uri = 'mongodb+srv://chandan110906_db_user:atanHTUABsF38UEB@mypockectdb.2uefvdm.mongodb.net';
  const client = new mongoose.mongo.MongoClient(uri);
  await client.connect();
  
  const db = client.db('test');
  const userId = new mongoose.mongo.ObjectId('6ac4a98fdf99cf8a9d2b8bb4');
  
  const accounts = await db.collection('accounts').find({ user_id: userId }).toArray();
  for (const a of accounts) {
      console.log(`Account: ${a.name}, Created: ${a._id.getTimestamp()}`);
  }
  
  await client.close();
}
inspectAccs().catch(console.error);
