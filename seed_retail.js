const mongoose = require('mongoose');

const PREDEFINED_ROUTES = [
  'RT-COL-001', 'RT-GAM-002', 'RT-KAL-003', 
  'RT-KAN-004', 'RT-GAL-005', 'RT-MAT-006',
  'RT-KUR-007', 'RT-RAT-008', 'RT-BAD-009', 'RT-JAF-010'
];

const SL_NAMES = [
  'Perera', 'Fernando', 'Silva', 'Bandara', 'Samarakoon', 
  'Jayasinghe', 'Kamal', 'Sunil', 'Nuwan', 'Amila', 
  'Saman', 'Thilak', 'Lanka', 'Rathnayake', 'Sanjeewa'
];

const DISTRICT_MAP = {
  'COL': 'Colombo',
  'GAM': 'Gampaha',
  'KAL': 'Kalutara',
  'KAN': 'Kandy',
  'GAL': 'Galle',
  'MAT': 'Matara',
  'KUR': 'Kurunegala',
  'RAT': 'Ratnapura',
  'BAD': 'Badulla',
  'JAF': 'Jaffna'
};

const STORE_TYPES = [
  { suffix: 'Pharmacy', market_type: 'Pharmacy' },
  { suffix: 'Stores', market_type: 'General Trade' },
  { suffix: 'Groceries', market_type: 'General Trade' },
  { suffix: 'Mini Mart', market_type: 'Mini-mart' },
  { suffix: 'Trade Centre', market_type: 'General Trade' },
  { suffix: 'Dispensary', market_type: 'Pharmacy' },
];

const retailOutletSchema = new mongoose.Schema(
  {
    _id:                 { type: String, required: true },
    outlet_name:         { type: String, required: true },
    market_type:         { type: String, required: true },
    district:            { type: String, required: true },
    associated_route_id: { type: String, ref: 'distributor_routes' },
    has_generic_penetration: { type: Boolean, default: false },
    order_frequency_days: { type: Number, required: true },
    is_active:           { type: Boolean, default: true },
    week_1_performance:  { type: String, default: 'Pending' },
    week_2_performance:  { type: String, default: 'Pending' },
    week_3_performance:  { type: String, default: 'Pending' },
    mitigation_active:   { type: Boolean, default: false },
    mitigation_strategy: { type: String, default: '' },
  },
  { versionKey: false }
);

const RetailOutlet = mongoose.model('retail_outlets', retailOutletSchema, 'retail_outlets');

async function seed() {
  try {
    await mongoose.connect('mongodb://localhost:27017/hemas_da2');
    console.log('✅ Connected to MongoDB');

    try {
      await mongoose.connection.collection('retail_outlets').drop();
      console.log('Dropped existing retail_outlets collection');
    } catch (e) {
      if (e.code === 26) {
        console.log('Collection does not exist, creating new one...');
      }
    }

    const docs = [];
    let idCounter = 1;

    for (const route of PREDEFINED_ROUTES) {
      // Create exactly 15 stores for each route
      for (let i = 0; i < 15; i++) {
        const namePrefix = SL_NAMES[Math.floor(Math.random() * SL_NAMES.length)];
        const storeInfo = STORE_TYPES[Math.floor(Math.random() * STORE_TYPES.length)];
        const routeCode = route.split('-')[1]; // e.g., 'COL' from 'RT-COL-001'
        const district = DISTRICT_MAP[routeCode] || 'Unknown';
        
        // Randomly assign generic penetration (approx 30% chance)
        const hasGeneric = Math.random() < 0.3;
        
        // Order frequency between 3 and 14 days
        const orderFreq = Math.floor(Math.random() * 12) + 3;

        docs.push({
          _id: `RO-${idCounter.toString().padStart(4, '0')}`,
          outlet_name: `${namePrefix} ${storeInfo.suffix}`,
          market_type: storeInfo.market_type,
          district: district,
          associated_route_id: route,
          has_generic_penetration: hasGeneric,
          order_frequency_days: orderFreq,
          is_active: true,
          week_1_performance: 'Pending',
          week_2_performance: 'Pending',
          week_3_performance: 'Pending',
          mitigation_active: false,
          mitigation_strategy: ''
        });
        
        idCounter++;
      }
    }

    await RetailOutlet.insertMany(docs);
    console.log(`✅ Successfully seeded ${docs.length} retail outlets.`);
    
  } catch (err) {
    console.error('❌ Seeding error:', err);
  } finally {
    await mongoose.disconnect();
    console.log('MongoDB disconnected');
  }
}

seed();
