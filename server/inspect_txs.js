const mongoose = require('mongoose');

async function inspectTransactions() {
  const uri = 'mongodb+srv://chandan110906_db_user:atanHTUABsF38UEB@mypockectdb.2uefvdm.mongodb.net';
  await mongoose.connect(uri);
  const db = mongoose.connection.useDb('test');
  
  const accounts = await db.collection('accounts').find({}).toArray();
  const accMap = {};
  accounts.forEach(a => accMap[a._id.toString()] = a.name);

  const entries = await db.collection('journalentries').find({}).sort({ date: 1 }).toArray();
  console.log(`Total journal entries: ${entries.length}`);
  
  for (const e of entries) {
    if (e.description.includes('Opening balance') || e.description.includes('Rolex') || e.description.includes('Slice')) {
      console.log(`Desc: ${e.description}, Date: ${e.date}, CreatedAt: ${e.created_at || e.createdAt}`);
    }
  }

  await mongoose.disconnect();
}

inspectTransactions().catch(console.error);
