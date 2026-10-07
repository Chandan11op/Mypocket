const mongoose = require('mongoose');

async function runMigration() {
  const uri = 'mongodb+srv://chandan110906_db_user:atanHTUABsF38UEB@mypockectdb.2uefvdm.mongodb.net';
  const client = new mongoose.mongo.MongoClient(uri);
  await client.connect();
  
  const srcDb = client.db('test');
  const destDb = client.db('mypocketdata');
  const userId = new mongoose.mongo.ObjectId('6ac4a98fdf99cf8a9d2b8bb4');

  const dummyNames = ['Credit Card Loan', 'Groww Investments', 'Slice Wallet', 'BOB Savings'];
  
  // 1. Users
  console.log('Migrating User...');
  const user = await srcDb.collection('users').findOne({ _id: userId });
  if (user) {
    await destDb.collection('users').updateOne({ _id: userId }, { $set: user }, { upsert: true });
  }

  // 2. UserSettings
  const settings = await srcDb.collection('usersettings').find({ user_id: userId }).toArray();
  for (const s of settings) {
    await destDb.collection('usersettings').updateOne({ _id: s._id }, { $set: s }, { upsert: true });
  }

  // 3. Accounts
  console.log('Migrating Accounts...');
  const accounts = await srcDb.collection('accounts').find({ user_id: userId }).toArray();
  const dummyAccountIds = new Set();
  
  for (const a of accounts) {
    if (dummyNames.includes(a.name)) {
      dummyAccountIds.add(a._id.toString());
      console.log('Skipping dummy account:', a.name);
    } else {
      await destDb.collection('accounts').updateOne({ _id: a._id }, { $set: a }, { upsert: true });
    }
  }

  // 4. Journal Entries
  console.log('Migrating Journal Entries...');
  const entries = await srcDb.collection('journalentries').find({ user_id: userId }).toArray();
  for (const e of entries) {
    // Check if any line references a dummy account
    let hasDummy = false;
    for (const l of e.lines) {
      if (l.account_id && dummyAccountIds.has(l.account_id.toString())) {
        hasDummy = true;
      }
    }
    if (!hasDummy) {
      await destDb.collection('journalentries').updateOne({ _id: e._id }, { $set: e }, { upsert: true });
    } else {
      console.log('Skipping dummy entry:', e.description);
    }
  }

  // 5. Transactions (if any)
  console.log('Migrating Transactions...');
  const txs = await srcDb.collection('transactions').find({ user_id: userId }).toArray();
  for (const tx of txs) {
    // Assuming legacy transactions might reference dummy accounts, but usually they are independent or have simple relations
    await destDb.collection('transactions').updateOne({ _id: tx._id }, { $set: tx }, { upsert: true });
  }

  // 6. People
  console.log('Migrating People...');
  const people = await srcDb.collection('people').find({ user_id: userId }).toArray();
  for (const p of people) {
    await destDb.collection('people').updateOne({ _id: p._id }, { $set: p }, { upsert: true });
  }

  // 7. Reconciliation Logs
  console.log('Migrating Reconciliation Logs...');
  const logs = await srcDb.collection('reconciliationlogs').find({ user_id: userId }).toArray();
  for (const log of logs) {
    if (!dummyAccountIds.has(log.account_id.toString())) {
      await destDb.collection('reconciliationlogs').updateOne({ _id: log._id }, { $set: log }, { upsert: true });
    }
  }

  // 8. ChatHistories
  console.log('Migrating Chat Histories...');
  const chats = await srcDb.collection('chathistories').find({ user_id: userId }).toArray();
  for (const c of chats) {
    await destDb.collection('chathistories').updateOne({ _id: c._id }, { $set: c }, { upsert: true });
  }

  // 9. Sessions
  console.log('Migrating Sessions...');
  const sessions = await srcDb.collection('sessions').find({ user_id: userId }).toArray();
  for (const s of sessions) {
    await destDb.collection('sessions').updateOne({ _id: s._id }, { $set: s }, { upsert: true });
  }
  
  // 10. Password Reset Tokens
  console.log('Migrating Password Reset Tokens...');
  const tokens = await srcDb.collection('passwordresettokens').find({ user_id: userId }).toArray();
  for (const t of tokens) {
    await destDb.collection('passwordresettokens').updateOne({ _id: t._id }, { $set: t }, { upsert: true });
  }

  console.log('Migration completed successfully!');
  await client.close();
}

runMigration().catch(console.error);
