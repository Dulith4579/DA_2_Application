// ============================================================
// App.jsx — Hemas FMCG Distribution Channel Dashboard
// RBAC: Field_Supervisor | Area_Manager
// ============================================================

import { useState, useEffect, useCallback, useMemo } from 'react';
import axios from 'axios';
import { BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip as RechartsTooltip, Legend, ResponsiveContainer, PieChart, Pie, Cell } from 'recharts';

const API_BASE = '/api';

// ─── Utility: Compute price gap preview ──────────────────────
function calcPriceGap(hemas, generic) {
  if (!generic || Number(generic) === 0) return null;
  return ((Number(hemas) - Number(generic)) / Number(generic)) * 100;
}

function formatGap(val) {
  if (val === null || val === undefined || isNaN(val)) return '—';
  return `${val.toFixed(2)}%`;
}

function gapClass(val) {
  if (val === null) return '';
  if (val > 18) return 'danger';
  if (val > 10) return 'warning';
  return 'safe';
}

// ─── Utility: Date formatter ──────────────────────────────────
function fmtDate(iso) {
  if (!iso) return '—';
  return new Date(iso).toLocaleDateString('en-GB', {
    day: '2-digit', month: 'short', year: 'numeric',
  });
}

// ─── BLANK FORM STATE ─────────────────────────────────────────
const BLANK_FORM = {
  _id:                          '',
  route_id:                     '',
  district_cluster:             '',
  sku_category:                 '',
  brand_tracked:                '',
  hemas_unit_price_lkr:         '',
  generic_competitor_price_lkr: '',
  stock_availability_flag:      '1',
  three_week_volume_drop_percent: '',
  retail_stores_count:          '',
  bought_items:                 '',
  current_stock:                '',
  regional_observation:         '',
};

// ─── Route IDs (reference data) ──────────────────────────────
const PREDEFINED_ROUTES = [
  'RT-COL-001', 'RT-GAM-002', 'RT-KAL-003', 
  'RT-KAN-004', 'RT-GAL-005', 'RT-MAT-006',
  'RT-KUR-007', 'RT-RAT-008', 'RT-BAD-009', 'RT-JAF-010'
];

// ─── SKU Categories (reference data) ─────────────────────────
const SKU_CATEGORIES = [
  'Personal Care', 'Home Care', 'Baby Care', 'Oral Care',
  'Hair Care', 'Skin Care', 'Fabric Care',
];

// ─── Brands (reference data) ─────────────────────────────────
const BRANDS = [
  'Clogard', 'Baby Cheramy', 'Velvet', 'Kumarika', 
  'Dandex', 'Shield', 'Fems', 'Protex', 'Goya', 'Paris'
];

// ─── DISTRICT CLUSTERS (reference data) ──────────────────────
const DISTRICT_CLUSTERS = [
  'Colombo', 'Gampaha', 'Kalutara', 'Kandy', 'Galle',
  'Matara', 'Kurunegala', 'Ratnapura', 'Badulla', 'Jaffna',
];

// ─── Market Types ─────────────────────────────────────────────
const MARKET_TYPES = ['Pharmacy', 'General Trade', 'Mini-mart', 'Supermarket', 'Wholesale'];

// ─── Weekly Performance Options ───────────────────────────────
const PERF_OPTIONS = ['Pending', 'Declining', 'Consolidated', 'Performing Well'];

// ─── Mitigation Strategies ────────────────────────────────────
const MITIGATION_STRATEGIES = [
  'Trade Discount',
  'Free Issue Promo',
  'Credit Extension',
  'BOGO Offer',
  'Promotional Bundle',
  'Visibility Campaign',
  'Price Lock Agreement',
];


// ============================================================
// COMPONENT: Field Supervisor — Log Field Sales Survey Form
// ============================================================
function FieldSupervisorView() {
  const [form, setForm]       = useState(BLANK_FORM);
  const [editId, setEditId]   = useState(null);   // null = CREATE, string = UPDATE
  const [loading, setLoading] = useState(false);
  const [msg, setMsg]         = useState(null);   // { type: 'success'|'error', text }

  const previewGap = calcPriceGap(form.hemas_unit_price_lkr, form.generic_competitor_price_lkr);

  function handleChange(e) {
    const { name, value } = e.target;
    setForm((prev) => ({ ...prev, [name]: value }));
  }

  function resetForm() {
    setForm(BLANK_FORM);
    setEditId(null);
    setMsg(null);
  }

  async function handleSubmit(e) {
    e.preventDefault();
    setLoading(true);
    setMsg(null);

    // Build payload — let server compute price_gap_percent
    const payload = {
      ...form,
      hemas_unit_price_lkr:          Number(form.hemas_unit_price_lkr),
      generic_competitor_price_lkr:  Number(form.generic_competitor_price_lkr),
      stock_availability_flag:       Number(form.stock_availability_flag),
      three_week_volume_drop_percent: Number(form.three_week_volume_drop_percent),
      retail_stores_count:           Number(form.retail_stores_count || 0),
      bought_items:                  Number(form.bought_items || 0),
      current_stock:                 Number(form.current_stock || 0),
    };

    try {
      if (editId) {
        await axios.put(`${API_BASE}/routes/${editId}`, payload);
        setMsg({ type: 'success', text: `✅ Entry for route "${payload.route_id}" updated successfully.` });
      } else {
        if (!payload.route_id) {
          setMsg({ type: 'error', text: 'Route ID is required.' });
          setLoading(false);
          return;
        }
        await axios.post(`${API_BASE}/routes`, payload);
        setMsg({ type: 'success', text: `✅ Entry for route "${payload.route_id}" logged successfully.` });
      }
      resetForm();
    } catch (err) {
      setMsg({
        type: 'error',
        text: `❌ ${err.response?.data?.error || err.message}`,
      });
    } finally {
      setLoading(false);
    }
  }

  return (
    <div>
      {/* Section Header */}
      <div className="section-header">
        <span className="section-icon">📋</span>
        <h2>Log Field Sales Survey</h2>
      </div>

      {/* Info threshold hint */}
      <div className="threshold-hint">
        <span>⚡</span>
        <span>
          <strong>Generic Drift Threshold:</strong> Price Gap &gt; 18% AND Local Food Inflation &gt; 4.5%
          triggers a Critical Tipping Point Alert for this district cluster.
        </span>
      </div>

      {msg && (
        <div className={`alert-bar ${msg.type === 'success' ? 'success' : 'error'}`} style={{ marginTop: '1rem' }}>
          {msg.text}
        </div>
      )}

      {/* Form */}
      <div className="card" style={{ marginTop: '1.25rem' }}>
        <form onSubmit={handleSubmit}>
          <div className="form-grid">

            {/* Route ID Dropdown */}
            <div className="form-group">
              <label className="form-label" htmlFor="field-route-id">Route ID *</label>
              <select
                id="field-route-id"
                className="form-select"
                name="route_id"
                value={form.route_id}
                onChange={handleChange}
                required
              >
                <option value="">— Select Route ID —</option>
                {PREDEFINED_ROUTES.map((r) => (
                  <option key={r} value={r}>{r}</option>
                ))}
              </select>
            </div>

            {/* District Cluster */}
            <div className="form-group">
              <label className="form-label" htmlFor="field-district">District Cluster *</label>
              <select
                id="field-district"
                className="form-select"
                name="district_cluster"
                value={form.district_cluster}
                onChange={handleChange}
                required
              >
                <option value="">— Select District —</option>
                {DISTRICT_CLUSTERS.map((d) => (
                  <option key={d} value={d}>{d}</option>
                ))}
              </select>
            </div>

            {/* SKU Category */}
            <div className="form-group">
              <label className="form-label" htmlFor="field-sku">SKU Category *</label>
              <select
                id="field-sku"
                className="form-select"
                name="sku_category"
                value={form.sku_category}
                onChange={handleChange}
                required
              >
                <option value="">— Select Category —</option>
                {SKU_CATEGORIES.map((s) => (
                  <option key={s} value={s}>{s}</option>
                ))}
              </select>
            </div>

            {/* Brand Tracked */}
            <div className="form-group">
              <label className="form-label" htmlFor="field-brand">Brand Tracked *</label>
              <select
                id="field-brand"
                className="form-select"
                name="brand_tracked"
                value={form.brand_tracked}
                onChange={handleChange}
                required
              >
                <option value="">— Select Brand —</option>
                {BRANDS.map((b) => (
                  <option key={b} value={b}>{b}</option>
                ))}
              </select>
            </div>

            {/* Hemas Unit Price */}
            <div className="form-group">
              <label className="form-label" htmlFor="field-hemas-price">Hemas Unit Price (LKR) *</label>
              <input
                id="field-hemas-price"
                className="form-input"
                type="number"
                step="0.01"
                min="0"
                name="hemas_unit_price_lkr"
                value={form.hemas_unit_price_lkr}
                onChange={handleChange}
                placeholder="e.g. 245.00"
                required
              />
            </div>

            {/* Generic Competitor Price */}
            <div className="form-group">
              <label className="form-label" htmlFor="field-generic-price">Generic Competitor Price (LKR) *</label>
              <input
                id="field-generic-price"
                className="form-input"
                type="number"
                step="0.01"
                min="0.01"
                name="generic_competitor_price_lkr"
                value={form.generic_competitor_price_lkr}
                onChange={handleChange}
                placeholder="e.g. 190.00"
                required
              />
            </div>

            {/* Price Gap Preview — auto-computed */}
            <div className="form-group">
              <label className="form-label">Price Gap % (Auto-Computed)</label>
              <div className={`price-gap-preview ${gapClass(previewGap)}`}>
                {previewGap !== null ? (
                  <>
                    <span>{previewGap > 18 ? '🔴' : previewGap > 10 ? '🟠' : '🟢'}</span>
                    <span className="mono">{formatGap(previewGap)}</span>
                  </>
                ) : (
                  <span className="text-muted">Enter both prices above</span>
                )}
              </div>
            </div>

            {/* Stock Availability */}
            <div className="form-group">
              <label className="form-label" htmlFor="field-stock">Stock Availability *</label>
              <select
                id="field-stock"
                className="form-select"
                name="stock_availability_flag"
                value={form.stock_availability_flag}
                onChange={handleChange}
                required
              >
                <option value="1">1 — In Stock</option>
                <option value="0">0 — Out of Stock (OOS)</option>
              </select>
            </div>

            {/* 3-Week Volume Drop */}
            <div className="form-group">
              <label className="form-label" htmlFor="field-vol-drop">3-Week Volume Drop % *</label>
              <input
                id="field-vol-drop"
                className="form-input"
                type="number"
                step="0.1"
                min="0"
                max="100"
                name="three_week_volume_drop_percent"
                value={form.three_week_volume_drop_percent}
                onChange={handleChange}
                placeholder="e.g. 12.5"
                required
              />
            </div>

            {/* Retail Stores Count */}
            <div className="form-group">
              <label className="form-label" htmlFor="field-retail-stores">Total Retail Stores *</label>
              <input
                id="field-retail-stores"
                className="form-input"
                type="number"
                min="0"
                name="retail_stores_count"
                value={form.retail_stores_count}
                onChange={handleChange}
                placeholder="e.g. 15"
                required
              />
            </div>

            {/* Bought Items Count */}
            <div className="form-group">
              <label className="form-label" htmlFor="field-bought-items">Bought Items (Units) *</label>
              <input
                id="field-bought-items"
                className="form-input"
                type="number"
                min="0"
                name="bought_items"
                value={form.bought_items}
                onChange={handleChange}
                placeholder="e.g. 1500"
                required
              />
            </div>

            {/* Current Stock Level */}
            <div className="form-group">
              <label className="form-label" htmlFor="field-current-stock">Current Stock (Units) *</label>
              <input
                id="field-current-stock"
                className="form-input"
                type="number"
                min="0"
                name="current_stock"
                value={form.current_stock}
                onChange={handleChange}
                placeholder="e.g. 300"
                required
              />
            </div>

            {/* Regional Observation */}
            <div className="form-group" style={{ gridColumn: '1 / -1' }}>
              <label className="form-label" htmlFor="field-regional-observation">Regional Observation</label>
              <textarea
                id="field-regional-observation"
                className="form-input"
                name="regional_observation"
                value={form.regional_observation}
                onChange={handleChange}
                placeholder="Enter observations on sales decline or increase..."
                rows="3"
                style={{ resize: 'vertical' }}
              />
            </div>

          </div>

          {/* Actions */}
          <div className="form-actions">
            <button
              id="btn-submit-route"
              className="btn btn-primary"
              type="submit"
              disabled={loading}
            >
              {loading ? '⏳ Submitting…' : editId ? '✏️ Update Route' : '📤 Log Survey Entry'}
            </button>
            {editId && (
              <button
                id="btn-cancel-edit"
                className="btn btn-secondary"
                type="button"
                onClick={resetForm}
              >
                Cancel Edit
              </button>
            )}
          </div>
        </form>
      </div>

      {/* If editing, show context */}
      {editId && (
        <div className="alert-bar info" style={{ marginTop: '1rem' }}>
          ✏️ Editing entry for route <strong>{form.route_id}</strong> — make changes above and click "Update Route".
        </div>
      )}

      {/* Field Supervisor logs view */}
      <div className="section-divider" style={{ marginTop: '3rem', marginBottom: '2rem', borderTop: '1px solid var(--border)' }} />
      <ActiveChannelsOverview role="Field_Supervisor" onEdit={(route) => {
        setForm(route);
        setEditId(route._id);
        window.scrollTo({ top: 0, behavior: 'smooth' });
      }} />

      {/* Retail Outlet Management */}
      <div className="section-divider" style={{ marginTop: '3rem', marginBottom: '2rem', borderTop: '1px solid var(--border)' }} />
      <RetailOutletManager />
    </div>
  );
}

// ============================================================
// COMPONENT: Retail Outlet Manager (Field Supervisor Tab)
// ============================================================
const PERF_COLORS = {
  'Pending':        'var(--text-muted)',
  'Declining':      '#ef4444',
  'Consolidated':   '#f59e0b',
  'Performing Well':'#22c55e',
};

function RetailOutletManager() {
  const [outlets, setOutlets]     = useState([]);
  const [loading, setLoading]     = useState(true);
  const [filterRoute, setFilter]  = useState('');
  const [showForm, setShowForm]   = useState(false);
  const [saving, setSaving]       = useState(null);
  const [newOutlet, setNewOutlet] = useState({
    outlet_name: '', market_type: '', associated_route_id: '', order_frequency_days: ''
  });
  const [msg, setMsg]             = useState(null);

  const fetchOutlets = useCallback(async () => {
    setLoading(true);
    try {
      const params = filterRoute ? `?route_id=${filterRoute}` : '';
      const res = await axios.get(`${API_BASE}/retail-outlets${params}`);
      setOutlets(res.data);
    } catch (err) {
      console.error(err);
    } finally {
      setLoading(false);
    }
  }, [filterRoute]);

  useEffect(() => { fetchOutlets(); }, [fetchOutlets]);

  async function handleCreate(e) {
    e.preventDefault();
    setSaving('create');
    try {
      await axios.post(`${API_BASE}/retail-outlets`, {
        ...newOutlet,
        order_frequency_days: Number(newOutlet.order_frequency_days),
        district: newOutlet.associated_route_id
          ? ({ 'RT-COL-001': 'Colombo', 'RT-GAM-002': 'Gampaha', 'RT-KAL-003': 'Kalutara',
               'RT-KAN-004': 'Kandy', 'RT-GAL-005': 'Galle', 'RT-MAT-006': 'Matara',
               'RT-KUR-007': 'Kurunegala', 'RT-RAT-008': 'Ratnapura', 'RT-BAD-009': 'Badulla',
               'RT-JAF-010': 'Jaffna' })[newOutlet.associated_route_id] || 'Unknown'
          : 'Unknown'
      });
      setMsg({ type: 'success', text: '✅ New outlet registered successfully.' });
      setNewOutlet({ outlet_name: '', market_type: '', associated_route_id: '', order_frequency_days: '' });
      setShowForm(false);
      fetchOutlets();
    } catch (err) {
      setMsg({ type: 'error', text: err.response?.data?.error || err.message });
    } finally {
      setSaving(null);
    }
  }

  async function handleUpdate(id, changes) {
    setSaving(id);
    try {
      const res = await axios.put(`${API_BASE}/retail-outlets/${id}`, changes);
      setOutlets((prev) => prev.map((o) => o._id === id ? res.data : o));
    } catch (err) {
      alert(err.response?.data?.error || err.message);
    } finally {
      setSaving(null);
    }
  }

  async function handleDeactivate(id, name) {
    if (!window.confirm(`Deactivate "${name}"? They will be marked as closed.`)) return;
    setSaving(id + '-del');
    try {
      await axios.delete(`${API_BASE}/retail-outlets/${id}`);
      setOutlets((prev) => prev.filter((o) => o._id !== id));
      setMsg({ type: 'success', text: `✅ "${name}" deactivated.` });
    } catch (err) {
      alert(err.response?.data?.error || err.message);
    } finally {
      setSaving(null);
    }
  }

  const activeOutlets = outlets.filter((o) => o.is_active);

  return (
    <div style={{ marginTop: '2.5rem' }}>
      <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', flexWrap: 'wrap', gap: '1rem', marginBottom: '1.5rem' }}>
        <div>
          <h2 style={{ margin: 0, fontSize: '1.25rem' }}>🏪 Retail Outlets</h2>
          <p style={{ margin: '4px 0 0', color: 'var(--text-muted)', fontSize: '13px' }}>
            Manage stores on your routes — update weekly performance and generic penetration flags.
          </p>
        </div>
        <div style={{ display: 'flex', gap: '0.75rem', flexWrap: 'wrap' }}>
          <select className="form-select" style={{ width: 'auto' }} value={filterRoute} onChange={(e) => setFilter(e.target.value)}>
            <option value="">All Routes</option>
            {PREDEFINED_ROUTES.map((r) => <option key={r} value={r}>{r}</option>)}
          </select>
          <button className="btn btn-primary btn-sm" onClick={() => setShowForm(!showForm)}>
            {showForm ? '✕ Cancel' : '＋ Register New Outlet'}
          </button>
        </div>
      </div>

      {msg && (
        <div className={`alert-bar ${msg.type === 'success' ? 'success' : 'error'}`} style={{ marginBottom: '1rem' }}>
          {msg.text}
          <button onClick={() => setMsg(null)} style={{ marginLeft: '1rem', background: 'none', border: 'none', cursor: 'pointer', color: 'inherit' }}>✕</button>
        </div>
      )}

      {/* New Outlet Form */}
      {showForm && (
        <form onSubmit={handleCreate} style={{ background: 'var(--bg-surface)', border: '1px solid var(--border)', borderRadius: '12px', padding: '1.5rem', marginBottom: '1.5rem' }}>
          <h3 style={{ margin: '0 0 1rem', fontSize: '1rem' }}>Register New Store</h3>
          <div className="form-grid">
            <div className="form-group">
              <label className="form-label">Outlet Name *</label>
              <input className="form-input" type="text" required value={newOutlet.outlet_name}
                onChange={(e) => setNewOutlet((p) => ({ ...p, outlet_name: e.target.value }))}
                placeholder="e.g. Perera Pharmacy" />
            </div>
            <div className="form-group">
              <label className="form-label">Market Type *</label>
              <select className="form-select" required value={newOutlet.market_type}
                onChange={(e) => setNewOutlet((p) => ({ ...p, market_type: e.target.value }))}>
                <option value="">— Select Type —</option>
                {MARKET_TYPES.map((m) => <option key={m} value={m}>{m}</option>)}
              </select>
            </div>
            <div className="form-group">
              <label className="form-label">Associated Route *</label>
              <select className="form-select" required value={newOutlet.associated_route_id}
                onChange={(e) => setNewOutlet((p) => ({ ...p, associated_route_id: e.target.value }))}>
                <option value="">— Select Route —</option>
                {PREDEFINED_ROUTES.map((r) => <option key={r} value={r}>{r}</option>)}
              </select>
            </div>
            <div className="form-group">
              <label className="form-label">Order Frequency (days) *</label>
              <input className="form-input" type="number" min="1" required value={newOutlet.order_frequency_days}
                onChange={(e) => setNewOutlet((p) => ({ ...p, order_frequency_days: e.target.value }))}
                placeholder="e.g. 7" />
            </div>
          </div>
          <div className="form-actions">
            <button type="submit" className="btn btn-primary" disabled={saving === 'create'}>
              {saving === 'create' ? '⏳ Saving…' : '📥 Register Outlet'}
            </button>
          </div>
        </form>
      )}

      {loading ? (
        <p style={{ color: 'var(--text-muted)' }}>Loading outlets…</p>
      ) : activeOutlets.length === 0 ? (
        <p style={{ color: 'var(--text-muted)' }}>No active outlets found{filterRoute ? ` for ${filterRoute}` : ''}.</p>
      ) : (
        <div style={{ overflowX: 'auto' }}>
          <table className="data-table">
            <thead>
              <tr>
                <th>Outlet Name</th>
                <th>Type</th>
                <th>District</th>
                <th>Route</th>
                <th>Order Freq</th>
                <th>Generic Penetration</th>
                <th>Week 1</th>
                <th>Week 2</th>
                <th>Week 3</th>
                <th>Actions</th>
              </tr>
            </thead>
            <tbody>
              {activeOutlets.map((o) => (
                <tr key={o._id}>
                  <td style={{ fontWeight: 500 }}>{o.outlet_name}</td>
                  <td><span className="chip">{o.market_type}</span></td>
                  <td>{o.district}</td>
                  <td className="mono">{o.associated_route_id}</td>
                  <td className="mono">{o.order_frequency_days}d</td>
                  <td>
                    <label style={{ cursor: 'pointer', display: 'flex', alignItems: 'center', gap: '6px' }}>
                      <input type="checkbox" checked={o.has_generic_penetration}
                        disabled={saving === o._id}
                        onChange={(e) => handleUpdate(o._id, { has_generic_penetration: e.target.checked })} />
                      <span style={{ color: o.has_generic_penetration ? '#ef4444' : 'var(--text-muted)', fontSize: '12px' }}>
                        {o.has_generic_penetration ? '⚠️ Generic' : 'None'}
                      </span>
                    </label>
                  </td>
                  {['week_1_performance', 'week_2_performance', 'week_3_performance'].map((wk, i) => (
                    <td key={wk}>
                      <select
                        style={{ fontSize: '11px', padding: '2px 4px', color: PERF_COLORS[o[wk]] || 'inherit', background: 'transparent', border: '1px solid var(--border)', borderRadius: '4px', cursor: 'pointer' }}
                        value={o[wk] || 'Pending'}
                        disabled={saving === o._id}
                        onChange={(e) => handleUpdate(o._id, { [wk]: e.target.value })}
                      >
                        {PERF_OPTIONS.map((p) => <option key={p} value={p}>{p}</option>)}
                      </select>
                    </td>
                  ))}
                  <td>
                    <button
                      className="btn btn-danger btn-sm"
                      disabled={saving === o._id + '-del'}
                      onClick={() => handleDeactivate(o._id, o.outlet_name)}
                    >
                      {saving === o._id + '-del' ? '⏳' : '🔒 Deactivate'}
                    </button>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}
    </div>
  );
}

// ============================================================
// COMPONENT: Area Manager — Outlet Mitigation Centre (Redesigned)
// ============================================================
function AreaOutletManager() {
  const [outlets, setOutlets]   = useState([]);
  const [routeLogs, setRouteLogs] = useState([]);
  const [loading, setLoading]   = useState(true);
  const [saving, setSaving]     = useState(null);
  const [filterRoute, setFilter]= useState('');
  const [expandedId, setExpandedId] = useState(null);

  const fetchData = useCallback(async () => {
    setLoading(true);
    try {
      const params = filterRoute ? `?route_id=${filterRoute}` : '';
      const [logRes] = await Promise.all([
        axios.get(`${API_BASE}/routes`),
      ]);
      // Filter by route if needed (routes API returns all, filter client-side)
      const filtered = filterRoute
        ? logRes.data.filter((r) => r.route_id === filterRoute)
        : logRes.data;
      setOutlets(filtered);
      setRouteLogs(logRes.data);
    } catch (err) {
      console.error(err);
    } finally {
      setLoading(false);
    }
  }, [filterRoute]);

  useEffect(() => { fetchData(); }, [fetchData]);

  // Get the most recent route log observation for a given route_id
  function getRecentObservation(routeId) {
    const logs = routeLogs
      .filter((l) => l.route_id === routeId && l.regional_observation)
      .sort((a, b) => new Date(b.last_updated) - new Date(a.last_updated));
    return logs[0] || null;
  }

  async function applyMitigation(id, strategy) {
    setSaving(id);
    try {
      const res = await axios.put(`${API_BASE}/routes/${id}`, {
        mitigation_active: true,
        mitigation_strategy: strategy,
      });
      setOutlets((prev) => prev.map((o) => o._id === id ? res.data : o));
    } catch (err) {
      alert(err.response?.data?.error || err.message);
    } finally {
      setSaving(null);
    }
  }

  async function removeMitigation(id) {
    setSaving(id);
    try {
      const res = await axios.put(`${API_BASE}/routes/${id}`, {
        mitigation_active: false,
        mitigation_strategy: '',
      });
      setOutlets((prev) => prev.map((o) => o._id === id ? res.data : o));
    } catch (err) {
      alert(err.response?.data?.error || err.message);
    } finally {
      setSaving(null);
    }
  }

  // Route logs (outlets in this context = route logs)
  const activeOutlets = outlets; // all route logs
  const decliningCount = activeOutlets.filter(
    (o) => [o.week_1_performance, o.week_2_performance, o.week_3_performance].includes('Declining')
  ).length;
  const mitigatedCount = activeOutlets.filter((o) => o.mitigation_active).length;

  function perfIcon(val) {
    if (val === 'Declining')      return '🔴';
    if (val === 'Performing Well') return '🟢';
    if (val === 'Consolidated')   return '🟡';
    return '⚫';
  }

  function overallStatus(o) {
    const perfs = [o.week_1_performance, o.week_2_performance, o.week_3_performance];
    if (perfs.includes('Declining')) return 'Declining';
    if (perfs.every((p) => p === 'Performing Well')) return 'Performing Well';
    if (perfs.some((p) => p === 'Performing Well')) return 'Consolidated';
    return 'Pending';
  }

  return (
    <div style={{ marginTop: '2.5rem' }}>
      {/* Section Header */}
      <div style={{ display: 'flex', alignItems: 'flex-start', justifyContent: 'space-between', flexWrap: 'wrap', gap: '1rem', marginBottom: '1.5rem' }}>
        <div>
          <h2 style={{ margin: 0, fontSize: '1.35rem', display: 'flex', alignItems: 'center', gap: '10px' }}>
            🎯 Outlet Mitigation Centre
          </h2>
          <p style={{ margin: '6px 0 0', color: 'var(--text-muted)', fontSize: '13px', maxWidth: '520px' }}>
            Review weekly field performance logged by your Field Supervisors and deploy targeted mitigation strategies for at-risk stores.
          </p>
        </div>
        <select className="form-select" style={{ width: 'auto', alignSelf: 'flex-start' }} value={filterRoute} onChange={(e) => setFilter(e.target.value)}>
          <option value="">All Routes</option>
          {PREDEFINED_ROUTES.map((r) => <option key={r} value={r}>{r}</option>)}
        </select>
      </div>

      {/* Summary Stats */}
      <div style={{ display: 'flex', gap: '1rem', flexWrap: 'wrap', marginBottom: '1.5rem' }}>
        {[
          { label: 'Total Active Stores', value: activeOutlets.length, color: 'var(--text-primary)' },
          { label: 'Flagged as Declining', value: decliningCount, color: decliningCount > 0 ? '#ef4444' : '#22c55e' },
          { label: 'Mitigation Active', value: mitigatedCount, color: '#22c55e' },
          { label: 'Awaiting Action', value: decliningCount - mitigatedCount > 0 ? decliningCount - mitigatedCount : 0, color: '#f59e0b' },
        ].map((s) => (
          <div key={s.label} className="card" style={{ flex: '1 1 140px', padding: '1rem 1.25rem', minWidth: '120px', textAlign: 'center' }}>
            <div style={{ fontSize: '1.75rem', fontWeight: 700, color: s.color }}>{s.value}</div>
            <div style={{ fontSize: '11px', color: 'var(--text-muted)', marginTop: '4px' }}>{s.label}</div>
          </div>
        ))}
      </div>

      {loading ? (
        <p style={{ color: 'var(--text-muted)' }}>Loading store data…</p>
      ) : activeOutlets.length === 0 ? (
        <p style={{ color: 'var(--text-muted)' }}>No active outlets found.</p>
      ) : (
        <div style={{ display: 'flex', flexDirection: 'column', gap: '0.75rem' }}>
          {activeOutlets.map((o) => {
            const status    = overallStatus(o);
            const isAtRisk  = status === 'Declining';
            const recentLog = getRecentObservation(o.associated_route_id);
            const isExpanded = expandedId === o._id;

            return (
              <div
                key={o._id}
                className="card"
                style={{
                  border: isAtRisk && !o.mitigation_active
                    ? '1px solid rgba(239,68,68,0.4)'
                    : o.mitigation_active
                    ? '1px solid rgba(34,197,94,0.3)'
                    : '1px solid var(--border)',
                  transition: 'border-color 0.2s',
                  padding: '0',
                  overflow: 'hidden',
                }}
              >
                {/* Card Main Row */}
                <div
                  style={{ display: 'flex', alignItems: 'center', gap: '1rem', padding: '1rem 1.25rem', flexWrap: 'wrap', cursor: 'pointer' }}
                  onClick={() => setExpandedId(isExpanded ? null : o._id)}
                >
                  {/* Status Dot */}
                  <div style={{
                    width: '10px', height: '10px', borderRadius: '50%', flexShrink: 0,
                    background: isAtRisk && !o.mitigation_active ? '#ef4444' : o.mitigation_active ? '#22c55e' : status === 'Performing Well' ? '#22c55e' : '#f59e0b',
                  }} />

                  {/* Name + Tags */}
                  <div style={{ flex: '1 1 180px', minWidth: '140px' }}>
                    <div style={{ fontWeight: 600, fontSize: '14px' }}>{o.route_id} — {o.brand_tracked}</div>
                    <div style={{ fontSize: '11px', color: 'var(--text-muted)', marginTop: '2px' }}>
                      {o.sku_category} · {o.district_cluster} · Logged {fmtDate(o.last_updated)}
                    </div>
                  </div>

                  {/* Weekly Performance Pills */}
                  <div style={{ display: 'flex', gap: '6px', flexWrap: 'wrap' }}>
                    {[o.week_1_performance, o.week_2_performance, o.week_3_performance].map((p, i) => (
                      <span key={i} style={{
                        fontSize: '11px', padding: '2px 8px', borderRadius: '20px', fontWeight: 600,
                        background: p === 'Declining' ? 'rgba(239,68,68,0.12)' : p === 'Performing Well' ? 'rgba(34,197,94,0.12)' : p === 'Consolidated' ? 'rgba(245,158,11,0.12)' : 'rgba(148,163,184,0.12)',
                        color: PERF_COLORS[p] || 'var(--text-muted)',
                        border: `1px solid ${p === 'Declining' ? 'rgba(239,68,68,0.3)' : p === 'Performing Well' ? 'rgba(34,197,94,0.3)' : p === 'Consolidated' ? 'rgba(245,158,11,0.3)' : 'var(--border)'}`,
                      }}>
                        {perfIcon(p)} Wk{i + 1}: {p}
                      </span>
                    ))}
                  </div>

                  {/* Mitigation Badge */}
                  <div style={{ marginLeft: 'auto', flexShrink: 0, display: 'flex', alignItems: 'center', gap: '8px' }}>
                    {o.mitigation_active && (
                      <span style={{ fontSize: '11px', padding: '3px 10px', borderRadius: '20px', background: 'rgba(34,197,94,0.12)', color: '#22c55e', border: '1px solid rgba(34,197,94,0.3)', fontWeight: 600 }}>
                        ✅ {o.mitigation_strategy}
                      </span>
                    )}
                    <span style={{ color: 'var(--text-muted)', fontSize: '18px' }}>{isExpanded ? '▲' : '▼'}</span>
                  </div>
                </div>

                {/* Expanded Detail Panel */}
                {isExpanded && (
                  <div style={{ borderTop: '1px solid var(--border)', padding: '1rem 1.25rem', background: 'rgba(0,0,0,0.02)', display: 'flex', gap: '1.5rem', flexWrap: 'wrap' }}>
                    
                    {/* Field Supervisor Observation */}
                    <div style={{ flex: '1 1 280px' }}>
                      <div style={{ fontSize: '11px', fontWeight: 700, color: 'var(--text-muted)', textTransform: 'uppercase', letterSpacing: '0.08em', marginBottom: '6px' }}>
                        📋 Field Observation (from this log)
                      </div>
                      {o.regional_observation ? (
                        <div style={{ background: 'var(--bg-surface)', border: '1px solid var(--border)', borderRadius: '8px', padding: '10px 14px' }}>
                          <div style={{ fontSize: '13px', lineHeight: '1.5', color: 'var(--text-primary)' }}>
                            "{o.regional_observation}"
                          </div>
                          <div style={{ marginTop: '8px', fontSize: '11px', color: 'var(--text-muted)' }}>
                            Brand: <strong>{o.brand_tracked}</strong> · Price Gap: <strong>{Number(o.price_gap_percent).toFixed(1)}%</strong> · Vol Drop: <strong>{o.three_week_volume_drop_percent}%</strong>
                          </div>
                        </div>
                      ) : (
                        <div style={{ fontSize: '12px', color: 'var(--text-muted)', fontStyle: 'italic' }}>
                          No observation was added to this log.
                        </div>
                      )}
                    </div>

                    {/* Log Details */}
                    <div style={{ flex: '1 1 180px' }}>
                      <div style={{ fontSize: '11px', fontWeight: 700, color: 'var(--text-muted)', textTransform: 'uppercase', letterSpacing: '0.08em', marginBottom: '6px' }}>
                        📊 Log Details
                      </div>
                      <div style={{ fontSize: '12px', lineHeight: '2', color: 'var(--text-primary)' }}>
                        <div>Stores on route: <strong>{o.retail_stores_count}</strong></div>
                        <div>Units bought: <strong>{o.bought_items}</strong></div>
                        <div>Current stock: <strong>{o.current_stock}</strong></div>
                        <div>Stock status: <strong style={{ color: o.stock_availability_flag === 0 ? '#ef4444' : '#22c55e' }}>{o.stock_availability_flag === 0 ? '⚠️ OOS' : '✅ In-Stock'}</strong></div>
                      </div>
                    </div>

                    {/* Mitigation Actions */}
                    <div style={{ flex: '1 1 220px' }}>
                      <div style={{ fontSize: '11px', fontWeight: 700, color: 'var(--text-muted)', textTransform: 'uppercase', letterSpacing: '0.08em', marginBottom: '6px' }}>
                        🎯 Mitigation Action
                      </div>
                      {o.mitigation_active ? (
                        <div style={{ display: 'flex', flexDirection: 'column', gap: '8px' }}>
                          <div style={{ fontSize: '13px', color: '#22c55e', fontWeight: 600 }}>
                            ✅ Strategy active: {o.mitigation_strategy}
                          </div>
                          <button
                            className="btn btn-secondary btn-sm"
                            disabled={saving === o._id}
                            onClick={(e) => { e.stopPropagation(); removeMitigation(o._id); }}
                          >
                            {saving === o._id ? '⏳ Removing…' : '↩️ Remove Mitigation'}
                          </button>
                        </div>
                      ) : (
                        <div style={{ display: 'flex', flexDirection: 'column', gap: '8px' }}>
                          <div style={{ fontSize: '12px', color: 'var(--text-muted)' }}>
                            {isAtRisk ? '⚠️ This store needs attention. Select a strategy below:' : 'No action needed yet.'}
                          </div>
                          <select
                            className="form-select"
                            style={{ fontSize: '12px' }}
                            defaultValue=""
                            disabled={saving === o._id}
                            onClick={(e) => e.stopPropagation()}
                            onChange={(e) => {
                              if (e.target.value) applyMitigation(o._id, e.target.value);
                              e.target.value = '';
                            }}
                          >
                            <option value="" disabled>— Select Strategy —</option>
                            {MITIGATION_STRATEGIES.map((s) => (
                              <option key={s} value={s}>{s}</option>
                            ))}
                          </select>
                        </div>
                      )}
                    </div>
                  </div>
                )}
              </div>
            );
          })}
        </div>
      )}
    </div>
  );
}


// ============================================================
// COMPONENT: Area Manager — Critical Tipping Point Alerts Table
// ============================================================

function CriticalAlertsTable() {
  const [alerts, setAlerts]   = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError]     = useState(null);

  const fetchAlerts = useCallback(async () => {
    setLoading(true);
    setError(null);
    try {
      const res = await axios.get(`${API_BASE}/analytics/high-risk-alerts`);
      setAlerts(res.data);
    } catch (err) {
      setError(err.response?.data?.error || err.message);
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => { fetchAlerts(); }, [fetchAlerts]);

  return (
    <div>
      {/* Critical Header */}
      <div className="critical-header">
        <div className="critical-header-left">
          <h2>⚠️ CRITICAL TIPPING POINT ALERTS</h2>
          <p>
            Routes where <strong>Price Gap &gt; 18%</strong> AND <strong>Local Food Inflation &gt; 4.5%</strong> AND product is
            <strong> Out-of-Stock</strong> — Generic Drift risk is HIGH.
          </p>
        </div>
        <div style={{ display: 'flex', alignItems: 'center', gap: '12px', flexWrap: 'wrap' }}>
          {!loading && (
            <span className="alert-count-badge">
              {alerts.length} ACTIVE ALERTS
            </span>
          )}
          <button
            id="btn-refresh-alerts"
            className="btn btn-secondary btn-sm"
            onClick={fetchAlerts}
            disabled={loading}
          >
            {loading ? '⏳' : '🔄'} Refresh
          </button>
        </div>
      </div>

      {error && (
        <div className="alert-bar error">❌ {error}</div>
      )}

      {loading ? (
        <div className="spinner-container">
          <div className="spinner"></div>
          <span>Running aggregation pipeline…</span>
        </div>
      ) : alerts.length === 0 ? (
        <div className="empty-state">
          <div className="empty-icon">✅</div>
          <p>No critical alerts detected. All routes are within safe thresholds.</p>
        </div>
      ) : (
        <div className="table-wrapper">
          <table aria-label="Critical Tipping Point Alerts">
            <thead>
              <tr>
                <th>Route ID</th>
                <th>District Cluster</th>
                <th>Brand / SKU</th>
                <th>Hemas Price (LKR)</th>
                <th>Generic Price (LKR)</th>
                <th>Price Gap %</th>
                <th>Food Inflation %</th>
                <th>Risk Tier</th>
                <th>Vol Drop % (3W)</th>
                <th>Last Updated</th>
              </tr>
            </thead>
            <tbody>
              {alerts.map((a) => (
                <tr key={a._id}>
                  <td className="mono" style={{ fontWeight: 600 }}>{a.route_id}</td>
                  <td>{a.district_cluster}</td>
                  <td>
                    <div style={{ fontWeight: 600 }}>{a.brand_tracked}</div>
                    <div style={{ fontSize: '11px', color: 'var(--text-muted)' }}>{a.sku_category}</div>
                  </td>
                  <td className="mono">LKR {Number(a.hemas_unit_price_lkr).toFixed(2)}</td>
                  <td className="mono">LKR {Number(a.generic_competitor_price_lkr).toFixed(2)}</td>
                  <td>
                    <span className="chip chip-danger">
                      🔴 {Number(a.price_gap_percent).toFixed(1)}%
                    </span>
                  </td>
                  <td>
                    <span className="chip chip-warning">
                      📈 {Number(a.local_food_inflation_rate).toFixed(1)}%
                    </span>
                  </td>
                  <td>
                    {a.economic_risk_tier === 'HIGH' || a.economic_risk_tier === 'CRITICAL' ? (
                      <span className="chip chip-danger">{a.economic_risk_tier}</span>
                    ) : (
                      <span className="chip chip-warning">{a.economic_risk_tier}</span>
                    )}
                  </td>
                  <td>
                    <span className={`chip ${Number(a.three_week_volume_drop_percent) > 15 ? 'chip-danger' : 'chip-warning'}`}>
                      ▼ {Number(a.three_week_volume_drop_percent).toFixed(1)}%
                    </span>
                  </td>
                  <td className="text-muted" style={{ fontSize: '12px' }}>{fmtDate(a.last_updated)}</td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}
    </div>
  );
}

// ============================================================
// COMPONENT: Active Channels Overview (CRUD Table)
// ============================================================
function ActiveChannelsOverview({ role = 'Area_Manager', onEdit }) {
  const [routes, setRoutes]   = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError]     = useState(null);
  const [deleting, setDeleting] = useState(null); // ID being deleted

  const fetchRoutes = useCallback(async () => {
    setLoading(true);
    setError(null);
    try {
      const res = await axios.get(`${API_BASE}/routes`);
      setRoutes(res.data);
    } catch (err) {
      setError(err.response?.data?.error || err.message);
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => { fetchRoutes(); }, [fetchRoutes]);

  async function handleDelete(id) {
    if (!window.confirm(`⚠️ Permanently purge this log? This cannot be undone.`)) return;
    setDeleting(id);
    try {
      await axios.delete(`${API_BASE}/routes/${id}`);
      setRoutes((prev) => prev.filter((r) => r._id !== id));
    } catch (err) {
      alert(`❌ Delete failed: ${err.response?.data?.error || err.message}`);
    } finally {
      setDeleting(null);
    }
  }

  async function handleUpdateRoute(id, changes) {
    try {
      const res = await axios.put(`${API_BASE}/routes/${id}`, changes);
      setRoutes((prev) => prev.map((r) => r._id === id ? res.data : r));
    } catch (err) {
      alert(`❌ Update failed: ${err.response?.data?.error || err.message}`);
    }
  }

  // Derive stats
  const totalRoutes    = routes.length;
  const highRisk       = routes.filter((r) => r.price_gap_percent > 18).length;
  const oos            = routes.filter((r) => r.stock_availability_flag === 0).length;
  const avgGap         = routes.length
    ? (routes.reduce((s, r) => s + (r.price_gap_percent || 0), 0) / routes.length).toFixed(1)
    : '—';

  return (
    <div>
      <div className="section-header" style={{ marginTop: '2.5rem' }}>
        <span className="section-icon">🗺️</span>
        <h2>Active Channels Overview</h2>
        <button
          id="btn-refresh-channels"
          className="btn btn-secondary btn-sm"
          onClick={fetchRoutes}
          disabled={loading}
          style={{ marginLeft: 'auto' }}
        >
          {loading ? '⏳' : '🔄'} Refresh
        </button>
      </div>

      {/* Stats Strip */}
      {!loading && !error && (
        <div className="stats-strip">
          <div className="stat-card stat-accent">
            <div className="stat-label">Total Routes</div>
            <div className="stat-value">{totalRoutes}</div>
            <div className="stat-sub">Active distributor channels</div>
          </div>
          <div className="stat-card stat-danger">
            <div className="stat-label">High Risk</div>
            <div className="stat-value">{highRisk}</div>
            <div className="stat-sub">Price gap &gt; 18%</div>
          </div>
          <div className="stat-card stat-warning">
            <div className="stat-label">Out-of-Stock</div>
            <div className="stat-value">{oos}</div>
            <div className="stat-sub">Stock flag = 0</div>
          </div>
          <div className="stat-card stat-accent">
            <div className="stat-label">Avg Price Gap</div>
            <div className="stat-value">{avgGap}{avgGap !== '—' ? '%' : ''}</div>
            <div className="stat-sub">Across all routes</div>
          </div>
        </div>
      )}

      {error && <div className="alert-bar error">❌ {error}</div>}

      {loading ? (
        <div className="spinner-container">
          <div className="spinner"></div>
          <span>Loading routes…</span>
        </div>
      ) : routes.length === 0 ? (
        <div className="empty-state">
          <div className="empty-icon">📭</div>
          <p>No distributor routes found. Have Field Supervisors log survey entries first.</p>
        </div>
      ) : (
        <div className="table-wrapper">
          <table aria-label="Active Distributor Channels">
            <thead>
              <tr>
                <th>Route ID</th>
                <th>District</th>
                <th>Brand</th>
                <th>Stores</th>
                <th>Bought</th>
                <th>Stock</th>
                <th>Price Gap %</th>
                <th>Stock Flag</th>
                <th>Vol Drop %</th>
                {role === 'Field_Supervisor' && <>
                  <th>Wk 1</th>
                  <th>Wk 2</th>
                  <th>Wk 3</th>
                </>}
                <th>Mitigation</th>
                <th>Last Updated</th>
                <th>Actions</th>
              </tr>
            </thead>
            <tbody>
              {routes.map((r) => (
                <tr key={r._id}>
                  <td className="mono" style={{ fontWeight: 600 }}>{r.route_id}</td>
                  <td>{r.district_cluster}</td>
                  <td style={{ fontWeight: 500 }}>{r.brand_tracked}</td>
                  <td className="mono">{r.retail_stores_count}</td>
                  <td className="mono">{r.bought_items}</td>
                  <td className="mono">{r.current_stock}</td>
                  <td>
                    {r.price_gap_percent > 18 ? (
                      <span className="chip chip-danger">🔴 {Number(r.price_gap_percent).toFixed(1)}%</span>
                    ) : r.price_gap_percent > 10 ? (
                      <span className="chip chip-warning">🟠 {Number(r.price_gap_percent).toFixed(1)}%</span>
                    ) : (
                      <span className="chip chip-success">🟢 {Number(r.price_gap_percent).toFixed(1)}%</span>
                    )}
                  </td>
                  <td>
                    {r.stock_availability_flag === 0 ? (
                      <span className="chip chip-danger">OOS</span>
                    ) : (
                      <span className="chip chip-success">In-Stock</span>
                    )}
                  </td>
                  <td className="mono">▼ {Number(r.three_week_volume_drop_percent).toFixed(1)}%</td>
                  {role === 'Field_Supervisor' && ['week_1_performance','week_2_performance','week_3_performance'].map((wk, i) => (
                    <td key={wk}>
                      <select
                        style={{ fontSize: '11px', padding: '2px 4px', color: PERF_COLORS[r[wk]] || 'inherit', background: 'transparent', border: '1px solid var(--border)', borderRadius: '4px', cursor: 'pointer', minWidth: '90px' }}
                        value={r[wk] || 'Pending'}
                        onChange={(e) => handleUpdateRoute(r._id, { [wk]: e.target.value })}
                      >
                        {PERF_OPTIONS.map((p) => <option key={p} value={p}>{p}</option>)}
                      </select>
                    </td>
                  ))}
                  <td>
                    {r.mitigation_active ? (
                      <span className="chip chip-success" style={{ fontWeight: 600 }}>✅ {r.mitigation_strategy}</span>
                    ) : (
                      <span className="text-muted" style={{ fontSize: '12px' }}>None</span>
                    )}
                  </td>
                  <td className="text-muted" style={{ fontSize: '12px' }}>{fmtDate(r.last_updated)}</td>
                  <td>
                    {role === 'Field_Supervisor' ? (
                      <button
                        className="btn btn-secondary btn-sm"
                        onClick={() => onEdit && onEdit(r)}
                      >
                        ✏️ Edit
                      </button>
                    ) : (
                      <button
                        id={`btn-delete-${r._id}`}
                        className="btn btn-danger btn-sm"
                        onClick={() => handleDelete(r._id)}
                        disabled={deleting === r._id}
                        title={`Purge route ${r.route_id}`}
                      >
                        {deleting === r._id ? '⏳' : '🗑️ Purge'}
                      </button>
                    )}
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}
    </div>
  );
}

// ============================================================
// COMPONENT: Area Manager — Dashboard Visualizations
// ============================================================
function AreaManagerDashboard() {
  const [routes, setRoutes]   = useState([]);
  const [loading, setLoading] = useState(true);

  const fetchRoutes = useCallback(async () => {
    setLoading(true);
    try {
      const res = await axios.get(`${API_BASE}/routes`);
      setRoutes(res.data);
    } catch (err) {
      console.error(err);
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => { fetchRoutes(); }, [fetchRoutes]);

  return (
    <>
      <DashboardVisualizations routes={routes} />
      <div className="section-divider" style={{ marginTop: '2rem' }} />
      <CriticalAlertsTable />
      <div className="section-divider" />
      <ActiveChannelsOverview />
      <div className="section-divider" style={{ marginTop: '2rem', borderTop: '1px solid var(--border)' }} />
      <AreaOutletManager />
    </>
  );
}

function DashboardVisualizations({ routes }) {
  const COLORS = ['#00C49F', '#FF8042', '#FFBB28', '#0088FE', '#AF19FF'];

  // Calculate Average Volume Drop by District
  const dropByDistrict = useMemo(() => {
    if (!routes || routes.length === 0) return [];
    const grouped = {};
    routes.forEach((r) => {
      if (!grouped[r.district_cluster]) {
        grouped[r.district_cluster] = { district: r.district_cluster, totalDrop: 0, count: 0 };
      }
      grouped[r.district_cluster].totalDrop += Number(r.three_week_volume_drop_percent || 0);
      grouped[r.district_cluster].count += 1;
    });
    return Object.values(grouped).map((g) => ({
      name: g.district,
      avgDrop: Number((g.totalDrop / g.count).toFixed(2))
    }));
  }, [routes]);

  // Calculate Stock Availability Distribution
  const stockData = useMemo(() => {
    if (!routes || routes.length === 0) return [];
    let inStock = 0;
    let outOfStock = 0;
    routes.forEach((r) => {
      if (r.stock_availability_flag === 1) inStock++;
      else outOfStock++;
    });
    return [
      { name: 'In Stock', value: inStock },
      { name: 'Out of Stock', value: outOfStock }
    ];
  }, [routes]);

  if (!routes || routes.length === 0) return null;

  return (
    <div className="visualizations-container" style={{ display: 'flex', gap: '2rem', marginTop: '2rem', flexWrap: 'wrap' }}>
      <div className="chart-card card" style={{ flex: '1 1 500px', minWidth: '300px' }}>
        <h3>Avg Volume Drop % by District</h3>
        <div style={{ height: '300px', width: '100%', marginTop: '1rem' }}>
          <ResponsiveContainer>
            <BarChart data={dropByDistrict} margin={{ top: 10, right: 30, left: 0, bottom: 0 }}>
              <CartesianGrid strokeDasharray="3 3" vertical={false} />
              <XAxis dataKey="name" />
              <YAxis />
              <RechartsTooltip />
              <Bar dataKey="avgDrop" fill="#FF8042" radius={[4, 4, 0, 0]} name="Avg Vol Drop %" />
            </BarChart>
          </ResponsiveContainer>
        </div>
      </div>
      
      <div className="chart-card card" style={{ flex: '1 1 300px', minWidth: '300px' }}>
        <h3>Stock Availability</h3>
        <div style={{ height: '300px', width: '100%', marginTop: '1rem' }}>
          <ResponsiveContainer>
            <PieChart>
              <Pie
                data={stockData}
                cx="50%"
                cy="50%"
                innerRadius={60}
                outerRadius={80}
                fill="#8884d8"
                paddingAngle={5}
                dataKey="value"
                label={({ name, percent }) => `${name} ${(percent * 100).toFixed(0)}%`}
              >
                {stockData.map((entry, index) => (
                  <Cell key={`cell-${index}`} fill={entry.name === 'In Stock' ? '#00C49F' : '#FF8042'} />
                ))}
              </Pie>
              <RechartsTooltip />
            </PieChart>
          </ResponsiveContainer>
        </div>
      </div>
    </div>
  );
}

// ============================================================
// ROOT APP — RBAC Switch
// ============================================================
export default function App() {
  const [activeRole, setActiveRole] = useState('Field_Supervisor');

  return (
    <div className="app-wrapper">

      {/* ── Header ─────────────────────────────────────────── */}
      <header className="app-header">
        <div className="header-brand">
          <div className="brand-logo">H</div>
          <div className="brand-text">
            <h1>Hemas Holdings PLC</h1>
            <p>FMCG Distribution Channel Dashboard — Generic Drift Monitor</p>
          </div>
        </div>

        <div className="header-controls">
          <span className="role-label">Active Role</span>
          <select
            id="role-selector"
            className="role-selector"
            value={activeRole}
            onChange={(e) => setActiveRole(e.target.value)}
            aria-label="Select active user role"
          >
            <option value="Field_Supervisor">Field Supervisor</option>
            <option value="Area_Manager">Area Manager</option>
          </select>
          <span className={`role-badge ${activeRole === 'Field_Supervisor' ? 'field' : 'manager'}`}>
            {activeRole === 'Field_Supervisor' ? '🟢 Field Op' : '🟡 Manager'}
          </span>
        </div>
      </header>

      {/* ── Main Content ────────────────────────────────────── */}
      <main className="main-content">

        {/* ── ROLE: Field Supervisor ─────────────────────── */}
        {activeRole === 'Field_Supervisor' && (
          <FieldSupervisorView />
        )}

        {/* ── ROLE: Area Manager ─────────────────────────── */}
        {activeRole === 'Area_Manager' && (
          <AreaManagerDashboard />
        )}

      </main>

      {/* ── Footer ─────────────────────────────────────────── */}
      <footer style={{
        borderTop: '1px solid var(--border)',
        padding: '1rem 2rem',
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'space-between',
        fontSize: '12px',
        color: 'var(--text-muted)',
        background: 'var(--bg-surface)',
        flexWrap: 'wrap',
        gap: '8px',
      }}>
        <span>© 2024 Hemas Holdings PLC — Decision Analytics 2 Assignment</span>
        <span>
          Generic Drift Threshold: Price Gap &gt; 18% ∧ Local Food Inflation &gt; 4.5%
        </span>
      </footer>

    </div>
  );
}
