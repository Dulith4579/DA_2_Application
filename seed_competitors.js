const mongoose = require('mongoose');

const DISTRICTS = [
  'Colombo', 'Gampaha', 'Kalutara', 'Kandy', 'Galle',
  'Matara', 'Kurunegala', 'Ratnapura', 'Badulla', 'Jaffna'
];

const ROUTE_MAP = {
  'Colombo':    'RT-COL-001', 'Gampaha':    'RT-GAM-002',
  'Kalutara':   'RT-KAL-003', 'Kandy':      'RT-KAN-004',
  'Galle':      'RT-GAL-005', 'Matara':     'RT-MAT-006',
  'Kurunegala': 'RT-KUR-007', 'Ratnapura':  'RT-RAT-008',
  'Badulla':    'RT-BAD-009', 'Jaffna':     'RT-JAF-010'
};

const COMPETITORS = [
  { product_name: 'Generic Toothpaste 150g',      category: 'Oral Care',     competing_against: 'Clogard',       manufacturer: 'Lanka Pharma Ltd',     avg_price_lkr: 78.50  },
  { product_name: 'No-Brand Whitening Paste 100g', category: 'Oral Care',    competing_against: 'Clogard',       manufacturer: 'MediDent Co.',         avg_price_lkr: 65.00  },
  { product_name: 'Generic Shampoo 200ml',         category: 'Hair Care',    competing_against: 'Kumarika',      manufacturer: 'Pure Roots Ltd',       avg_price_lkr: 120.00 },
  { product_name: 'Herbal Hair Oil 100ml',         category: 'Hair Care',    competing_against: 'Kumarika',      manufacturer: 'Naturelle Pvt Ltd',    avg_price_lkr: 145.00 },
  { product_name: 'Generic Baby Lotion 200ml',     category: 'Baby Care',    competing_against: 'Baby Cheramy',  manufacturer: 'SoftCare Lanka',       avg_price_lkr: 195.00 },
  { product_name: 'Economy Baby Powder 250g',      category: 'Baby Care',    competing_against: 'Baby Cheramy',  manufacturer: 'InfaCare Ltd',         avg_price_lkr: 110.00 },
  { product_name: 'Generic Moisturiser 150ml',     category: 'Skin Care',    competing_against: 'Velvet',        manufacturer: 'GlowSkin Co.',         avg_price_lkr: 155.00 },
  { product_name: 'Economy Body Lotion 300ml',     category: 'Skin Care',    competing_against: 'Velvet',        manufacturer: 'SkinPlus Lanka',       avg_price_lkr: 210.00 },
  { product_name: 'Generic Antiseptic Bar 100g',   category: 'Personal Care', competing_against: 'Protex',       manufacturer: 'CleanShield Ltd',      avg_price_lkr: 52.00  },
  { product_name: 'Economy Fabric Powder 1kg',     category: 'Fabric Care',  competing_against: 'Dandex',        manufacturer: 'WashWell Ltd',         avg_price_lkr: 320.00 },
];

const THREAT_LEVELS = ['Low', 'Medium', 'High'];

const competitorProductSchema = new mongoose.Schema(
  {
    _id:                  { type: String, required: true },
    product_name:         { type: String, required: true },
    category:             { type: String, required: true },
    competing_against:    { type: String, required: true },
    manufacturer:         { type: String, required: true },
    avg_price_lkr:        { type: Number, required: true },
    district_spotted:     { type: String, required: true },
    spotted_at_route_id:  { type: String, required: true },
    threat_level:         { type: String, required: true },
    date_recorded:        { type: Date,   required: true },
  },
  { versionKey: false }
);

const CompetitorProduct = mongoose.model('competitor_products', competitorProductSchema, 'competitor_products');

function randomItem(arr) {
  return arr[Math.floor(Math.random() * arr.length)];
}

function randomDate(start, end) {
  return new Date(start.getTime() + Math.random() * (end.getTime() - start.getTime()));
}

async function seed() {
  try {
    await mongoose.connect('mongodb://localhost:27017/hemas_da2');
    console.log('✅ Connected to MongoDB');

    try {
      await mongoose.connection.collection('competitor_products').drop();
      console.log('Dropped existing competitor_products collection');
    } catch (e) {
      if (e.code === 26) console.log('Collection does not exist, creating new...');
    }

    const docs = [];
    const startDate = new Date('2024-09-01');
    const endDate   = new Date('2025-05-01');

    // 10 districts × 10 competitor products = 100 documents
    for (const district of DISTRICTS) {
      for (let i = 0; i < COMPETITORS.length; i++) {
        const comp = COMPETITORS[i];
        const distIdx  = DISTRICTS.indexOf(district);
        const idNum    = distIdx * 10 + i + 1;

        // Randomly vary price slightly per district
        const priceVariation = (Math.random() * 20 - 10);
        const finalPrice = parseFloat((comp.avg_price_lkr + priceVariation).toFixed(2));

        // Threat level based on how cheap the product is vs Hemas equivalents
        let threat = 'Low';
        if (finalPrice < 100)  threat = 'High';
        else if (finalPrice < 200) threat = 'Medium';

        docs.push({
          _id:                 `CP-${idNum.toString().padStart(3, '0')}`,
          product_name:        comp.product_name,
          category:            comp.category,
          competing_against:   comp.competing_against,
          manufacturer:        comp.manufacturer,
          avg_price_lkr:       finalPrice,
          district_spotted:    district,
          spotted_at_route_id: ROUTE_MAP[district],
          threat_level:        threat,
          date_recorded:       randomDate(startDate, endDate),
        });
      }
    }

    await CompetitorProduct.insertMany(docs);
    console.log(`✅ Successfully seeded ${docs.length} competitor products.`);

  } catch (err) {
    console.error('❌ Seeding error:', err);
  } finally {
    await mongoose.disconnect();
    console.log('MongoDB disconnected');
  }
}

seed();
