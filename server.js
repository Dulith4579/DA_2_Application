// ============================================================
// server.js — Hemas FMCG Distribution Channel Dashboard
// Backend: Express + Mongoose
// ============================================================

require('dotenv').config();
const express = require('express');
const cors    = require('cors');
const mongoose = require('mongoose');

const app  = express();
const PORT = process.env.PORT || 5000;

// ─── Middleware ───────────────────────────────────────────────
app.use(cors());
app.use(express.json());

// ─── Database Connection ──────────────────────────────────────
mongoose
  .connect(process.env.MONGO_URI)
  .then(() => console.log('✅  MongoDB connected successfully'))
  .catch((err) => {
    console.error('❌  MongoDB connection error:', err.message);
    process.exit(1);
  });

// ============================================================
// SCHEMA DEFINITIONS
// ============================================================

// 1. Users
const userSchema = new mongoose.Schema(
  {
    _id:      { type: String, required: true },
    username: { type: String, required: true },
    role:     { type: String, enum: ['Field_Supervisor', 'Area_Manager'], required: true },
  },
  { versionKey: false }
);

// 2. Distributor Routes
const distributorRouteSchema = new mongoose.Schema(
  {
    route_id:                     { type: String, required: true },
    district_cluster:             { type: String, required: true },
    sku_category:                 { type: String, required: true },
    brand_tracked:                { type: String, required: true },
    hemas_unit_price_lkr:         { type: Number, required: true },
    generic_competitor_price_lkr: { type: Number, required: true },
    price_gap_percent:            { type: Number, default: 0 },
    stock_availability_flag:      { type: Number, min: 0, max: 1, default: 1 }, // 0 = OOS, 1 = In-Stock
    three_week_volume_drop_percent: { type: Number, default: 0 },
    retail_stores_count:          { type: Number, default: 0 },
    bought_items:                 { type: Number, default: 0 },
    current_stock:                { type: Number, default: 0 },
    regional_observation:         { type: String, required: false },
    week_1_performance:           { type: String, enum: ['Pending', 'Declining', 'Consolidated', 'Performing Well'], default: 'Pending' },
    week_2_performance:           { type: String, enum: ['Pending', 'Declining', 'Consolidated', 'Performing Well'], default: 'Pending' },
    week_3_performance:           { type: String, enum: ['Pending', 'Declining', 'Consolidated', 'Performing Well'], default: 'Pending' },
    mitigation_active:            { type: Boolean, default: false },
    mitigation_strategy:          { type: String, default: '' },
    last_updated:                 { type: Date, default: Date.now },
  },
  { versionKey: false }
);

// 3. Economic Indicators
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

// 4. Retail Outlets
const retailOutletSchema = new mongoose.Schema(
  {
    _id:                 { type: String, required: true },
    outlet_name:         { type: String, required: true },
    market_type:         { type: String, required: true },
    district:            { type: String, required: true },
    associated_route_id: { type: String },
    has_generic_penetration: { type: Boolean, default: false },
    order_frequency_days: { type: Number, required: true },
    is_active:           { type: Boolean, default: true },
    week_1_performance:  { type: String, enum: ['Pending', 'Declining', 'Consolidated', 'Performing Well'], default: 'Pending' },
    week_2_performance:  { type: String, enum: ['Pending', 'Declining', 'Consolidated', 'Performing Well'], default: 'Pending' },
    week_3_performance:  { type: String, enum: ['Pending', 'Declining', 'Consolidated', 'Performing Well'], default: 'Pending' },
    mitigation_active:   { type: Boolean, default: false },
    mitigation_strategy: { type: String, default: '' },
  },
  { versionKey: false }
);

// 5. Supermarkets
const superMarketSchema = new mongoose.Schema(
  {
    name:     { type: String, required: true },
    district: { type: String, required: true },
    added_at: { type: Date, default: Date.now }
  },
  { versionKey: false }
);

// ─── Models ───────────────────────────────────────────────────
const User               = mongoose.model('users',               userSchema,               'users');
const DistributorRoute   = mongoose.model('distributor_routes',  distributorRouteSchema,   'distributor_routes');
const EconomicIndicator  = mongoose.model('economic_indicators', economicIndicatorSchema,  'economic_indicators');
const RetailOutlet       = mongoose.model('retail_outlets',      retailOutletSchema,       'retail_outlets');
const SuperMarket        = mongoose.model('supermarkets',        superMarketSchema,        'supermarkets');

// ============================================================
// HELPER — Auto-compute price_gap_percent
// ============================================================
function computePriceGap(hemas, generic) {
  if (!generic || generic === 0) return 0;
  return ((hemas - generic) / generic) * 100;
}

// ============================================================
// RESTful CRUD — /api/routes
// ============================================================

// GET all routes
app.get('/api/routes', async (req, res) => {
  try {
    const routes = await DistributorRoute.find().sort({ last_updated: -1 });
    res.json(routes);
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

// GET single route
app.get('/api/routes/:id', async (req, res) => {
  try {
    const route = await DistributorRoute.findById(req.params.id);
    if (!route) return res.status(404).json({ error: 'Route not found' });
    res.json(route);
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

// POST — create a new route (auto-computes price_gap_percent)
app.post('/api/routes', async (req, res) => {
  try {
    const data = req.body;
    console.log('--- NEW POST REQUEST ---');
    console.log(data);
    data.price_gap_percent = computePriceGap(
      data.hemas_unit_price_lkr,
      data.generic_competitor_price_lkr
    );
    data.last_updated = new Date();

    // Prevent passing an empty string as _id so mongoose creates one
    if (data._id === "") {
      delete data._id;
    }

    const route = new DistributorRoute(data);
    await route.save();
    res.status(201).json(route);
  } catch (err) {
    res.status(400).json({ error: err.message });
  }
});

// PUT — update a route (auto-computes price_gap_percent only if prices provided)
app.put('/api/routes/:id', async (req, res) => {
  try {
    const data = req.body;

    // Only recompute price gap if price fields are present in this update
    if (data.hemas_unit_price_lkr !== undefined && data.generic_competitor_price_lkr !== undefined) {
      data.price_gap_percent = computePriceGap(
        data.hemas_unit_price_lkr,
        data.generic_competitor_price_lkr
      );
    } else {
      // Remove price_gap_percent from the update so it isn't overwritten with NaN
      delete data.price_gap_percent;
    }

    data.last_updated = new Date();

    const route = await DistributorRoute.findByIdAndUpdate(
      req.params.id,
      { $set: data },
      { new: true, runValidators: true }
    );
    if (!route) return res.status(404).json({ error: 'Route not found' });
    res.json(route);
  } catch (err) {
    res.status(400).json({ error: err.message });
  }
});

// DELETE — remove a route
app.delete('/api/routes/:id', async (req, res) => {
  try {
    const route = await DistributorRoute.findByIdAndDelete(req.params.id);
    if (!route) return res.status(404).json({ error: 'Route not found' });
    res.json({ message: 'Route deleted successfully', id: req.params.id });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

// ============================================================
// RESTful CRUD — /api/supermarkets
// ============================================================

app.get('/api/supermarkets', async (req, res) => {
  try {
    const supermarkets = await SuperMarket.find();
    res.json(supermarkets);
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

// ============================================================
// RESTful CRUD — /api/retail-outlets
// ============================================================

// GET all (optionally filter by route)
app.get('/api/retail-outlets', async (req, res) => {
  try {
    const filter = {};
    if (req.query.route_id) filter.associated_route_id = req.query.route_id;
    const outlets = await RetailOutlet.find(filter).sort({ outlet_name: 1 });
    res.json(outlets);
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

// POST — create a new outlet
app.post('/api/retail-outlets', async (req, res) => {
  try {
    const data = req.body;
    // Auto-generate _id if not provided
    if (!data._id) {
      const count = await RetailOutlet.countDocuments();
      data._id = `RO-${(count + 1).toString().padStart(4, '0')}-${Date.now().toString().slice(-4)}`;
    }
    const outlet = new RetailOutlet(data);
    await outlet.save();
    res.status(201).json(outlet);
  } catch (err) {
    res.status(400).json({ error: err.message });
  }
});

// PUT — update an outlet (generic penetration, order freq, weekly performance, mitigation)
app.put('/api/retail-outlets/:id', async (req, res) => {
  try {
    const outlet = await RetailOutlet.findByIdAndUpdate(
      req.params.id,
      { $set: req.body },
      { new: true, runValidators: true }
    );
    if (!outlet) return res.status(404).json({ error: 'Outlet not found' });
    res.json(outlet);
  } catch (err) {
    res.status(400).json({ error: err.message });
  }
});

// DELETE — soft-delete (deactivate) an outlet
app.delete('/api/retail-outlets/:id', async (req, res) => {
  try {
    const outlet = await RetailOutlet.findByIdAndUpdate(
      req.params.id,
      { $set: { is_active: false } },
      { new: true }
    );
    if (!outlet) return res.status(404).json({ error: 'Outlet not found' });
    res.json({ message: `Outlet "${outlet.outlet_name}" deactivated.`, outlet });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

// ============================================================
// ANALYTICS — /api/analytics/high-risk-alerts
// Generic Drift Threshold: price_gap > 18% AND inflation > 4.5% AND OOS
// ============================================================
app.get('/api/analytics/high-risk-alerts', async (req, res) => {
  try {
    const alerts = await DistributorRoute.aggregate([
      // Step 1: Join with economic_indicators on district_cluster → district
      {
        $lookup: {
          from:         'economic_indicators',
          localField:   'district_cluster',
          foreignField: 'district',
          as:           'economic_context',
        },
      },
      // Step 2: Flatten the joined array
      {
        $unwind: '$economic_context',
      },
      // Step 3: Apply Generic Drift threshold filter
      {
        $match: {
          price_gap_percent:                               { $gt: 18.0 },
          'economic_context.local_food_inflation_rate':    { $gt: 4.5  },
          stock_availability_flag:                         0,           // Out-of-stock
        },
      },
      // Step 4: Project relevant fields
      {
        $project: {
          _id:                           1,
          route_id:                      1,
          district_cluster:              1,
          sku_category:                  1,
          brand_tracked:                 1,
          hemas_unit_price_lkr:          1,
          generic_competitor_price_lkr:  1,
          price_gap_percent:             1,
          stock_availability_flag:       1,
          three_week_volume_drop_percent: 1,
          retail_stores_count:           1,
          bought_items:                  1,
          current_stock:                 1,
          last_updated:                  1,
          local_food_inflation_rate:     '$economic_context.local_food_inflation_rate',
          economic_risk_tier:            '$economic_context.economic_risk_tier',
          ncpi:                          '$economic_context.national_consumer_price_index_ncpi',
          awplr:                         '$economic_context.average_weighted_prime_lending_rate_awplr',
        },
      },
      // Step 5: Sort by worst volume drop first
      {
        $sort: { three_week_volume_drop_percent: -1 },
      },
    ]);

    res.json(alerts);
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

// ─── Health Check ─────────────────────────────────────────────
app.get('/api/health', (_req, res) => {
  res.json({ status: 'OK', timestamp: new Date().toISOString() });
});

// ─── Start Server ─────────────────────────────────────────────
app.listen(PORT, () => {
  console.log(`🚀  Hemas DA2 Server running on http://localhost:${PORT}`);
});
