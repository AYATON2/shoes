
import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import axios from 'axios';
import Notification from './Notification';
import { buildApiAssetUrl } from '../utils/apiUrl';

// Agusan del Norte cities/municipalities
const AGUSAN_CITIES = [
  'Butuan City', 'Buenavista', 'Carmen', 'Cabadbaran City', 'Jabonga',
  'Kitcharao', 'Las Nieves', 'Magallanes', 'Nasipit', 'Remedios T. Romualdez',
  'Santiago', 'Tubay'
];

// Major Butuan Barangays
const BUTUAN_BARANGAYS = [
  'Agusan Pequeño', 'Ambago', 'Ampayon', 'Baan KM 3', 'Baan Riverside', 'Bading',
  'Bancasi', 'Banza', 'Bayanihan', 'Bobon', 'Bonbon', 'Bugabus', 'Buhangin', 'Cabcabon',
  'Camayahan', 'Dagohoy', 'Dankias', 'De Oro', 'Doña Josefa', 'Doongan', 'Dulag',
  'DumALagan', 'Florida', 'Golden Ribbon', 'Holy Redeemer', 'Humabon', 'Imadejas',
  'Jose Rizal', 'Kinamlutan', 'Lapu-lapu', 'Lema', 'Leon Kilat', 'Libertad', 'Limaha',
  'Los Angeles', 'Lumbocan', 'Maguinda', 'Mahogany', 'Manila de Bugabus', 'Maon',
  'Masao', 'Maug', 'New Society Village', 'Nong-nong', 'Obrero', 'Ong Yiu', 'Pagatpatan',
  'Pangabugan', 'Pianing', 'Pinamanculan', 'Port Poyohon', 'Rajah Soliman', 'San Ignacio',
  'San Mateo', 'San Vicente', 'Sikatuna', 'Silongan', 'Sumilihon', 'Tagabaca', 'Taguibo',
  'Taligaman', 'Tandang Sora', 'Tiniwisan', 'Tungao', 'Urduja', 'Villa Kananga'
];

// Common Philippine provinces (Mindanao-focused + major ones)
const PROVINCES = [
  'Agusan del Norte', 'Agusan del Sur', 'Surigao del Norte', 'Surigao del Sur',
  'Davao del Norte', 'Davao del Sur', 'Davao City', 'Misamis Oriental',
  'Misamis Occidental', 'Bukidnon', 'Camiguin', 'Lanao del Norte',
  'Metro Manila', 'Cebu', 'Iloilo', 'Pampanga', 'Laguna', 'Cavite',
  'Batangas', 'Rizal', 'Bulacan', 'Nueva Ecija', 'Pangasinan',
  'La Union', 'Benguet', 'Bohol', 'Leyte', 'Samar', 'Zamboanga del Norte',
  'Zamboanga del Sur', 'South Cotabato', 'Sultan Kudarat', 'North Cotabato',
  'Other Province'
];

const inputStyle = {
  width: '100%', padding: '13px 16px', borderRadius: '12px',
  border: '1px solid #E5E5E5', boxSizing: 'border-box',
  fontSize: '14px', outline: 'none', background: '#FFF'
};
const labelStyle = { display: 'block', fontSize: '12px', fontWeight: '700', marginBottom: '6px', color: '#666', textTransform: 'uppercase', letterSpacing: '0.5px' };
const sectionStyle = { background: '#FFF', padding: '28px', borderRadius: '20px', border: '1px solid #EEE', marginBottom: '20px' };

const Checkout = () => {
  const [cart] = useState(JSON.parse(localStorage.getItem('cart') || '[]'));
  const [shippingAddress, setShippingAddress] = useState({
    name: '', phone: '', street: '', brgy: '', province: '', city: '', zip: '', country: 'Philippines'
  });
  const [paymentMethod, setPaymentMethod] = useState('cod');
  const [loading, setLoading] = useState(false);
  const [notification, setNotification] = useState(null);
  const [orderSuccess, setOrderSuccess] = useState(null);
  const [showGCashModal, setShowGCashModal] = useState(false);
  const [gcashReference, setGCashReference] = useState('');
  const [gcashScreenshotFile, setGCashScreenshotFile] = useState(null);
  const [logisticsOptions, setLogisticsOptions] = useState([]);
  const [selectedLogisticsId, setSelectedLogisticsId] = useState('');
  const [voucherCode, setVoucherCode] = useState('');
  const [appliedVoucher, setAppliedVoucher] = useState(null);
  const navigate = useNavigate();

  useEffect(() => {
    const token = localStorage.getItem('token');
    if (!token) { navigate('/login'); return; }
    axios.defaults.headers.common['Authorization'] = `Bearer ${token}`;
    
    // Fetch user for name auto-population
    axios.get('/api/user').then(res => {
      setShippingAddress(prev => ({ ...prev, name: res.data.name }));
    }).catch(console.error);

    axios.get('/api/logistics').then(res => setLogisticsOptions(res.data)).catch(console.error);
  }, [navigate]);

  const isButuan = (city) => city?.toLowerCase().includes('butuan');
  const isAgusan = (province) => province?.toLowerCase().includes('agusan');

  // Determine shipping zone
  const isLocalDelivery = isButuan(shippingAddress.city);

  // Available logistics based on city selection
  const availableLogistics = logisticsOptions.filter(l => {
    if (!shippingAddress.city) {
      return !l.is_local && (l.name.includes('J&T') || l.name.includes('LBC')); // Default: show non-local J&T/LBC
    }
    if (isLocalDelivery) return l.is_local; // Butuan → Local Delivery only
    return !l.is_local && (l.name.includes('J&T') || l.name.includes('LBC')); // Outside → J&T, LBC only
  });

  // Auto-select first available logistics when city changes
  useEffect(() => {
    if (availableLogistics.length > 0) {
      const currentStillValid = availableLogistics.find(l => String(l.id) === String(selectedLogisticsId));
      if (!currentStillValid) setSelectedLogisticsId(String(availableLogistics[0].id));
    }
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [shippingAddress.city, shippingAddress.province]);

  const setAddr = (field, val) => setShippingAddress(prev => ({ ...prev, [field]: val }));

  const handleApplyVoucher = async () => {
    if (!voucherCode.trim()) return;
    try {
      const res = await axios.post('/api/vouchers/validate', { code: voucherCode });
      setAppliedVoucher(res.data);
      setNotification({ message: `Voucher "${res.data.code}" applied! ✓`, type: 'success' });
    } catch (err) {
      setNotification({ message: err.response?.data?.message || 'Invalid voucher code', type: 'error' });
    }
  };

  const calculateTotal = () => {
    const subtotal = cart.reduce((sum, item) => sum + (parseFloat(item.price) * item.quantity), 0);
    const selected = logisticsOptions.find(l => String(l.id) === String(selectedLogisticsId));
    const shippingFee = selected ? parseFloat(selected.base_cost) : 0;
    let discount = 0;
    if (appliedVoucher) {
      discount = appliedVoucher.type === 'percentage'
        ? subtotal * (appliedVoucher.value / 100)
        : parseFloat(appliedVoucher.value);
      discount = Math.min(discount, subtotal);
    }
    return { subtotal, shippingFee, discount, total: Math.max(0, subtotal - discount + shippingFee) };
  };

  const handlePlaceOrder = async (e) => {
    e?.preventDefault();
    if (cart.length === 0) return;
    if (!shippingAddress.name || !shippingAddress.phone || !shippingAddress.street || !shippingAddress.city || !shippingAddress.province) {
      setNotification({ message: 'Please fill in all required shipping details: Name, Phone, Province, City, and Street.', type: 'error' });
      return;
    }
    if (paymentMethod === 'gcash' && !showGCashModal) { setShowGCashModal(true); return; }
    if (paymentMethod === 'gcash' && !gcashScreenshotFile) {
      setNotification({ message: 'Please upload your GCash receipt screenshot', type: 'error' }); return;
    }
    if (paymentMethod === 'gcash' && !gcashReference) {
      setNotification({ message: 'Please enter the GCash reference number', type: 'error' }); return;
    }

    setLoading(true);
    try {
      const fullStreet = shippingAddress.brgy 
        ? `${shippingAddress.street}, Brgy. ${shippingAddress.brgy}` 
        : shippingAddress.street;

      const addressPayload = {
        name: shippingAddress.name,
        phone: shippingAddress.phone,
        street: fullStreet,
        city: shippingAddress.city,
        state: shippingAddress.province,
        zip: shippingAddress.zip,
        country: 'Philippines'
      };
      const addressRes = await axios.post('/api/addresses', addressPayload);
      const addressId = addressRes.data.id;

      const { total } = calculateTotal();
      const formData = new FormData();
      formData.append('shipping_address_id', addressId);
      formData.append('payment_method', paymentMethod);
      formData.append('logistics_id', selectedLogisticsId);
      if (appliedVoucher) formData.append('voucher_id', appliedVoucher.id);
      formData.append('total_amount', total);
      formData.append('items', JSON.stringify(cart.map(i => ({ sku_id: i.sku_id, quantity: i.quantity }))));
      if (paymentMethod === 'gcash') {
        formData.append('payment_screenshot', gcashScreenshotFile);
        formData.append('gcash_reference', gcashReference);
      }

      const res = await axios.post('/api/orders', formData, { headers: { 'Content-Type': 'multipart/form-data' } });
      localStorage.removeItem('cart');
      window.dispatchEvent(new Event('cartUpdated'));
      setOrderSuccess(res.data);
      setShowGCashModal(false);
    } catch (err) {
      setNotification({ message: err.response?.data?.error || err.response?.data?.message || 'Order placement failed', type: 'error' });
    } finally { setLoading(false); }
  };



  const { subtotal, shippingFee, discount, total } = calculateTotal();
  const selectedCourier = logisticsOptions.find(l => String(l.id) === String(selectedLogisticsId));

  return (
    <div style={{ background: '#FAFAFA', minHeight: '100vh', padding: '40px 20px 60px', fontFamily: "'Inter', sans-serif" }}>
      {notification && <Notification message={notification.message} type={notification.type} onClose={() => setNotification(null)} />}

      <div style={{ maxWidth: '1100px', margin: '0 auto', display: 'grid', gridTemplateColumns: '1fr 380px', gap: '32px' }}>
        
        {/* LEFT COLUMN */}
        <div>
          <div style={{ display: 'flex', alignItems: 'center', gap: '16px', marginBottom: '28px' }}>
             <button onClick={() => navigate(-1)} style={{ background: '#FFF', border: '1px solid #E5E5E5', borderRadius: '50%', width: '40px', height: '40px', display: 'flex', alignItems: 'center', justifyContent: 'center', cursor: 'pointer', transition: 'all 0.2s' }}>
                <i className="fas fa-arrow-left" style={{ color: '#111' }} />
             </button>
             <h2 style={{ fontSize: '28px', fontWeight: '800', margin: 0, letterSpacing: '-1px' }}>Checkout</h2>
          </div>

          {/* Shipping Address */}
          <div style={sectionStyle}>
            <h3 style={{ fontSize: '16px', fontWeight: '800', marginBottom: '20px', display: 'flex', alignItems: 'center', gap: '8px' }}>
              <span style={{ width: '24px', height: '24px', background: '#111', color: '#FFF', borderRadius: '50%', display: 'inline-flex', alignItems: 'center', justifyContent: 'center', fontSize: '12px', fontWeight: '800' }}>1</span>
              Shipping Address
            </h3>

            <div style={{ display: 'grid', gridTemplateColumns: '1fr', gap: '14px' }}>
              <div>
                <label style={labelStyle}>Phone Number</label>
                <input type="tel" placeholder="09XX XXX XXXX" value={shippingAddress.phone} onChange={e => setAddr('phone', e.target.value)} style={inputStyle} required />
              </div>
            </div>

            <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '14px', marginTop: '14px' }}>
              <div>
                <label style={labelStyle}>Province</label>
                <select value={shippingAddress.province} onChange={e => { setAddr('province', e.target.value); setAddr('city', ''); setAddr('brgy', ''); }}
                  style={{ ...inputStyle, background: '#FFF' }}>
                  <option value="">— Select Province —</option>
                  {PROVINCES.map(p => <option key={p} value={p}>{p}</option>)}
                </select>
              </div>

              <div>
                <label style={labelStyle}>City / Municipality</label>
                {isAgusan(shippingAddress.province) ? (
                  <select value={shippingAddress.city} onChange={e => { setAddr('city', e.target.value); setAddr('brgy', ''); }}
                    style={{ ...inputStyle, background: '#FFF' }}>
                    <option value="">— Select City —</option>
                    {AGUSAN_CITIES.map(c => <option key={c} value={c}>{c}</option>)}
                  </select>
                ) : (
                  <input type="text" placeholder="Enter city/municipality" value={shippingAddress.city}
                    onChange={e => setAddr('city', e.target.value)} style={inputStyle} />
                )}
              </div>
            </div>

            <div style={{ marginTop: '14px' }}>
              <label style={labelStyle}>Barangay</label>
              {isButuan(shippingAddress.city) ? (
                <select value={shippingAddress.brgy} onChange={e => setAddr('brgy', e.target.value)}
                  style={{ ...inputStyle, background: '#FFF', padding: '8px 12px', fontSize: '13px', height: '40px' }}>
                  <option value="">— Select Barangay —</option>
                  {BUTUAN_BARANGAYS.map(b => <option key={b} value={b}>{b}</option>)}
                </select>
              ) : (
                <input type="text" placeholder="e.g. Poblacion" value={shippingAddress.brgy} onChange={e => setAddr('brgy', e.target.value)} style={{ ...inputStyle, padding: '8px 12px', fontSize: '13px', height: '40px' }} required />
              )}
            </div>

            <div style={{ marginTop: '14px' }}>
              <label style={labelStyle}>Street / House No.</label>
              <input type="text" placeholder="e.g. 123 Rizal St." value={shippingAddress.street} onChange={e => setAddr('street', e.target.value)} style={inputStyle} required />
            </div>

            <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '14px', marginTop: '14px' }}>
              <div>
                <label style={labelStyle}>ZIP Code</label>
                <input type="text" placeholder="e.g. 8600" value={shippingAddress.zip} onChange={e => setAddr('zip', e.target.value)} style={inputStyle} />
              </div>
              <div>
                <label style={labelStyle}>Country</label>
                <input type="text" value="Philippines" readOnly style={{ ...inputStyle, background: '#F5F5F5', color: '#666', cursor: 'not-allowed' }} />
              </div>
            </div>

            {/* Shipping zone indicator */}
            {shippingAddress.city && (
              <div style={{ marginTop: '14px', padding: '12px 16px', borderRadius: '10px', background: isLocalDelivery ? '#F0FDF4' : '#EFF6FF', border: `1px solid ${isLocalDelivery ? '#BBF7D0' : '#BFDBFE'}`, display: 'flex', alignItems: 'center', gap: '8px' }}>
                <i className={`fas ${isLocalDelivery ? 'fa-location-dot' : 'fa-truck'}`} style={{ color: isLocalDelivery ? '#16A34A' : '#2563EB', fontSize: '14px' }} />
                <span style={{ fontSize: '13px', fontWeight: '600', color: isLocalDelivery ? '#15803D' : '#1D4ED8' }}>
                  {isLocalDelivery ? 'Local delivery area — same-day available!' : 'Outside Butuan — courier shipping applies'}
                </span>
              </div>
            )}
          </div>

          {/* Delivery & Payment */}
          <div style={sectionStyle}>
            <h3 style={{ fontSize: '16px', fontWeight: '800', marginBottom: '20px', display: 'flex', alignItems: 'center', gap: '8px' }}>
              <span style={{ width: '24px', height: '24px', background: '#111', color: '#FFF', borderRadius: '50%', display: 'inline-flex', alignItems: 'center', justifyContent: 'center', fontSize: '12px', fontWeight: '800' }}>2</span>
              Delivery Method
            </h3>

            {availableLogistics.length === 0 ? (
              <p style={{ color: '#999', fontSize: '14px' }}>Please select a city first to see delivery options.</p>
            ) : (
              <div style={{ display: 'grid', gap: '10px' }}>
                {availableLogistics.map(l => (
                  <label key={l.id} style={{
                    display: 'flex', alignItems: 'center', gap: '12px', padding: '14px 16px',
                    borderRadius: '12px', border: String(selectedLogisticsId) === String(l.id) ? '2px solid #111' : '1px solid #E5E5E5',
                    background: String(selectedLogisticsId) === String(l.id) ? '#F9F9F9' : '#FFF', cursor: 'pointer'
                  }}>
                    <input type="radio" name="logistics" value={l.id} checked={String(selectedLogisticsId) === String(l.id)}
                      onChange={() => setSelectedLogisticsId(String(l.id))} style={{ accentColor: '#111' }} />
                    <div style={{ flex: 1 }}>
                      <div style={{ fontWeight: '700', fontSize: '14px' }}>{l.name}</div>
                      <div style={{ fontSize: '12px', color: '#999' }}>{l.is_local ? 'Local delivery · Butuan area' : 'Nationwide courier'}</div>
                    </div>
                    <span style={{ fontWeight: '800', fontSize: '14px' }}>₱{parseFloat(l.base_cost).toFixed(2)}</span>
                  </label>
                ))}
              </div>
            )}

            <h3 style={{ fontSize: '16px', fontWeight: '800', margin: '24px 0 16px', display: 'flex', alignItems: 'center', gap: '8px' }}>
              <span style={{ width: '24px', height: '24px', background: '#111', color: '#FFF', borderRadius: '50%', display: 'inline-flex', alignItems: 'center', justifyContent: 'center', fontSize: '12px', fontWeight: '800' }}>3</span>
              Payment Method
            </h3>
            <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '12px' }}>
              {[
                { value: 'cod', label: 'Cash on Delivery', icon: 'fa-money-bill-wave' },
                { value: 'gcash', label: 'GCash', icon: 'fa-mobile-screen-button' }
              ].map(p => (
                <button key={p.value} type="button" onClick={() => setPaymentMethod(p.value)} style={{
                  padding: '16px', borderRadius: '12px', display: 'flex', alignItems: 'center', gap: '10px',
                  border: paymentMethod === p.value ? '2px solid #111' : '1px solid #E5E5E5',
                  background: paymentMethod === p.value ? '#F9F9F9' : '#FFF', fontWeight: '700', cursor: 'pointer', fontSize: '14px'
                }}>
                  <i className={`fas ${p.icon}`} style={{ fontSize: '18px', color: paymentMethod === p.value ? '#111' : '#CCC' }} />
                  {p.label}
                </button>
              ))}
            </div>
          </div>

          <button onClick={handlePlaceOrder} disabled={loading || !shippingAddress.city || !selectedLogisticsId} style={{
            width: '100%', padding: '18px', borderRadius: '40px', border: 'none',
            background: (!shippingAddress.city || !selectedLogisticsId) ? '#CCC' : '#111',
            color: '#FFF', fontWeight: '700', fontSize: '16px', cursor: (!shippingAddress.city || !selectedLogisticsId) ? 'not-allowed' : 'pointer'
          }}>
            {loading ? 'Processing...' : `Place Order · ₱${total.toFixed(2)}`}
          </button>
        </div>

        {/* RIGHT COLUMN — Order Summary */}
        <div>
          <div style={{ background: '#FFF', padding: '28px', borderRadius: '20px', border: '1px solid #EEE', position: 'sticky', top: '120px' }}>
            <h3 style={{ fontSize: '16px', fontWeight: '800', marginBottom: '20px' }}>Order Summary</h3>

            <div style={{ display: 'grid', gap: '12px', maxHeight: '260px', overflowY: 'auto', marginBottom: '20px', paddingRight: '4px' }}>
              {cart.map((item, idx) => (
                <div key={idx} style={{ display: 'flex', gap: '10px', alignItems: 'center' }}>
                  <div style={{ width: '44px', height: '44px', borderRadius: '8px', background: '#F5F5F5', overflow: 'hidden', flexShrink: 0 }}>
                    <img src={item.image ? buildApiAssetUrl(`/storage/${item.image}`) : ''} alt="" style={{ width: '100%', height: '100%', objectFit: 'cover' }} />
                  </div>
                  <div style={{ flex: 1, minWidth: 0 }}>
                    <p style={{ margin: 0, fontSize: '13px', fontWeight: '600', overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>{item.name}</p>
                    <p style={{ margin: 0, fontSize: '11px', color: '#999' }}>Size {item.size} · Qty {item.quantity}</p>
                  </div>
                  <span style={{ fontSize: '13px', fontWeight: '700', flexShrink: 0 }}>₱{(item.price * item.quantity).toFixed(2)}</span>
                </div>
              ))}
            </div>

            {/* Voucher */}
            <div style={{ display: 'flex', gap: '8px', marginBottom: '20px', padding: '12px', background: '#F9F9F9', borderRadius: '12px' }}>
              <input type="text" placeholder="Promo Code" value={voucherCode}
                onChange={e => setVoucherCode(e.target.value.toUpperCase())}
                style={{ flex: 1, padding: '10px 12px', border: '1px solid #E5E5E5', borderRadius: '8px', background: '#FFF', fontSize: '13px' }} />
              <button type="button" onClick={handleApplyVoucher}
                style={{ background: '#111', color: '#FFF', border: 'none', padding: '0 16px', borderRadius: '8px', fontWeight: '700', cursor: 'pointer', fontSize: '13px' }}>
                Apply
              </button>
            </div>
            {appliedVoucher && (
              <div style={{ fontSize: '12px', color: '#16A34A', fontWeight: '600', marginBottom: '12px', padding: '8px 12px', background: '#F0FDF4', borderRadius: '8px' }}>
                ✓ "{appliedVoucher.code}" — {appliedVoucher.type === 'percentage' ? `${appliedVoucher.value}% off` : `₱${appliedVoucher.value} off`}
              </div>
            )}

            {/* Totals */}
            <div style={{ display: 'grid', gap: '10px', fontSize: '14px', borderTop: '1px solid #F0F0F0', paddingTop: '16px' }}>
              <div style={{ display: 'flex', justifyContent: 'space-between', color: '#666' }}>
                <span>Subtotal</span><span>₱{subtotal.toFixed(2)}</span>
              </div>
              <div style={{ display: 'flex', justifyContent: 'space-between', color: '#666' }}>
                <span>Shipping ({selectedCourier?.name || '—'})</span>
                <span>₱{shippingFee.toFixed(2)}</span>
              </div>
              {discount > 0 && (
                <div style={{ display: 'flex', justifyContent: 'space-between', color: '#16A34A', fontWeight: '600' }}>
                  <span>Discount</span><span>-₱{discount.toFixed(2)}</span>
                </div>
              )}
              <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: '20px', fontWeight: '800', borderTop: '2px solid #F0F0F0', paddingTop: '16px', marginTop: '4px' }}>
                <span>Total</span><span>₱{total.toFixed(2)}</span>
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* GCash Modal */}
      {showGCashModal && (
        <div style={{ position: 'fixed', inset: 0, background: 'rgba(0,0,0,0.6)', backdropFilter: 'blur(4px)', display: 'flex', alignItems: 'center', justifyContent: 'center', zIndex: 2000, padding: '20px' }}>
          <div style={{ background: '#FFF', padding: '36px', borderRadius: '28px', maxWidth: '460px', width: '100%' }}>
            <h3 style={{ fontSize: '22px', fontWeight: '800', marginBottom: '8px' }}>GCash Payment</h3>
            <p style={{ color: '#666', fontSize: '14px', marginBottom: '24px' }}>
              Send <strong style={{ color: '#111', fontSize: '18px' }}>₱{total.toFixed(2)}</strong> to GCash:<br />
              <strong style={{ fontSize: '20px', letterSpacing: '2px' }}>0912 345 6789</strong>
            </p>
            <div style={{ marginBottom: '16px' }}>
              <label style={labelStyle}>GCash Reference Number</label>
              <input type="text" placeholder="13-digit reference number" value={gcashReference}
                onChange={e => setGCashReference(e.target.value)}
                style={inputStyle} />
            </div>
            <div style={{ marginBottom: '24px' }}>
              <label style={labelStyle}>Upload Receipt Screenshot</label>
              <input type="file" accept="image/*" onChange={e => setGCashScreenshotFile(e.target.files[0])} style={{ width: '100%' }} />
            </div>
            <div style={{ display: 'flex', gap: '12px' }}>
              <button onClick={() => setShowGCashModal(false)} style={{ flex: 1, padding: '14px', borderRadius: '30px', border: '1px solid #E5E5E5', background: '#FFF', fontWeight: '600', cursor: 'pointer' }}>Cancel</button>
              <button onClick={handlePlaceOrder} disabled={loading} style={{ flex: 1, padding: '14px', borderRadius: '30px', border: 'none', background: '#111', color: '#FFF', fontWeight: '700', cursor: 'pointer' }}>
                {loading ? 'Processing...' : 'Confirm Payment'}
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Order Success Modal */}
      {orderSuccess && (
        <div style={{ position: 'fixed', inset: 0, background: 'rgba(0,0,0,0.6)', backdropFilter: 'blur(4px)', display: 'flex', alignItems: 'center', justifyContent: 'center', zIndex: 3000, padding: '20px' }}>
          <div style={{ background: '#FFF', padding: '60px', borderRadius: '32px', border: '1px solid #EEE', textAlign: 'center', maxWidth: '600px', width: '100%', animation: 'fadeIn 0.3s ease-out', position: 'relative' }}>
            <button onClick={() => setOrderSuccess(null)} style={{ position: 'absolute', top: '24px', right: '24px', background: 'transparent', border: 'none', fontSize: '20px', cursor: 'pointer', color: '#999', width: '32px', height: '32px', display: 'flex', alignItems: 'center', justifyContent: 'center', borderRadius: '50%', transition: 'background 0.2s' }}>
               <i className="fas fa-times" />
            </button>
            <div style={{ width: '72px', height: '72px', background: '#F0FDF4', borderRadius: '50%', display: 'flex', alignItems: 'center', justifyContent: 'center', margin: '0 auto 24px' }}>
              <i className="fas fa-check" style={{ color: '#16a34a', fontSize: '28px' }} />
            </div>
            <h1 style={{ fontSize: '28px', fontWeight: '800', marginBottom: '12px' }}>Order Confirmed!</h1>
            <p style={{ color: '#666', marginBottom: '8px' }}>Order ID: <strong>#{orderSuccess.id}</strong></p>
            <p style={{ color: '#666', fontSize: '14px' }}>We'll notify you once your order is picked up by the courier.</p>
            <div style={{ display: 'flex', gap: '12px', justifyContent: 'center', marginTop: '32px' }}>
              <button onClick={() => navigate('/customer-dashboard?tab=tracking')} style={{ background: '#111', color: '#FFF', border: 'none', padding: '14px 28px', borderRadius: '30px', fontWeight: '600', cursor: 'pointer' }}>Track Order</button>
              <button onClick={() => navigate('/products')} style={{ background: '#FFF', color: '#111', border: '1px solid #E5E5E5', padding: '14px 28px', borderRadius: '30px', fontWeight: '600', cursor: 'pointer' }}>Shop More</button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default Checkout;
