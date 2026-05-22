const mongoose = require('mongoose');

const DISTRICTS = [
  'Colombo', 'Gampaha', 'Kalutara', 'Kandy', 'Galle',
  'Matara', 'Kurunegala', 'Ratnapura', 'Badulla', 'Jaffna'
];

const TIERS = ['Low', 'Medium', 'High', 'Critical'];

const economicIndicatorSchema = new mongoose.Schema(
  {
    _id:                                   { type: String, required: true },
    district:                              { type: String, required: true },
    national_consumer_price_index_ncpi:    { type: Number, required: true },
    local_food_inflation_rate:             { type: Number, required: true },
    average_weighted_prime_lending_rate_awplr: { type: Number, required: true },
    economic_risk_tier:                    { type: String, required: true },
  },
  { versionKey: false }
);

const EconomicIndicator = mongoose.model('economic_indicators', economicIndicatorSchema, 'economic_indicators');

function getRandom(min, max) {
  return Number((Math.random() * (max - min) + min).toFixed(2));
}

async function seed() {
  try {
    await mongoose.connect('mongodb://localhost:27017/hemas_da2');
    console.log('✅ Connected to MongoDB');

    try {
      await mongoose.connection.collection('economic_indicators').drop();
      console.log('Dropped existing economic_indicators collection');
    } catch (e) {
      if (e.code === 26) {
        console.log('Collection does not exist, creating new one...');
      }
    }

    const docs = [];
    
    // Generate 100 documents: 10 districts over 10 consecutive months
    const year = 2025;
    let count = 0;

    for (let month = 1; month <= 10; month++) {
      for (const district of DISTRICTS) {
        const ncpi = getRandom(150, 200);
        const inflation = getRandom(2.0, 15.0);
        const awplr = getRandom(8.0, 18.0);
        
        let riskTier = 'Low';
        if (inflation > 10 || awplr > 15) riskTier = 'Critical';
        else if (inflation > 7 || awplr > 12) riskTier = 'High';
        else if (inflation > 4) riskTier = 'Medium';

        docs.push({
          _id: `ECO-${district.substring(0, 3).toUpperCase()}-${year}-${month.toString().padStart(2, '0')}`,
          district: district,
          national_consumer_price_index_ncpi: ncpi,
          local_food_inflation_rate: inflation,
          average_weighted_prime_lending_rate_awplr: awplr,
          economic_risk_tier: riskTier
        });
        count++;
      }
    }

    await EconomicIndicator.insertMany(docs);
    console.log(`✅ Successfully seeded ${docs.length} economic indicators.`);
    
  } catch (err) {
    console.error('❌ Seeding error:', err);
  } finally {
    await mongoose.disconnect();
    console.log('MongoDB disconnected');
  }
}

seed();
