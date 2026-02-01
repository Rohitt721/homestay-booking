const mongoose = require('mongoose');

const mongoURI = 'mongodb://127.0.0.1:27017/hotel-booking';

async function checkDB() {
  try {
    await mongoose.connect(mongoURI);
    console.log('Connected to MongoDB successfully.');
    
    const db = mongoose.connection.db;
    const collections = await db.listCollections().toArray();
    
    if (collections.length === 0) {
      console.log('Database exists but has NO collections (effectively empty/deleted).');
    } else {
      console.log('Database contains the following collections:');
      collections.forEach(c => console.log(` - ${c.name}`));
      
      // Let's count documents in users and hotels if they exist
      for (const col of collections) {
          const count = await db.collection(col.name).countDocuments();
          console.log(`   (Count: ${count})`);
      }
    }
    
  } catch (error) {
    console.error('Error connecting to MongoDB:', error.message);
  } finally {
    await mongoose.disconnect();
  }
}

checkDB();
