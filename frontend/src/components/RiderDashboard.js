import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import axios from 'axios';
import L from 'leaflet';
import { MapContainer, TileLayer, Marker, Popup } from 'react-leaflet';
import 'leaflet/dist/leaflet.css';

// Leaflet marker fix
if (L.Icon.Default) {
  delete L.Icon.Default.prototype._getIconUrl;
  L.Icon.Default.mergeOptions({
    iconRetinaUrl: 'https://cdnjs.cloudflare.com/ajax/libs/leaflet/1.7.1/images/marker-icon-2x.png',
    iconUrl: 'https://cdnjs.cloudflare.com/ajax/libs/leaflet/1.7.1/images/marker-icon.png',
    shadowUrl: 'https://cdnjs.cloudflare.com/ajax/libs/leaflet/1.7.1/images/marker-shadow.png',
  });
}

const BARANGAY_COORDS = {
  'libertad': [8.9416, 125.5083],
  'doongan': [8.9567, 125.5333],
  'san vicente': [8.9283, 125.5250],
  'villa kananga': [8.9333, 125.5167],
  'obrero': [8.9500, 125.5417],
  'imadejas': [8.9533, 125.5250],
  'baan': [8.9750, 125.5583],
  'pangabugan': [8.9667, 125.5500],
  'ambago': [8.9583, 125.5083],
  'bonbon': [8.9250, 125.4917],
  'lumbocan': [9.0083, 125.4917],
  'masao': [9.0000, 125.5000],
  'lapu-lapu': [8.9583, 125.5500],
  'port poyohon': [8.9667, 125.5333],
  'holy redeemer': [8.9583, 125.5417],
  'leon kilat': [8.9417, 125.5333],
  'agusan pequeño': [8.9750, 125.5333],
  'pianing': [8.9870, 125.6380],
  'ampayon': [8.9472, 125.6028],
  'sumilihon': [8.9750, 125.5850],
  'taguibo': [8.9800, 125.5950],
  'anticala': [8.8833, 125.6500],
  'bancasi': [8.9500, 125.4833]
};

const EmptyState = ({ icon, message }) => (
  <div style={{ textAlign: 'center', padding: '48px 24px' }}>
    <i className={`fas ${icon}`} style={{ fontSize: 44, color: '#cbd5e1', marginBottom: 14, display: 'block' }} />
    <p style={{ color: '#94a3b8', margin: 0, fontSize: 14, maxWidth: 280, marginLeft: 'auto', marginRight: 'auto' }}>{message}</p>
  </div>
);

const LiveMap = ({ orders, height = 350 }) => {
  const BUTUAN_CENTER = [8.9475, 125.5406];
  
  const getOrderCoords = (order) => {
    const addr = order.shippingAddress || order.shipping_address || {};
    const addrStr = ((addr.street || '') + ' ' + (addr.city || '')).toLowerCase();
    for (const [brgy, coords] of Object.entries(BARANGAY_COORDS)) {
      if (addrStr.includes(brgy)) {
        return [coords[0], coords[1]];
      }
    }
    return BUTUAN_CENTER;
  };

  if (!MapContainer) return null;

  // Center on the first order if there's only one
  const mapCenter = orders.length === 1 ? getOrderCoords(orders[0]) : BUTUAN_CENTER;
  const zoomLevel = orders.length === 1 ? 15 : 13;

  return (
    <div style={{ height, borderRadius: 16, overflow: 'hidden', border: '1px solid #e2e8f0', boxShadow: '0 4px 12px rgba(0,0,0,0.05)', marginBottom: 12 }}>
      <MapContainer center={mapCenter} zoom={zoomLevel} style={{ height: '100%', width: '100%' }}>
        <TileLayer url="https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png" />
        {orders.map(o => (
          <Marker key={o.id} position={getOrderCoords(o)}>
            <Popup>
              <div style={{ fontFamily: 'Outfit, sans-serif' }}>
                <p style={{ margin: 0, fontWeight: 700 }}>Order #{o.id}</p>
                <p style={{ margin: '4px 0', fontSize: 12 }}>{(o.shippingAddress || o.shipping_address)?.street || (o.shippingAddress || o.shipping_address)?.city}</p>
              </div>
            </Popup>
          </Marker>
        ))}
      </MapContainer>
    </div>
  );
};

const OrderCard = ({ order, type, updatingId, updateOrderStatus, onViewMap }) => {
  const isUpdating = updatingId === order.id;
  const addr = order.shippingAddress || order.shipping_address || {};
  const phone = addr?.phone || order.user?.customer_number;
  const fullAddress = `${addr.street || ''}, ${addr.city || ''}, ${addr.state || addr.province || ''}`.trim().replace(/^, |, $/g, '');

  return (
    <div style={{
      background: '#fff', borderRadius: 16, border: '1px solid #e2e8f0',
      boxShadow: '0 4px 12px rgba(0,0,0,0.03)', padding: '14px 12px', marginBottom: 12,
      position: 'relative', overflow: 'hidden'
    }}>
      <div style={{ position: 'absolute', top: 0, left: 0, width: 4, height: '100%', background: type === 'pickup' ? '#f59e0b' : type === 'active' ? '#3b82f6' : type === 'returned' ? '#ef4444' : '#10b981' }} />
      
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', marginBottom: 12 }}>
        <div>
          <div style={{ display: 'flex', alignItems: 'center', gap: 6, marginBottom: 2 }}>
            <span style={{ fontSize: 16, fontWeight: 800, color: '#0f172a' }}>#{order.id.toString().padStart(4, '0')}</span>
            <span style={{ 
              fontSize: 9, fontWeight: 800, padding: '2px 8px', borderRadius: 4, textTransform: 'uppercase',
              background: order.payment_method === 'cod' ? '#fff7ed' : '#f5f3ff',
              color: order.payment_method === 'cod' ? '#c2410c' : '#7c3aed',
              border: `1px solid ${order.payment_method === 'cod' ? '#ffedd5' : '#ddd6fe'}`
            }}>
              {order.payment_method === 'cod' ? 'COD' : 'PAID'}
            </span>
          </div>
          <p style={{ margin: 0, fontSize: 11, color: '#94a3b8', fontWeight: 500 }}>
            {new Date(order.created_at).toLocaleDateString()}
          </p>
        </div>
        <div style={{ textAlign: 'right' }}>
          <span style={{ fontSize: 17, fontWeight: 900, color: '#0f172a', display: 'block' }}>₱{parseFloat(order.total || 0).toFixed(2)}</span>
        </div>
      </div>

      <div style={{ background: '#f8fafc', borderRadius: 10, padding: 10, marginBottom: 12 }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: 8, marginBottom: 8 }}>
          <div style={{ width: 24, height: 24, borderRadius: 6, background: '#fff', border: '1px solid #e2e8f0', display: 'flex', alignItems: 'center', justifyContent: 'center', flexShrink: 0 }}>
            <i className="fas fa-user" style={{ color: '#64748b', fontSize: 11 }} />
          </div>
          <p style={{ margin: 0, fontSize: 13, fontWeight: 700, color: '#0f172a', flex: 1, whiteSpace: 'nowrap', overflow: 'hidden', textOverflow: 'ellipsis' }}>{addr?.name || order.user?.name || 'Customer'}</p>
          {phone && (
            <div style={{ display: 'flex', alignItems: 'center', gap: '6px' }}>
              <span style={{ fontSize: 12, fontWeight: 700, color: '#475569' }}>{phone}</span>
              <a href={`tel:${phone}`} style={{ width: 28, height: 28, borderRadius: '50%', background: '#10b981', color: '#fff', display: 'flex', alignItems: 'center', justifyContent: 'center', textDecoration: 'none', fontSize: 12 }}>
                <i className="fas fa-phone" />
              </a>
            </div>
          )}
        </div>

        <div style={{ display: 'flex', alignItems: 'flex-start', gap: 8, marginBottom: 8 }}>
          <div style={{ width: 24, height: 24, borderRadius: 6, background: '#fff', border: '1px solid #e2e8f0', display: 'flex', alignItems: 'center', justifyContent: 'center', flexShrink: 0 }}>
            <i className="fas fa-location-dot" style={{ color: '#ef4444', fontSize: 11 }} />
          </div>
          <div style={{ flex: 1 }}>
            <p style={{ margin: 0, fontSize: 12, fontWeight: 600, color: '#475569', lineHeight: 1.3, display: '-webkit-box', WebkitLineClamp: 2, WebkitBoxOrient: 'vertical', overflow: 'hidden' }}>{fullAddress}</p>
          </div>
        </div>

        <button 
          onClick={() => onViewMap(order)}
          style={{ background: 'none', border: 'none', padding: 0, color: '#3b82f6', fontSize: 11, fontWeight: 800, cursor: 'pointer', display: 'flex', alignItems: 'center', gap: 4 }}
        >
          <i className="fas fa-map-location-dot" />
          VIEW MAP
        </button>
      </div>

      {type !== 'completed' && type !== 'returned' && (
        <div style={{ display: 'flex', gap: 8 }}>
          {type === 'pickup' ? (
            <button
              disabled={isUpdating}
              onClick={() => updateOrderStatus(order.id, 'shipped')}
              style={{
                flex: 1, padding: '10px', border: 'none', borderRadius: 10,
                background: isUpdating ? '#e2e8f0' : '#0f172a',
                color: '#fff', fontWeight: 800, fontSize: 13,
                cursor: isUpdating ? 'not-allowed' : 'pointer', fontFamily: 'Outfit, sans-serif',
                display: 'flex', alignItems: 'center', justifyContent: 'center', gap: 6, transition: 'all 0.2s'
              }}>
              {isUpdating ? <i className="fas fa-spinner fa-spin" /> : <i className="fas fa-box" />}
              PICKUP
            </button>
          ) : (
            <>
              <button
                disabled={isUpdating}
                onClick={() => updateOrderStatus(order.id, 'delivered')}
                style={{
                  flex: 2, padding: '10px', border: 'none', borderRadius: 10,
                  background: isUpdating ? '#e2e8f0' : '#10b981',
                  color: '#fff', fontWeight: 800, fontSize: 13,
                  cursor: isUpdating ? 'not-allowed' : 'pointer', fontFamily: 'Outfit, sans-serif',
                  display: 'flex', alignItems: 'center', justifyContent: 'center', gap: 6, transition: 'all 0.2s'
                }}>
                {isUpdating ? <i className="fas fa-spinner fa-spin" /> : <i className="fas fa-check" />}
                DONE
              </button>
              <button
                disabled={isUpdating}
                onClick={() => updateOrderStatus(order.id, 'returned')}
                style={{
                  flex: 1, padding: '10px', border: '1px solid #fee2e2', borderRadius: 10,
                  background: '#fff', color: '#dc2626', fontWeight: 700, fontSize: 12,
                  cursor: isUpdating ? 'not-allowed' : 'pointer', fontFamily: 'Outfit, sans-serif'
                }}>
                FAIL
              </button>
            </>
          )}
        </div>
      )}
    </div>
  );
};

const SIDEBAR_BG = 'linear-gradient(180deg, #0f172a 0%, #1e293b 100%)';

const RiderDashboard = () => {
  const [user, setUser] = useState(null);
  const [orders, setOrders] = useState([]);
  const [activeTab, setActiveTab] = useState('dashboard');
  const [updatingId, setUpdatingId] = useState(null);
  const [selectedMapOrder, setSelectedMapOrder] = useState(null);
  const navigate = useNavigate();

  useEffect(() => {
    const token = localStorage.getItem('token');
    if (!token) { navigate('/login'); return; }
    fetchData();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [navigate]);

  const fetchData = async () => {
    try {
      const userRes = await axios.get('/api/user');
      const userData = userRes.data;
      if (userData.role !== 'rider') { navigate('/login'); return; }
      setUser(userData);
      const ordersRes = await axios.get('/api/rider/orders');
      setOrders(ordersRes.data || []);
    } catch (error) {
      console.error('Failed to fetch rider data:', error);
      if (error.response?.status === 401) { localStorage.removeItem('token'); window.location.href = '/login'; }
    }
  };

  const handleLogout = () => axios.post('/api/logout').finally(() => { localStorage.removeItem('token'); window.location.href = '/'; });

  const updateOrderStatus = async (orderId, newStatus) => {
    setUpdatingId(orderId);
    try {
      await axios.put(`/api/orders/${orderId}`, { status: newStatus });
      await fetchData();
    } catch (error) {
      console.error('Failed to update order status:', error);
      alert('Failed to update. Please try again.');
    } finally {
      setUpdatingId(null);
    }
  };

  if (!user) return (
    <div style={{ display: 'flex', justifyContent: 'center', alignItems: 'center', height: '100vh', background: '#f8fafc' }}>
      <div style={{ textAlign: 'center' }}>
        <div style={{ width: 44, height: 44, border: '4px solid #f59e0b', borderTopColor: 'transparent', borderRadius: '50%', animation: 'spin 0.8s linear infinite', margin: '0 auto 12px' }} />
        <p style={{ color: '#64748b', fontFamily: 'Outfit, sans-serif' }}>Loading…</p>
      </div>
    </div>
  );

  const pendingOrders = orders.filter(o => o.status === 'ready_for_pickup');
  const activeDeliveries = orders.filter(o => o.status === 'shipped');
  const completedDeliveries = orders.filter(o => o.status === 'delivered');
  const returnedDeliveries = orders.filter(o => o.status === 'returned');
  const totalEarnings = completedDeliveries.reduce((sum, o) => sum + parseFloat(o.total || 0), 0);

  return (
    <div style={{ display: 'flex', minHeight: '100vh', background: '#f8fafc', fontFamily: 'Outfit, sans-serif' }}>

      <style>{`@keyframes spin { to { transform: rotate(360deg); } } .rider-nav-btn:hover { background: rgba(255,255,255,0.08) !important; }`}</style>

      {/* Sidebar */}
      <aside style={{
        width: 240, background: SIDEBAR_BG, color: '#fff',
        display: 'flex', flexDirection: 'column',
        position: 'fixed', height: '100vh', left: 0, top: 0,
        boxShadow: '4px 0 24px rgba(0,0,0,0.15)', zIndex: 100
      }}>
        <div style={{ padding: '28px 20px 20px', borderBottom: '1px solid rgba(255,255,255,0.07)' }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: 10, marginBottom: 4 }}>
            <div style={{ width: 36, height: 36, borderRadius: 10, background: '#f59e0b', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
              <i className="fas fa-motorcycle" style={{ fontSize: 16 }} />
            </div>
            <span style={{ fontSize: 18, fontWeight: 700 }}>StepUp</span>
          </div>
          <span style={{ fontSize: 11, color: 'rgba(255,255,255,0.4)', letterSpacing: 1.5, textTransform: 'uppercase', marginLeft: 46 }}>Rider Portal</span>
        </div>

        {/* Nav */}
        <nav style={{ flex: 1, padding: '16px 12px' }}>
          {[
            { key: 'dashboard', icon: 'fa-gauge-high', label: 'Dashboard' },
            { key: 'deliveries', icon: 'fa-truck-fast', label: 'Deliveries' },
            { key: 'history', icon: 'fa-clock-rotate-left', label: 'History' },
          ].map(item => (
            <button key={item.key} className="rider-nav-btn" onClick={() => setActiveTab(item.key)}
              style={{
                width: '100%', padding: '11px 14px', border: 'none', cursor: 'pointer',
                display: 'flex', alignItems: 'center', gap: 12, borderRadius: 10, marginBottom: 2,
                textAlign: 'left', fontSize: 14, fontWeight: 500, fontFamily: 'Outfit, sans-serif', transition: 'all 0.2s',
                background: activeTab === item.key ? 'rgba(245,158,11,0.15)' : 'transparent',
                color: activeTab === item.key ? '#fcd34d' : 'rgba(255,255,255,0.65)',
                borderLeft: activeTab === item.key ? '3px solid #f59e0b' : '3px solid transparent',
              }}>
              <i className={`fas ${item.icon}`} style={{ width: 18 }} />
              <span>{item.label}</span>
            </button>
          ))}
        </nav>

        {/* User Footer */}
        <div style={{ padding: '16px 16px 24px', borderTop: '1px solid rgba(255,255,255,0.07)' }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: 10, marginBottom: 4 }}>
            <div style={{ width: 36, height: 36, borderRadius: '50%', background: 'linear-gradient(135deg, #f59e0b, #d97706)', display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: 15, fontWeight: 700 }}>
              {user.name?.charAt(0).toUpperCase()}
            </div>
            <div>
              <div style={{ fontSize: 13, fontWeight: 600, color: '#fff' }}>{user.name}</div>
              {user.city && <div style={{ fontSize: 11, color: 'rgba(255,255,255,0.4)' }}>📍 {user.city}</div>}
            </div>
          </div>
          <button onClick={handleLogout} style={{ marginTop: 12, width: '100%', padding: '9px 14px', border: '1px solid rgba(255,255,255,0.12)', borderRadius: 8, background: 'transparent', color: 'rgba(255,255,255,0.6)', cursor: 'pointer', fontSize: 13, fontFamily: 'Outfit, sans-serif', display: 'flex', alignItems: 'center', gap: 8, transition: 'all 0.2s' }}
            onMouseEnter={e => { e.currentTarget.style.background = 'rgba(239,68,68,0.15)'; e.currentTarget.style.color = '#f87171'; }}
            onMouseLeave={e => { e.currentTarget.style.background = 'transparent'; e.currentTarget.style.color = 'rgba(255,255,255,0.6)'; }}>
            <i className="fas fa-arrow-right-from-bracket" /> Sign Out
          </button>
        </div>
      </aside>

      {/* Main Content Area */}
      <main style={{ marginLeft: 240, flex: 1, padding: 32 }}>
        {activeTab === 'dashboard' && (
          <div key="dashboard-tab">
            {/* Header */}
            <div style={{ marginBottom: 32, display: 'flex', justifyContent: 'space-between', alignItems: 'flex-end' }}>
              <div>
                <h1 style={{ fontSize: 32, fontWeight: 900, color: '#0f172a', margin: 0, letterSpacing: '-0.8px' }}>Rider Dashboard</h1>
                <p style={{ color: '#64748b', margin: '8px 0 0', fontSize: 16, fontWeight: 500 }}>Welcome back, <span style={{ color: '#0f172a', fontWeight: 700 }}>{user.name}</span>! Here is your delivery performance.</p>
              </div>
              <div style={{ background: '#fff', padding: '10px 18px', borderRadius: 12, border: '1px solid #e2e8f0', display: 'flex', alignItems: 'center', gap: 10, boxShadow: '0 2px 8px rgba(0,0,0,0.02)' }}>
                <div style={{ width: 10, height: 10, borderRadius: '50%', background: '#10b981', boxShadow: '0 0 0 4px rgba(16,185,129,0.1)' }} />
                <span style={{ fontSize: 13, fontWeight: 700, color: '#0f172a' }}>Active & Online</span>
              </div>
            </div>

            {/* Stats row */}
            <div style={{ display: 'grid', gridTemplateColumns: 'repeat(4,1fr)', gap: 16, marginBottom: 32 }}>
              {[
                { label: 'Ready for Pickup', value: pendingOrders.length, color: '#f59e0b', bg: 'rgba(245,158,11,0.08)', icon: 'fa-box' },
                { label: 'Out for Delivery', value: activeDeliveries.length, color: '#3b82f6', bg: 'rgba(59,130,246,0.08)', icon: 'fa-truck-fast' },
                { label: 'Delivered Today', value: completedDeliveries.length, color: '#10b981', bg: 'rgba(16,185,129,0.08)', icon: 'fa-circle-check' },
                { label: 'Total Earnings', value: `₱${totalEarnings.toFixed(2)}`, color: '#6366f1', bg: 'rgba(99,102,241,0.08)', icon: 'fa-peso-sign' },
              ].map((s, i) => (
                <div key={i} style={{ background: '#fff', borderRadius: 14, padding: '22px 20px', boxShadow: '0 2px 10px rgba(0,0,0,0.04)', border: '1px solid #e2e8f0' }}>
                  <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                    <div>
                      <p style={{ fontSize: 12, color: '#64748b', margin: '0 0 8px', fontWeight: 600, textTransform: 'uppercase', letterSpacing: 0.5 }}>{s.label}</p>
                      <p style={{ fontSize: 26, fontWeight: 800, color: '#0f172a', margin: 0 }}>{s.value}</p>
                    </div>
                    <div style={{ width: 44, height: 44, borderRadius: 12, background: s.bg, display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
                      <i className={`fas ${s.icon}`} style={{ color: s.color, fontSize: 18 }} />
                    </div>
                  </div>
                </div>
              ))}
            </div>

            <div style={{ display: 'grid', gridTemplateColumns: '1fr 1.5fr', gap: 24 }}>
              <div style={{ display: 'flex', flexDirection: 'column', gap: 24 }}>
                {/* Pickups in Dashboard */}
                <div style={{ background: '#fff', borderRadius: 24, padding: 28, border: '1px solid #e2e8f0', boxShadow: '0 4px 20px rgba(0,0,0,0.03)' }}>
                  <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 24 }}>
                    <h3 style={{ margin: 0, fontSize: 20, fontWeight: 800, color: '#0f172a' }}>Ready for Pickup</h3>
                    <span style={{ background: '#fef3c7', color: '#b45309', borderRadius: 20, padding: '2px 10px', fontSize: 12, fontWeight: 700 }}>{pendingOrders.length} New</span>
                  </div>
                  
                  {pendingOrders.length === 0 ? (
                    <EmptyState icon="fa-box-open" message="No orders waiting for pickup." />
                  ) : (
                    <div style={{ display: 'flex', flexDirection: 'column', gap: 12 }}>
                      {pendingOrders.map(o => (
                        <OrderCard 
                          key={o.id} 
                          order={o} 
                          type="pickup" 
                          updatingId={updatingId} 
                          updateOrderStatus={updateOrderStatus} 
                          onViewMap={setSelectedMapOrder}
                        />
                      ))}
                    </div>
                  )}
                </div>

                {/* Coverage and Benefits */}
                <div style={{ display: 'flex', flexDirection: 'column', gap: 24 }}>
                  <div style={{ background: '#fff', borderRadius: 24, padding: 28, border: '1px solid #e2e8f0', boxShadow: '0 4px 20px rgba(0,0,0,0.03)' }}>
                    <div style={{ display: 'flex', alignItems: 'center', gap: 16, marginBottom: 24 }}>
                      <div style={{ width: 50, height: 50, borderRadius: 16, background: '#fef3c7', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
                         <i className="fas fa-location-dot" style={{ color: '#d97706', fontSize: 20 }} />
                      </div>
                      <div>
                        <h3 style={{ margin: 0, fontSize: 18, fontWeight: 800, color: '#0f172a' }}>Active Coverage</h3>
                        <p style={{ margin: '4px 0 0', color: '#64748b', fontSize: 13, fontWeight: 500 }}>Currently serving {user.city || 'your area'}</p>
                      </div>
                    </div>
                    <p style={{ fontSize: 14, color: '#475569', lineHeight: 1.6, marginBottom: 24 }}>
                      New orders placed in your city will automatically appear in your pickup queue.
                    </p>
                  </div>

                  <div style={{ background: 'linear-gradient(135deg, #0f172a, #1e293b)', borderRadius: 24, padding: 28, color: '#fff', boxShadow: '0 10px 30px rgba(15,23,42,0.15)' }}>
                    <div style={{ display: 'flex', alignItems: 'center', gap: 12, marginBottom: 20 }}>
                      <i className="fas fa-shield-halved" style={{ color: '#f59e0b', fontSize: 18 }} />
                      <span style={{ fontWeight: 800, fontSize: 14, letterSpacing: 0.5, textTransform: 'uppercase' }}>Rider Benefits</span>
                    </div>
                    <p style={{ fontSize: 15, color: '#94a3b8', lineHeight: 1.6, marginBottom: 10 }}>
                      Deliveries: <strong>{completedDeliveries.length}</strong> / 50
                    </p>
                    <div style={{ background: 'rgba(255,255,255,0.05)', borderRadius: 12, height: 8, overflow: 'hidden' }}>
                      <div style={{ width: `${Math.min(100, (completedDeliveries.length / 50) * 100)}%`, height: '100%', background: 'linear-gradient(90deg, #f59e0b, #fbbf24)' }} />
                    </div>
                  </div>
                </div>
              </div>

              {/* Recent History on Right */}
              <div style={{ background: '#fff', borderRadius: 24, padding: 28, border: '1px solid #e2e8f0', boxShadow: '0 4px 20px rgba(0,0,0,0.03)' }}>
                <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 24 }}>
                  <h3 style={{ margin: 0, fontSize: 20, fontWeight: 800, color: '#0f172a' }}>Recent Activity</h3>
                  <button onClick={() => setActiveTab('deliveries')} style={{ background: 'none', border: 'none', color: '#3b82f6', fontWeight: 700, fontSize: 13, cursor: 'pointer' }}>View Deliveries</button>
                </div>
                
                {completedDeliveries.length === 0 ? (
                  <EmptyState icon="fa-receipt" message="No recent jobs." />
                ) : (
                  <div style={{ display: 'flex', flexDirection: 'column', gap: 12 }}>
                    {completedDeliveries.slice(0, 5).map(o => (
                      <div key={o.id} style={{ display: 'flex', alignItems: 'center', gap: 16, padding: '16px', borderRadius: 16, background: '#f8fafc', border: '1px solid #f1f5f9' }}>
                        <div style={{ width: 44, height: 44, borderRadius: 12, background: '#fff', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
                          <i className="fas fa-check-circle" style={{ color: '#10b981', fontSize: 18 }} />
                        </div>
                        <div style={{ flex: 1 }}>
                          <p style={{ margin: 0, fontSize: 14, fontWeight: 700, color: '#0f172a' }}>#{o.id}</p>
                          <p style={{ margin: 0, fontSize: 12, color: '#64748b' }}>{o.shippingAddress?.city}</p>
                        </div>
                        <div style={{ textAlign: 'right' }}>
                          <p style={{ margin: 0, fontSize: 14, fontWeight: 800, color: '#0f172a' }}>₱{parseFloat(o.total || 0).toFixed(2)}</p>
                        </div>
                      </div>
                    ))}
                  </div>
                )}
              </div>
            </div>
          </div>
        )}

        {activeTab === 'deliveries' && (
          <div key="deliveries-tab" style={{ maxWidth: '100%', margin: '0 auto' }}>
            {/* Header */}
            <div style={{ marginBottom: 32, display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
              <div>
                <h1 style={{ fontSize: 32, fontWeight: 900, color: '#0f172a', margin: 0, letterSpacing: '-0.8px' }}>Deliveries</h1>
                <p style={{ color: '#64748b', margin: '8px 0 0', fontSize: 16, fontWeight: 500 }}>
                  Manage your active missions and track your performance.
                </p>
              </div>
              <button onClick={fetchData} style={{ background: '#fff', border: '1px solid #e2e8f0', padding: '10px 20px', borderRadius: 12, fontSize: 14, fontWeight: 700, color: '#0f172a', cursor: 'pointer', display: 'flex', alignItems: 'center', gap: 8 }}>
                <i className="fas fa-arrows-rotate" /> Sync
              </button>
            </div>

            {/* 4-column Grid */}
            <div style={{ display: 'grid', gridTemplateColumns: 'repeat(4,1fr)', gap: 16 }}>
              {/* Pickup column */}
              <div>
                <div style={{ display: 'flex', alignItems: 'center', gap: 8, marginBottom: 14 }}>
                  <div style={{ width: 10, height: 10, borderRadius: '50%', background: '#f59e0b' }} />
                  <h3 style={{ margin: 0, fontSize: 14, fontWeight: 800, color: '#0f172a', textTransform: 'uppercase' }}>Pickups</h3>
                  <span style={{ background: '#fef3c7', color: '#b45309', borderRadius: 20, padding: '1px 8px', fontSize: 11, fontWeight: 800, marginLeft: 'auto' }}>{pendingOrders.length}</span>
                </div>
                <div style={{ display: 'flex', flexDirection: 'column', gap: 12 }}>
                  {pendingOrders.length === 0 ? <EmptyState icon="fa-box-open" message="None" /> : pendingOrders.map(o => <OrderCard key={o.id} order={o} type="pickup" updatingId={updatingId} updateOrderStatus={updateOrderStatus} onViewMap={setSelectedMapOrder} />)}
                </div>
              </div>

              {/* Active column */}
              <div>
                <div style={{ display: 'flex', alignItems: 'center', gap: 8, marginBottom: 14 }}>
                  <div style={{ width: 10, height: 10, borderRadius: '50%', background: '#3b82f6' }} />
                  <h3 style={{ margin: 0, fontSize: 14, fontWeight: 800, color: '#0f172a', textTransform: 'uppercase' }}>On Route</h3>
                  <span style={{ background: '#dbeafe', color: '#1d4ed8', borderRadius: 20, padding: '1px 8px', fontSize: 11, fontWeight: 800, marginLeft: 'auto' }}>{activeDeliveries.length}</span>
                </div>
                <div style={{ display: 'flex', flexDirection: 'column', gap: 12 }}>
                  {activeDeliveries.length === 0 ? <EmptyState icon="fa-truck" message="None" /> : activeDeliveries.map(o => <OrderCard key={o.id} order={o} type="active" updatingId={updatingId} updateOrderStatus={updateOrderStatus} onViewMap={setSelectedMapOrder} />)}
                </div>
              </div>

              {/* Completed column */}
              <div>
                <div style={{ display: 'flex', alignItems: 'center', gap: 8, marginBottom: 14 }}>
                  <div style={{ width: 10, height: 10, borderRadius: '50%', background: '#10b981' }} />
                  <h3 style={{ margin: 0, fontSize: 14, fontWeight: 800, color: '#0f172a', textTransform: 'uppercase' }}>Done</h3>
                  <span style={{ background: '#dcfce7', color: '#15803d', borderRadius: 20, padding: '1px 8px', fontSize: 11, fontWeight: 800, marginLeft: 'auto' }}>{completedDeliveries.length}</span>
                </div>
                <div style={{ display: 'flex', flexDirection: 'column', gap: 12 }}>
                  {completedDeliveries.length === 0 ? <EmptyState icon="fa-circle-check" message="None" /> : completedDeliveries.map(o => <OrderCard key={o.id} order={o} type="completed" updatingId={updatingId} updateOrderStatus={updateOrderStatus} onViewMap={setSelectedMapOrder} />)}
                </div>
              </div>

              {/* Returned column */}
              <div>
                <div style={{ display: 'flex', alignItems: 'center', gap: 8, marginBottom: 14 }}>
                  <div style={{ width: 10, height: 10, borderRadius: '50%', background: '#ef4444' }} />
                  <h3 style={{ margin: 0, fontSize: 14, fontWeight: 800, color: '#0f172a', textTransform: 'uppercase' }}>Returned</h3>
                  <span style={{ background: '#fee2e2', color: '#dc2626', borderRadius: 20, padding: '1px 8px', fontSize: 11, fontWeight: 800, marginLeft: 'auto' }}>{returnedDeliveries.length}</span>
                </div>
                <div style={{ display: 'flex', flexDirection: 'column', gap: 12 }}>
                  {returnedDeliveries.length === 0 ? <EmptyState icon="fa-rotate-left" message="None" /> : returnedDeliveries.map(o => <OrderCard key={o.id} order={o} type="returned" updatingId={updatingId} updateOrderStatus={updateOrderStatus} onViewMap={setSelectedMapOrder} />)}
                </div>
              </div>
            </div>
          </div>
        )}

        {activeTab === 'history' && (
          <div key="history-tab">
            <div style={{ marginBottom: 24 }}>
              <h1 style={{ fontSize: 26, fontWeight: 700, color: '#0f172a', margin: 0 }}>Delivery History</h1>
              <p style={{ color: '#64748b', margin: '4px 0 0', fontSize: 15 }}>{completedDeliveries.length} total completed deliveries</p>
            </div>
            <div style={{ background: '#fff', borderRadius: 16, boxShadow: '0 2px 8px rgba(0,0,0,0.06)', border: '1px solid #e2e8f0', overflow: 'hidden' }}>
              {completedDeliveries.length === 0 ? (
                <EmptyState icon="fa-clock-rotate-left" message="No delivery history yet." />
              ) : (
                <table style={{ width: '100%', borderCollapse: 'collapse' }}>
                  <thead>
                    <tr style={{ background: '#f8fafc' }}>
                      {['Order', 'Customer', 'Address', 'Total', 'Payment', 'Date'].map(h => (
                        <th key={h} style={{ padding: '10px 20px', textAlign: 'left', fontSize: 11, fontWeight: 600, color: '#94a3b8', textTransform: 'uppercase', letterSpacing: 0.5 }}>{h}</th>
                      ))}
                    </tr>
                  </thead>
                  <tbody>
                    {completedDeliveries.map(o => (
                      <tr key={o.id} style={{ borderTop: '1px solid #f1f5f9' }}>
                        <td style={{ padding: '13px 20px', fontSize: 14, fontWeight: 700, color: '#0f172a' }}>#{o.id}</td>
                        <td style={{ padding: '13px 20px', fontSize: 13, color: '#475569' }}>{o.user?.name || '—'}</td>
                        <td style={{ padding: '13px 20px', fontSize: 12, color: '#64748b' }}>{o.shipping_address?.city || '—'}</td>
                        <td style={{ padding: '13px 20px', fontSize: 13, fontWeight: 700, color: '#10b981' }}>₱{parseFloat(o.total || 0).toFixed(2)}</td>
                        <td style={{ padding: '13px 20px', fontSize: 12 }}>
                          <span style={{ background: o.payment_method === 'cod' ? '#fef3c7' : '#ede9fe', color: o.payment_method === 'cod' ? '#b45309' : '#7c3aed', padding: '2px 10px', borderRadius: 20, fontWeight: 600 }}>
                            {o.payment_method === 'cod' ? 'COD' : 'GCash'}
                          </span>
                        </td>
                        <td style={{ padding: '13px 20px', fontSize: 12, color: '#94a3b8' }}>{new Date(o.updated_at).toLocaleDateString()}</td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              )}
            </div>
          </div>
        )}
      </main>

      {/* Map Modal */}
      {selectedMapOrder && (
        <div style={{ position: 'fixed', inset: 0, background: 'rgba(15,23,42,0.8)', backdropFilter: 'blur(8px)', display: 'flex', alignItems: 'center', justifyContent: 'center', zIndex: 1000, padding: 20 }}>
          <div style={{ background: '#fff', borderRadius: 24, width: '100%', maxWidth: 700, overflow: 'hidden', boxShadow: '0 25px 50px -12px rgba(0,0,0,0.25)', animation: 'fadeIn 0.3s ease-out' }}>
            <div style={{ padding: '20px 24px', borderBottom: '1px solid #f1f5f9', display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
              <div>
                <h3 style={{ margin: 0, fontSize: 18, fontWeight: 800, color: '#0f172a' }}>Order #{selectedMapOrder.id} Location</h3>
                <p style={{ margin: '4px 0 0', fontSize: 13, color: '#64748b' }}>
                  {(selectedMapOrder.shippingAddress || selectedMapOrder.shipping_address)?.street}, {(selectedMapOrder.shippingAddress || selectedMapOrder.shipping_address)?.city}
                </p>
              </div>
              <button onClick={() => setSelectedMapOrder(null)} style={{ width: 36, height: 36, borderRadius: 12, background: '#f8fafc', border: 'none', color: '#64748b', cursor: 'pointer', display: 'flex', alignItems: 'center', justifyContent: 'center', transition: 'all 0.2s' }}>
                <i className="fas fa-times" />
              </button>
            </div>
            <div style={{ padding: 12 }}>
               <LiveMap orders={[selectedMapOrder]} height={450} />
            </div>
            <div style={{ padding: '16px 24px', background: '#f8fafc', display: 'flex', justifyContent: 'flex-end' }}>
               <button onClick={() => setSelectedMapOrder(null)} style={{ padding: '10px 24px', background: '#0f172a', color: '#fff', border: 'none', borderRadius: 12, fontWeight: 700, fontSize: 14, cursor: 'pointer' }}>Close Map</button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default RiderDashboard;
