const mongoose = require('mongoose');
const dotenv = require('dotenv');
const path = require('path');

dotenv.config({ path: path.join(__dirname, '.env') });

async function checkAtlasDB() {
  try {
    const mongoURI = process.env.MONGODB_CONNECTION_STRING;
    console.log('Connecting to:', mongoURI);
    await mongoose.connect(mongoURI);
    console.log('Connected to Atlas successfully.');
    
    const db = mongoose.connection.db;
    const collections = await db.listCollections().toArray();
    
    console.log('Collections:');
    for (const col of collections) {
        const count = await db.collection(col.name).countDocuments();
        console.log(` - ${col.name}: ${count} docs`);
    }
    
  } catch (error) {
    console.error('Error:', error.message);
  } finally {
    await mongoose.disconnect();
    process.exit();
  }
}

checkAtlasDB();
