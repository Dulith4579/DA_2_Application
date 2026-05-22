const mongoose = require('mongoose');

// Mock data
const DISTRICTS = [
  'Colombo', 'Gampaha', 'Kalutara', 'Kandy', 'Galle',
  'Matara', 'Kurunegala', 'Ratnapura', 'Badulla', 'Jaffna'
];
const PREFIXES = ['Mega', 'Super', 'City', 'Fresh', 'Prime', 'Value', 'Daily', 'Family'];
const SUFFIXES = ['Mart', 'Store', 'Supermarket', 'Grocers', 'Market', 'Plaza', 'Center'];

// Schema definition matching server.js
const superMarketSchema = new mongoose.Schema(
  {
    name:     { type: String, required: true },
    district: { type: String, required: true },
    added_at: { type: Date, default: Date.now }
  },
  { versionKey: false }
);

const SuperMarket = mongoose.model('supermarkets', superMarketSchema, 'supermarkets');

async function seed() {
  try {
    await mongoose.connect('mongodb://localhost:27017/hemas_da2');
    console.log('✅ Connected to MongoDB');

    // Drop the collection if it exists to start fresh
    try {
      await mongoose.connection.collection('supermarkets').drop();
      console.log('Dropped existing supermarkets collection');
    } catch (e) {
      if (e.code === 26) {
        console.log('Collection does not exist, creating new one...');
      } else {
        throw e;
      }
    }

    const supermarkets = [];
    for (let i = 0; i < 100; i++) {
      const p = PREFIXES[Math.floor(Math.random() * PREFIXES.length)];
      const s = SUFFIXES[Math.floor(Math.random() * SUFFIXES.length)];
      const district = DISTRICTS[Math.floor(Math.random() * DISTRICTS.length)];
      
      supermarkets.push({
        name: `${p} ${s} - Branch ${i + 1}`,
        district: district
      });
    }

    await SuperMarket.insertMany(supermarkets);
    console.log(`✅ Successfully seeded ${supermarkets.length} supermarkets.`);
    
  } catch (err) {
    console.error('❌ Seeding error:', err);
  } finally {
    await mongoose.disconnect();
    console.log('MongoDB disconnected');
  }
}

seed();
