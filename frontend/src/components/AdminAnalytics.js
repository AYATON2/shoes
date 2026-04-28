import React, { useState, useEffect } from 'react';
import api from '../utils/api';

const AdminAnalytics = () => {
  const [salesReport, setSalesReport] = useState([]);
  const [inventoryReport, setInventoryReport] = useState([]);
  const [orderStatusReport, setOrderStatusReport] = useState([]);
  const [orders, setOrders] = useState([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    Promise.all([
      api.get('/api/reports/sales'),
      api.get('/api/reports/inventory'),
      api.get('/api/reports/orders'),
      api.get('/api/orders?limit=10'), // Only get few recent orders for the table
    ]).then(([sales, inv, status, ord]) => {
      setSalesReport(sales.data || []);
      setInventoryReport(inv.data || []);
      setOrderStatusReport(status.data || []);
      setOrders(ord.data.data || ord.data || []);
    }).catch(console.error).finally(() => setLoading(false));
  }, []);

  const statusCounts = orderStatusReport.reduce((acc, o) => {
    acc[o.status] = o.count;
    return acc;
  }, {});

  const totalRevenue = salesReport.reduce((s, r) => s + parseFloat(r.revenue || 0), 0);
  const totalOrdersCount = Object.values(statusCounts).reduce((s, c) => s + c, 0);
  const shippedOrders = statusCounts['shipped'] || 0;
  const deliveredOrders = statusCounts['delivered'] || 0;

  const statusColors = {
    received: '#3B82F6',
    quality_check: '#F59E0B',
    ready_for_pickup: '#8B5CF6',
    shipped: '#6366F1',
    delivered: '#10B981',
    cancelled: '#EF4444',
  };

  const maxCount = Math.max(...Object.values(statusCounts), 1);

  if (loading) return (
    <div style={{ fontFamily: "'Outfit', sans-serif" }}>
      <div className="loading-bar" />
      <div style={{ marginBottom: '48px' }}>
        <div className="skeleton" style={{ height: '40px', width: '300px', marginBottom: '12px' }} />
        <div className="skeleton" style={{ height: '20px', width: '450px' }} />
      </div>
      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(4, 1fr)', gap: '24px', marginBottom: '48px' }}>
        {[1,2,3,4].map(i => (
          <div key={i} className="skeleton" style={{ height: '180px', borderRadius: '24px' }} />
        ))}
      </div>
      <div style={{ display: 'grid', gridTemplateColumns: '1.2fr 0.8fr', gap: '24px' }}>
        <div className="skeleton" style={{ height: '400px', borderRadius: '24px' }} />
        <div className="skeleton" style={{ height: '400px', borderRadius: '24px' }} />
      </div>
    </div>
  );

  return (
    <div style={{ fontFamily: "'Outfit', sans-serif", animation: 'fadeIn 0.5s ease' }}>
      <style>{`
        @keyframes spin { to { transform: rotate(360deg); } }
        @keyframes fadeIn { from { opacity: 0; transform: translateY(10px); } to { opacity: 1; transform: translateY(0); } }
        .kpi-card { transition: all 0.3s ease; }
        .kpi-card:hover { transform: translateY(-5px); box-shadow: 0 12px 24px rgba(0,0,0,0.05); }
      `}</style>

      <div style={{ marginBottom: '48px', display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
        <div>
          <h1 style={{ fontSize: '32px', fontWeight: '900', margin: 0, letterSpacing: '-1px', color: '#0F172A' }}>Performance Analytics</h1>
          <p style={{ color: '#64748B', margin: '8px 0 0', fontSize: '16px' }}>Detailed insights into your store's growth and operations.</p>
        </div>
        <div style={{ display: 'flex', gap: '12px' }}>
          <button onClick={() => window.location.reload()} style={{ padding: '12px 20px', borderRadius: '12px', border: '1px solid #E2E8F0', background: '#FFF', fontWeight: '700', color: '#0F172A', cursor: 'pointer', display: 'flex', alignItems: 'center', gap: '8px' }}>
            <i className="fas fa-sync-alt" /> Refresh Data
          </button>
        </div>
      </div>

      {/* KPI Cards */}
      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(4, 1fr)', gap: '24px', marginBottom: '48px' }}>
        {[
          { label: 'Total Revenue', value: `₱${totalRevenue.toLocaleString('en-PH', { minimumFractionDigits: 2 })}`, icon: 'fa-peso-sign', color: '#10B981', bg: '#DCFCE7' },
          { label: 'Total Orders', value: totalOrdersCount, icon: 'fa-shopping-bag', color: '#6366F1', bg: '#EEF2FF' },
          { label: 'Active Shipments', value: shippedOrders, icon: 'fa-truck-fast', color: '#3B82F6', bg: '#EFF6FF' },
          { label: 'Completion Rate', value: `${totalOrdersCount > 0 ? Math.round((deliveredOrders / totalOrdersCount) * 100) : 0}%`, icon: 'fa-chart-pie', color: '#F59E0B', bg: '#FFFBEB' },
        ].map(card => (
          <div key={card.label} className="kpi-card" style={{ background: '#FFF', borderRadius: '24px', border: '1px solid #E2E8F0', padding: '32px', display: 'flex', flexDirection: 'column', gap: '20px' }}>
            <div style={{ width: '48px', height: '48px', borderRadius: '16px', background: card.bg, display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
              <i className={`fas ${card.icon}`} style={{ fontSize: '18px', color: card.color }} />
            </div>
            <div>
              <div style={{ fontSize: '13px', color: '#64748B', fontWeight: '700', textTransform: 'uppercase', letterSpacing: '1px', marginBottom: '4px' }}>{card.label}</div>
              <div style={{ fontSize: '28px', fontWeight: '900', color: '#0F172A', letterSpacing: '-0.5px' }}>{card.value}</div>
            </div>
          </div>
        ))}
      </div>

      <div style={{ display: 'grid', gridTemplateColumns: '1.2fr 0.8fr', gap: '24px', marginBottom: '24px' }}>

        {/* Order Status Breakdown */}
        <div style={{ background: '#FFF', borderRadius: '24px', border: '1px solid #E2E8F0', padding: '32px' }}>
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '32px' }}>
            <h3 style={{ fontSize: '18px', fontWeight: '900', margin: 0, color: '#0F172A' }}>Order Status Flow</h3>
            <span style={{ fontSize: '12px', color: '#64748B', fontWeight: '700' }}>LIVE TRACKING</span>
          </div>
          <div style={{ display: 'grid', gap: '20px' }}>
            {Object.entries(statusCounts).map(([status, count]) => (
              <div key={status}>
                <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: '8px' }}>
                  <span style={{ fontSize: '14px', fontWeight: '700', textTransform: 'capitalize', color: '#334155' }}>{status.replace('_', ' ')}</span>
                  <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
                    <span style={{ fontSize: '14px', fontWeight: '900', color: statusColors[status] || '#64748B' }}>{count}</span>
                    <span style={{ fontSize: '11px', color: '#94A3B8', fontWeight: '600' }}>({Math.round((count/maxCount)*100)}%)</span>
                  </div>
                </div>
                <div style={{ height: '10px', background: '#F1F5F9', borderRadius: '100px', overflow: 'hidden' }}>
                  <div style={{ height: '100%', width: `${(count / maxCount) * 100}%`, background: statusColors[status] || '#CCC', borderRadius: '100px', transition: 'width 1s cubic-bezier(0.4, 0, 0.2, 1)' }} />
                </div>
              </div>
            ))}
            {Object.keys(statusCounts).length === 0 && <p style={{ color: '#94A3B8', fontSize: '14px', textAlign: 'center', padding: '40px' }}>No order data available yet.</p>}
          </div>
        </div>

        {/* Low Stock Alert */}
        <div style={{ background: '#FFF', borderRadius: '24px', border: '1px solid #E2E8F0', padding: '32px' }}>
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '32px' }}>
            <h3 style={{ fontSize: '18px', fontWeight: '900', margin: 0, color: '#0F172A' }}>Stock Monitor</h3>
            <div style={{ background: '#FEF2F2', color: '#DC2626', fontSize: '11px', padding: '4px 12px', borderRadius: '20px', fontWeight: '800' }}>
              {inventoryReport.filter(p => p.total_stock <= 5).length} CRITICAL
            </div>
          </div>
          <div style={{ maxHeight: '340px', overflowY: 'auto', display: 'grid', gap: '12px' }}>
            {inventoryReport.filter(p => p.total_stock <= 15).map((p, i) => (
              <div key={i} style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', padding: '14px 18px', background: p.total_stock <= 5 ? '#FEF2F2' : '#FFFBEB', borderRadius: '16px', border: `1px solid ${p.total_stock <= 5 ? '#FEE2E2' : '#FEF3C7'}` }}>
                <div>
                  <div style={{ fontSize: '14px', fontWeight: '800', color: '#1E293B' }}>{p.product_name}</div>
                  <div style={{ fontSize: '11px', color: p.total_stock <= 5 ? '#EF4444' : '#D97706', fontWeight: '700', marginTop: '2px' }}>{p.total_stock <= 5 ? 'REPLENISH IMMEDIATELY' : 'LOW STOCK WARNING'}</div>
                </div>
                <div style={{ fontSize: '14px', fontWeight: '900', color: p.total_stock <= 5 ? '#DC2626' : '#D97706', background: '#FFF', padding: '6px 12px', borderRadius: '10px', boxShadow: '0 2px 4px rgba(0,0,0,0.05)' }}>
                  {p.total_stock}
                </div>
              </div>
            ))}
            {inventoryReport.filter(p => p.total_stock <= 15).length === 0 && (
              <div style={{ textAlign: 'center', padding: '60px 0' }}>
                <div style={{ fontSize: '32px', marginBottom: '12px' }}>📦</div>
                <p style={{ color: '#64748B', fontSize: '14px', fontWeight: '600' }}>All products are well-stocked!</p>
              </div>
            )}
          </div>
        </div>
      </div>

      {/* Recent Orders Table */}
      <div style={{ background: '#FFF', borderRadius: '24px', border: '1px solid #E2E8F0', overflow: 'hidden' }}>
        <div style={{ padding: '32px', borderBottom: '1px solid #F1F5F9', display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
          <h3 style={{ fontSize: '18px', fontWeight: '900', margin: 0, color: '#0F172A' }}>Transaction History</h3>
          <button style={{ background: 'none', border: 'none', color: '#6366F1', fontWeight: '700', fontSize: '13px', cursor: 'pointer' }}>View All Orders →</button>
        </div>
        <div style={{ overflowX: 'auto' }}>
          <table style={{ width: '100%', borderCollapse: 'collapse' }}>
            <thead>
              <tr style={{ background: '#F8FAF6' }}>
                {['ID', 'Customer', 'Items', 'Amount', 'Status', 'Date'].map(h => (
                  <th key={h} style={{ padding: '16px 32px', textAlign: 'left', fontSize: '11px', fontWeight: '800', color: '#64748B', textTransform: 'uppercase', letterSpacing: '1px' }}>{h}</th>
                ))}
              </tr>
            </thead>
            <tbody>
              {orders.slice(0, 10).map(o => (
                <tr key={o.id} style={{ borderTop: '1px solid #F1F5F9', transition: 'background 0.2s' }} onMouseEnter={e=>e.currentTarget.style.background='#F8FAFC'} onMouseLeave={e=>e.currentTarget.style.background='transparent'}>
                  <td style={{ padding: '20px 32px', fontWeight: '800', fontSize: '14px', color: '#0F172A' }}>#{o.id}</td>
                  <td style={{ padding: '20px 32px', fontSize: '14px', fontWeight: '600', color: '#334155' }}>{o.user?.name || '—'}</td>
                  <td style={{ padding: '20px 32px', fontSize: '14px', color: '#64748B' }}>{(o.orderItems || o.order_items || []).length} Units</td>
                  <td style={{ padding: '20px 32px', fontSize: '14px', fontWeight: '800', color: '#0F172A' }}>₱{parseFloat(o.total || o.total_amount || 0).toFixed(2)}</td>
                  <td style={{ padding: '20px 32px' }}>
                    <span style={{
                      padding: '6px 14px', borderRadius: '10px', fontSize: '11px', fontWeight: '800', textTransform: 'uppercase', letterSpacing: '0.5px',
                      background: o.status === 'delivered' ? '#DCFCE7' : o.status === 'cancelled' ? '#FEE2E2' : '#FEF3C7',
                      color: o.status === 'delivered' ? '#16A34A' : o.status === 'cancelled' ? '#DC2626' : '#D97706'
                    }}>{o.status?.replace('_', ' ')}</span>
                  </td>
                  <td style={{ padding: '20px 32px', fontSize: '13px', color: '#94A3B8', fontWeight: '500' }}>{new Date(o.created_at).toLocaleDateString()}</td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
};

export default AdminAnalytics;
