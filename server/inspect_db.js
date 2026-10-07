const mongoose = require('mongoose');

async function inspectDB() {
  const uri = 'mongodb+srv://chandan110906_db_user:atanHTUABsF38UEB@mypockectdb.2uefvdm.mongodb.net';
  await mongoose.connect(uri);
  const db = mongoose.connection.useDb('test');
  
  const users = await db.collection('users').find({}).toArray();
  console.log('--- USERS ---');
  for (const u of users) {
    console.log(`User ID: ${u._id}, Mobile: ${u.mobile_number}, Email: ${u.email}, Name: ${u.full_name}, Username: ${u.username}`);
  }

  const accounts = await db.collection('accounts').find({}).toArray();
  console.log('\n--- ACCOUNTS ---');
  console.log(`Total accounts: ${accounts.length}`);
  
  const accountsByUser = {};
  for (const a of accounts) {
    const uid = a.user_id.toString();
    if (!accountsByUser[uid]) accountsByUser[uid] = [];
    accountsByUser[uid].push(a.name);
  }
  
  for (const uid of Object.keys(accountsByUser)) {
      console.log(`User ${uid}: ${accountsByUser[uid].join(', ')}`);
  }

  await mongoose.disconnect();
}

inspectDB().catch(console.error);
