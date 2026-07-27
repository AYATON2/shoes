import React, { useState, useEffect } from 'react';
import axios from 'axios';
import './SalesManager.css';
import { formatDate } from '../utils/format';

const SalesManager = ({ productId = null, products = [] }) => {
  const [activeTab, setActiveTab] = useState('sales');
  const [sales, setSales] = useState([]);
  const [vouchers, setVouchers] = useState([]);
  const [notification, setNotification] = useState(null);
  const [showForm, setShowForm] = useState(false);
  
  // Sale Form Data
  const [editingSale, setEditingSale] = useState(null);
  const showNotification = (message, type = 'success') => {
    setNotification({ message, type });
    setTimeout(() => setNotification(null), 3000);
  };
  const [saleFormData, setSaleFormData] = useState({
    title: '',
    description: '',
    discount_amount: '',
    discount_percentage: '',
    start_date: '',
    end_date: '',
    sale_type: 'store-wide'
  });

  // Voucher Form Data
  const [editingVoucher, setEditingVoucher] = useState(null);
  const [voucherFormData, setVoucherFormData] = useState({
    code: '',
    type: 'fixed',
    value: '',
    min_spend: '0',
    expires_at: ''
  });

  useEffect(() => {
    fetchSales();
    fetchVouchers();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  const fetchSales = async () => {
    try {
      const response = await axios.get('/api/sales');
      setSales(response.data.data || response.data);
    } catch (error) {
      console.error('Error fetching sales:', error);
      showNotification('Error loading sales', 'error');
    }
  };

  const fetchVouchers = async () => {
    try {
      const response = await axios.get('/api/vouchers');
      setVouchers(response.data);
    } catch (error) {
      console.error('Error fetching vouchers:', error);
    }
  };

  const handleSaleSubmit = async (e) => {
    e.preventDefault();
    if (!saleFormData.discount_amount && !saleFormData.discount_percentage) {
      showNotification('Please enter either a fixed discount or percentage discount', 'error');
      return;
    }
    try {
      const payload = { ...saleFormData, product_id: productId };
      if (payload.discount_amount === '') payload.discount_amount = null;
      if (payload.discount_percentage === '') payload.discount_percentage = null;
      
      if (editingSale) {
        await axios.put(`/api/sales/${editingSale.id}`, payload);
        showNotification('Sale updated!', 'success');
      } else {
        await axios.post('/api/sales', payload);
        showNotification('Sale created!', 'success');
      }
      fetchSales();
      resetSaleForm();
    } catch (error) {
      showNotification(error.response?.data?.message || 'Error saving sale', 'error');
    }
  };

  const handleVoucherSubmit = async (e) => {
    e.preventDefault();
    try {
      if (editingVoucher) {
        await axios.put(`/api/vouchers/${editingVoucher.id}`, voucherFormData);
        showNotification('Voucher updated!', 'success');
      } else {
        await axios.post('/api/vouchers', voucherFormData);
        showNotification('Voucher created!', 'success');
      }
      fetchVouchers();
      resetVoucherForm();
    } catch (error) {
      showNotification('Error saving voucher. Code might already exist.', 'error');
    }
  };

  const handleSaleDelete = async (id) => {
    if (window.confirm('Delete this sale?')) {
      await axios.delete(`/api/sales/${id}`);
      showNotification('Sale deleted');
      fetchSales();
    }
  };

  const handleVoucherDelete = async (id) => {
    if (window.confirm('Delete this voucher?')) {
      await axios.delete(`/api/vouchers/${id}`);
      showNotification('Voucher deleted');
      fetchVouchers();
    }
  };

  const resetSaleForm = () => {
    setSaleFormData({ title: '', description: '', discount_amount: '', discount_percentage: '', start_date: '', end_date: '', sale_type: 'store-wide' });
    setEditingSale(null);
    setShowForm(false);
  };

  const resetVoucherForm = () => {
    setVoucherFormData({ code: '', type: 'fixed', value: '', min_spend: '0', expires_at: '' });
    setEditingVoucher(null);
    setShowForm(false);
  };

  const handleSaleToggle = async (id) => {
    try {
      await axios.patch(`/api/sales/${id}/toggle`);
      showNotification('Sale status updated');
      fetchSales();
    } catch (error) {
      showNotification('Failed to toggle sale', 'error');
    }
  };

  const inputStyle = { width: '100%', padding: '12px 14px', border: '1.5px solid #e2e8f0', borderRadius: 12, fontSize: 14, fontFamily: 'Outfit, sans-serif', outline: 'none', boxSizing: 'border-box', transition: 'border-color 0.2s' };
  const labelStyle = { fontSize: 13, fontWeight: 700, color: '#1e293b', display: 'block', marginBottom: 8, textTransform: 'uppercase', letterSpacing: '0.5px' };

  return (
    <div style={{ fontFamily: 'Outfit, sans-serif', animation: 'fadeIn 0.5s ease' }}>
      <style>{`
        @keyframes fadeIn { from { opacity: 0; transform: translateY(10px); } to { opacity: 1; transform: translateY(0); } }
        .promo-card:hover { border-color: #6366f1 !important; transform: translateY(-2px); }
        .toggle-btn { position: relative; width: 44px; height: 22px; background: #cbd5e1; border-radius: 20px; border: none; cursor: pointer; transition: 0.3s; padding: 0; }
        .toggle-btn.active { background: #16a34a; }
        .toggle-knob { position: absolute; top: 3px; left: 3px; width: 16px; height: 16px; background: #fff; border-radius: 50%; transition: 0.3s; }
        .toggle-btn.active .toggle-knob { left: 25px; }
      `}</style>

      {notification && (
        <div style={{ position: 'fixed', top: 24, right: 24, zIndex: 9999, background: notification.type === 'error' ? '#fee2e2' : '#dcfce7', color: notification.type === 'error' ? '#dc2626' : '#15803d', border: `1.5px solid ${notification.type === 'error' ? '#fca5a5' : '#86efac'}`, borderRadius: 12, padding: '16px 24px', fontSize: 14, fontWeight: 700, boxShadow: '0 10px 30px rgba(0,0,0,0.1)' }}>
          <i className={`fas ${notification.type === 'error' ? 'fa-circle-exclamation' : 'fa-circle-check'}`} style={{ marginRight: 10 }} />
          {notification.message}
        </div>
      )}

      <div style={{ marginBottom: 40, display: 'flex', justifyContent: 'space-between', alignItems: 'flex-end' }}>
        <div>
          <h2 style={{ fontSize: 28, fontWeight: 900, color: '#0f172a', margin: 0, letterSpacing: '-0.5px' }}>Store Promotions</h2>
          <p style={{ color: '#64748b', margin: '8px 0 0', fontSize: 15 }}>Drive more sales with limited-time offers and reward vouchers.</p>
        </div>
        <div style={{ display: 'flex', background: '#f1f5f9', padding: 5, borderRadius: 14 }}>
          <button onClick={() => { setActiveTab('sales'); setShowForm(false); }} style={{ padding: '10px 24px', border: 'none', borderRadius: 10, cursor: 'pointer', fontSize: 14, fontWeight: 700, transition: '0.2s', background: activeTab === 'sales' ? '#fff' : 'transparent', color: activeTab === 'sales' ? '#6366f1' : '#64748b', boxShadow: activeTab === 'sales' ? '0 4px 12px rgba(99,102,241,0.1)' : 'none' }}>Active Sales</button>
          <button onClick={() => { setActiveTab('vouchers'); setShowForm(false); }} style={{ padding: '10px 24px', border: 'none', borderRadius: 10, cursor: 'pointer', fontSize: 14, fontWeight: 700, transition: '0.2s', background: activeTab === 'vouchers' ? '#fff' : 'transparent', color: activeTab === 'vouchers' ? '#6366f1' : '#64748b', boxShadow: activeTab === 'vouchers' ? '0 4px 12px rgba(99,102,241,0.1)' : 'none' }}>Discount Vouchers</button>
        </div>
      </div>

      <div style={{ display: 'grid', gridTemplateColumns: '1fr', gap: 24 }}>
        {!showForm ? (
          <div style={{ textAlign: 'right', marginBottom: 12 }}>
            <button onClick={() => setShowForm(true)} style={{ background: '#6366f1', color: '#fff', border: 'none', borderRadius: 12, padding: '14px 32px', fontWeight: 800, cursor: 'pointer', fontSize: 15, boxShadow: '0 8px 20px rgba(99,102,241,0.2)', transition: '0.2s' }} onMouseEnter={e=>e.currentTarget.style.transform='translateY(-2px)'} onMouseLeave={e=>e.currentTarget.style.transform='translateY(0)'}>
              <i className="fas fa-plus" style={{ marginRight: 10 }} /> Create {activeTab === 'sales' ? 'Sale' : 'Voucher'}
            </button>
          </div>
        ) : (
          <div style={{ background: '#fff', borderRadius: 24, border: '1px solid #e2e8f0', padding: 40, boxShadow: '0 20px 40px rgba(0,0,0,0.05)', marginBottom: 30 }}>
            <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: 32 }}>
              <h3 style={{ margin: 0, fontSize: 22, fontWeight: 900, letterSpacing: '-0.5px' }}>{editingSale || editingVoucher ? 'Edit' : 'Create'} {activeTab === 'sales' ? 'Seasonal Sale' : 'New Voucher'}</h3>
              <button onClick={() => activeTab === 'sales' ? resetSaleForm() : resetVoucherForm()} style={{ background: '#f8fafc', border: '1px solid #e2e8f0', color: '#64748b', cursor: 'pointer', fontWeight: 700, padding: '8px 16px', borderRadius: 10 }}>Cancel</button>
            </div>
            
            {activeTab === 'sales' ? (
              <form onSubmit={handleSaleSubmit} style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 24 }}>
                <div style={{ gridColumn: 'span 2' }}>
                  <label style={labelStyle}>Sale Campaign Name</label>
                  <input style={inputStyle} value={saleFormData.title} onChange={e => setSaleFormData({...saleFormData, title: e.target.value})} placeholder="e.g. Summer Kick-off Sale" required />
                </div>
                <div>
                  <label style={labelStyle}>Fixed Discount (₱)</label>
                  <input type="number" style={inputStyle} value={saleFormData.discount_amount} onChange={e => setSaleFormData({...saleFormData, discount_amount: e.target.value})} placeholder="0.00" />
                </div>
                <div>
                  <label style={labelStyle}>Percentage (%)</label>
                  <input type="number" style={inputStyle} value={saleFormData.discount_percentage} onChange={e => setSaleFormData({...saleFormData, discount_percentage: e.target.value})} placeholder="0" />
                </div>
                <div>
                  <label style={labelStyle}>Launch Date</label>
                  <input type="date" style={inputStyle} value={saleFormData.start_date} onChange={e => setSaleFormData({...saleFormData, start_date: e.target.value})} required />
                </div>
                <div>
                  <label style={labelStyle}>End Date</label>
                  <input type="date" style={inputStyle} value={saleFormData.end_date} onChange={e => setSaleFormData({...saleFormData, end_date: e.target.value})} required />
                </div>
                <div style={{ gridColumn: 'span 2' }}>
                  <button type="submit" style={{ width: '100%', padding: 18, background: '#6366f1', color: '#fff', border: 'none', borderRadius: 14, fontWeight: 800, cursor: 'pointer', fontSize: 16, boxShadow: '0 10px 20px rgba(99,102,241,0.2)' }}>
                    {editingSale ? 'Update Campaign' : 'Launch Campaign'}
                  </button>
                </div>
              </form>
            ) : (
              <form onSubmit={handleVoucherSubmit} style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 24 }}>
                <div>
                  <label style={labelStyle}>Voucher Code</label>
                  <input style={{ ...inputStyle, textTransform: 'uppercase', fontWeight: 800, letterSpacing: 1.5, background: '#f8fafc' }} value={voucherFormData.code} onChange={e => setVoucherFormData({...voucherFormData, code: e.target.value.toUpperCase()})} placeholder="e.g. NIKE2024" required />
                </div>
                <div>
                  <label style={labelStyle}>Reward Type</label>
                  <select style={inputStyle} value={voucherFormData.type} onChange={e => setVoucherFormData({...voucherFormData, type: e.target.value})}>
                    <option value="fixed">Flat Amount Discount (₱)</option>
                    <option value="percentage">Percentage Discount (%)</option>
                  </select>
                </div>
                <div>
                  <label style={labelStyle}>Benefit Value</label>
                  <input type="number" style={inputStyle} value={voucherFormData.value} onChange={e => setVoucherFormData({...voucherFormData, value: e.target.value})} required />
                </div>
                <div>
                  <label style={labelStyle}>Minimum Basket (₱)</label>
                  <input type="number" style={inputStyle} value={voucherFormData.min_spend} onChange={e => setVoucherFormData({...voucherFormData, min_spend: e.target.value})} required />
                </div>
                <div style={{ gridColumn: 'span 2' }}>
                  <label style={labelStyle}>Expiration (Optional)</label>
                  <input type="date" style={inputStyle} value={voucherFormData.expires_at} onChange={e => setVoucherFormData({...voucherFormData, expires_at: e.target.value})} />
                </div>
                <div style={{ gridColumn: 'span 2' }}>
                  <button type="submit" style={{ width: '100%', padding: 18, background: '#0f172a', color: '#fff', border: 'none', borderRadius: 14, fontWeight: 800, cursor: 'pointer', fontSize: 16 }}>
                    {editingVoucher ? 'Save Changes' : 'Create Voucher'}
                  </button>
                </div>
              </form>
            )}
          </div>
        )}

        {/* List Section */}
        <div style={{ background: '#fff', borderRadius: 24, border: '1px solid #e2e8f0', overflow: 'hidden', boxShadow: '0 4px 20px rgba(0,0,0,0.02)' }}>
          <table style={{ width: '100%', borderCollapse: 'collapse' }}>
            <thead>
              <tr style={{ background: '#f8fafc', borderBottom: '1px solid #f1f5f9' }}>
                {activeTab === 'sales' ? (
                  <>
                    <th style={{ padding: '20px 24px', textAlign: 'left', fontSize: 11, color: '#64748b', textTransform: 'uppercase', letterSpacing: 1.5, fontWeight: 800 }}>Campaign</th>
                    <th style={{ padding: '20px 24px', textAlign: 'left', fontSize: 11, color: '#64748b', textTransform: 'uppercase', letterSpacing: 1.5, fontWeight: 800 }}>Benefit</th>
                    <th style={{ padding: '20px 24px', textAlign: 'left', fontSize: 11, color: '#64748b', textTransform: 'uppercase', letterSpacing: 1.5, fontWeight: 800 }}>Schedule</th>
                    <th style={{ padding: '20px 24px', textAlign: 'center', fontSize: 11, color: '#64748b', textTransform: 'uppercase', letterSpacing: 1.5, fontWeight: 800 }}>Status</th>
                  </>
                ) : (
                  <>
                    <th style={{ padding: '20px 24px', textAlign: 'left', fontSize: 11, color: '#64748b', textTransform: 'uppercase', letterSpacing: 1.5, fontWeight: 800 }}>Voucher</th>
                    <th style={{ padding: '20px 24px', textAlign: 'left', fontSize: 11, color: '#64748b', textTransform: 'uppercase', letterSpacing: 1.5, fontWeight: 800 }}>Value</th>
                    <th style={{ padding: '20px 24px', textAlign: 'left', fontSize: 11, color: '#64748b', textTransform: 'uppercase', letterSpacing: 1.5, fontWeight: 800 }}>Threshold</th>
                  </>
                )}
                <th style={{ padding: '20px 24px', textAlign: 'right', fontSize: 11, color: '#64748b', textTransform: 'uppercase', letterSpacing: 1.5, fontWeight: 800 }}>Manage</th>
              </tr>
            </thead>
            <tbody>
              {activeTab === 'sales' ? sales.map(s => (
                <tr key={s.id} style={{ borderBottom: '1px solid #f1f5f9', transition: 'background 0.2s' }} onMouseEnter={e=>e.currentTarget.style.background='#fafafa'} onMouseLeave={e=>e.currentTarget.style.background='transparent'}>
                  <td style={{ padding: '20px 24px' }}>
                    <div style={{ fontSize: 15, fontWeight: 800, color: '#0f172a' }}>{s.title}</div>
                    <div style={{ fontSize: 12, color: '#94a3b8', marginTop: 4 }}>Store-wide promotion</div>
                  </td>
                  <td style={{ padding: '20px 24px' }}>
                    <span style={{ fontSize: 16, color: '#16a34a', fontWeight: 900 }}>{s.discount_percentage ? `${s.discount_percentage}%` : `₱${s.discount_amount}`}</span>
                    <span style={{ fontSize: 11, color: '#94a3b8', marginLeft: 6, fontWeight: 700 }}>OFF</span>
                  </td>
                  <td style={{ padding: '20px 24px', fontSize: 13, color: '#475569', fontWeight: 600 }}>
                    <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
                      <i className="far fa-calendar-alt" style={{ color: '#94a3b8' }} />
                      {formatDate(s.start_date)} - {formatDate(s.end_date)}
                    </div>
                  </td>
                  <td style={{ padding: '20px 24px', textAlign: 'center' }}>
                    <button 
                      onClick={() => handleSaleToggle(s.id)}
                      className={`toggle-btn ${s.is_active ? 'active' : ''}`}
                    >
                      <div className="toggle-knob" />
                    </button>
                    <div style={{ fontSize: 10, color: s.is_active ? '#16a34a' : '#94a3b8', fontWeight: 800, marginTop: 4 }}>{s.is_active ? 'LIVE' : 'PAUSED'}</div>
                  </td>
                  <td style={{ padding: '20px 24px', textAlign: 'right' }}>
                    <button onClick={() => handleSaleDelete(s.id)} style={{ background: '#fff5f5', border: 'none', color: '#ef4444', cursor: 'pointer', padding: '8px 12px', borderRadius: 8, fontSize: 12, fontWeight: 700 }}>
                      <i className="fas fa-trash-can" />
                    </button>
                  </td>
                </tr>
              )) : vouchers.map(v => (
                <tr key={v.id} style={{ borderBottom: '1px solid #f1f5f9' }} onMouseEnter={e=>e.currentTarget.style.background='#fafafa'} onMouseLeave={e=>e.currentTarget.style.background='transparent'}>
                  <td style={{ padding: '20px 24px' }}>
                    <span style={{ background: '#6366f1', color: '#fff', padding: '6px 14px', borderRadius: 8, fontSize: 14, fontWeight: 900, letterSpacing: 1 }}>{v.code}</span>
                  </td>
                  <td style={{ padding: '20px 24px', fontSize: 16, color: '#6366f1', fontWeight: 900 }}>{v.type === 'percentage' ? `${v.value}%` : `₱${v.value}`}</td>
                  <td style={{ padding: '20px 24px', fontSize: 14, color: '#475569', fontWeight: 600 }}>Min. ₱{v.min_spend}</td>
                  <td style={{ padding: '20px 24px', textAlign: 'right' }}>
                    <button onClick={() => handleVoucherDelete(v.id)} style={{ background: '#fff5f5', border: 'none', color: '#ef4444', cursor: 'pointer', padding: '8px 12px', borderRadius: 8, fontSize: 12, fontWeight: 700 }}>
                      <i className="fas fa-trash-can" />
                    </button>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
          {(activeTab === 'sales' ? sales.length : vouchers.length) === 0 && (
            <div style={{ padding: 80, textAlign: 'center' }}>
              <div style={{ width: 64, height: 64, background: '#f1f5f9', borderRadius: '50%', display: 'flex', alignItems: 'center', justifyContent: 'center', margin: '0 auto 16px' }}>
                <i className={`fas ${activeTab === 'sales' ? 'fa-tag' : 'fa-ticket'}`} style={{ fontSize: 24, color: '#94a3b8' }} />
              </div>
              <p style={{ color: '#64748b', fontSize: 16, fontWeight: 600 }}>No {activeTab} running yet.</p>
              <p style={{ color: '#94a3b8', fontSize: 14, marginTop: 4 }}>Click the button above to launch your first promotion.</p>
            </div>
          )}
        </div>
      </div>
    </div>
  );
};

export default SalesManager;
