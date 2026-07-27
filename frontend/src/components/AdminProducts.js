
import React, { useState, useEffect, useCallback } from 'react';
import { useNavigate } from 'react-router-dom';
import axios from 'axios';
import { buildApiAssetUrl } from '../utils/apiUrl';
import SalesManager from './SalesManager';


const EMPTY_FORM = {
  name: '', description: '', brand: '', type: '', price: '', gender: 'Unisex',
  image: null, imagePreview: null, skus: []
};
const EMPTY_SKU = { size: '', color: '', width: '', stock: '' };

const AdminProducts = () => {
  const [products, setProducts] = useState([]);
  const [showForm, setShowForm] = useState(false);
  const [editingProduct, setEditingProduct] = useState(null);
  const [formData, setFormData] = useState(EMPTY_FORM);
  const [newSku, setNewSku] = useState(EMPTY_SKU);
  const [loading, setLoading] = useState(false);
  const [toast, setToast] = useState(null);
  const [search, setSearch] = useState('');
  const [viewMode, setViewMode] = useState('active'); // active, archived
  const navigate = useNavigate();

  const showToast = useCallback((msg, type = 'success') => {
    setToast({ msg, type });
    setTimeout(() => setToast(null), 3000);
  }, []);

  const fetchProducts = useCallback(() => {
    const params = viewMode === 'archived' ? '?only_archived=true&limit=1000' : '?limit=1000';
    axios.get(`/api/products${params}`).then(res => setProducts(res.data.data || [])).catch(err => {
      if (err.response?.status === 401) {
        navigate('/login');
      } else {
        console.error('Failed to fetch products:', err);
        showToast('Failed to load products', 'error');
      }
    });
  }, [navigate, viewMode, showToast]);

  useEffect(() => { fetchProducts(); }, [fetchProducts]);

  const handleArchive = (productId, archive = true) => {
    const action = archive ? 'archive' : 'unarchive';
    axios.patch(`/api/products/${productId}/${action}`).then(() => {
      showToast(`Product ${archive ? 'archived' : 'restored'}`);
      fetchProducts();
    }).catch(err => {
      console.error(`Failed to ${action} product:`, err);
      showToast(err.response?.data?.message || `Failed to ${action} product`, 'error');
    });
  };

  const handleDelete = (productId) => {
    if (!window.confirm('Permanently delete this product?')) return;
    axios.delete(`/api/products/${productId}`).then(() => {
      showToast('Product deleted');
      fetchProducts();
    }).catch(err => {
      console.error('Failed to delete product:', err);
      showToast(err.response?.data?.message || 'Failed to delete product', 'error');
    });
  };

  const handleAddSku = () => {
    if (!newSku.size || !newSku.color || !newSku.stock) return;
    const sizes = String(newSku.size).split(',').map(s => s.trim()).filter(s => s);
    const newSkus = sizes.map(size => ({ ...newSku, size, stock: parseInt(newSku.stock) }));
    setFormData(f => ({ ...f, skus: [...f.skus, ...newSkus] }));
    setNewSku(EMPTY_SKU);
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setLoading(true);
    const data = new FormData();
    ['name', 'description', 'brand', 'type', 'gender'].forEach(k => data.append(k, formData[k]));
    data.append('price', parseFloat(formData.price));
    if (formData.image) data.append('image', formData.image);
    data.append('skus', JSON.stringify(formData.skus));
    if (editingProduct) data.append('_method', 'PUT');

    const url = editingProduct ? `/api/products/${editingProduct.id}` : '/api/products';
    try {
      await axios.post(url, data, { headers: { 'Content-Type': 'multipart/form-data' } });
      showToast(editingProduct ? 'Product updated' : 'Product added');
      setShowForm(false); setEditingProduct(null); setFormData(EMPTY_FORM);
      fetchProducts();
    } catch (err) {
      showToast('Failed to save product', 'error');
    } finally {
      setLoading(false);
    }
  };

  const filtered = products.filter(p =>
    p.name?.toLowerCase().includes(search.toLowerCase()) ||
    p.brand?.toLowerCase().includes(search.toLowerCase())
  );

  const [promotingProduct, setPromotingProduct] = useState(null);

  return (
    <div style={{ fontFamily: "'Outfit', sans-serif", animation: 'fadeIn 0.3s ease' }}>
      <style>{`
        @keyframes fadeIn { from { opacity: 0; transform: translateY(10px); } to { opacity: 1; transform: translateY(0); } }
        .p-card { transition: all 0.3s ease; }
        .p-card:hover { border-color: #111; transform: translateY(-4px); box-shadow: 0 12px 30px rgba(0,0,0,0.08); }
        .modal-overlay { position: fixed; top: 0; left: 0; width: 100%; height: 100%; background: rgba(0,0,0,0.7); display: flex; align-items: center; justifyContent: center; z-index: 3000; backdrop-filter: blur(4px); }
        .modal-content { background: #FFF; width: 90%; max-width: 900px; max-height: 90vh; overflow-y: auto; border-radius: 32px; padding: 40px; position: relative; }
      `}</style>

      {promotingProduct && (
        <div className="modal-overlay" onClick={() => setPromotingProduct(null)}>
          <div className="modal-content" onClick={e => e.stopPropagation()}>
            <button onClick={() => setPromotingProduct(null)} style={{ position: 'absolute', top: '24px', right: '24px', background: '#F1F5F9', border: 'none', width: '40px', height: '40px', borderRadius: '50%', cursor: 'pointer', fontSize: '18px', fontWeight: '800' }}>&times;</button>
            <div style={{ marginBottom: '24px' }}>
               <h2 style={{ fontSize: '24px', fontWeight: '900', margin: 0 }}>Promote: {promotingProduct.name}</h2>
               <p style={{ color: '#64748B', margin: '4px 0 0' }}>Launch a dedicated sale campaign for this item.</p>
            </div>
            <div style={{ background: '#F8FAFC', padding: '24px', borderRadius: '20px' }}>
               <SalesManager productId={promotingProduct.id} />
            </div>
          </div>
        </div>
      )}

      {toast && (
        <div style={{ position: 'fixed', top: 24, right: 24, zIndex: 4000, background: '#111', color: '#FFF', padding: '16px 32px', borderRadius: '16px', fontWeight: '700', boxShadow: '0 10px 20px rgba(0,0,0,0.2)' }}>
          {toast.msg}
        </div>
      )}

      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-end', marginBottom: '40px' }}>
        <div>
          <h1 style={{ fontSize: '32px', fontWeight: '900', margin: 0, letterSpacing: '-1.5px', color: '#0F172A' }}>Product Catalog</h1>
          <p style={{ color: '#64748B', margin: '8px 0 0', fontSize: '16px' }}>Manage inventory, variants, and product-specific promotions.</p>
        </div>
        {!showForm && (
          <button onClick={() => setShowForm(true)} style={{ background: '#111', color: '#FFF', border: 'none', padding: '14px 32px', borderRadius: '40px', fontWeight: '800', cursor: 'pointer', fontSize: '15px', boxShadow: '0 8px 20px rgba(0,0,0,0.1)' }}>
             <i className="fas fa-plus" style={{ marginRight: '10px' }} /> Add New Product
          </button>
        )}
      </div>

      {!showForm ? (
        <>
          <div style={{ display: 'flex', gap: '16px', marginBottom: '32px', alignItems: 'center' }}>
             <div style={{ flex: 1, position: 'relative' }}>
               <i className="fas fa-search" style={{ position: 'absolute', left: '20px', top: '50%', transform: 'translateY(-50%)', color: '#94A3B8' }} />
               <input type="text" placeholder="Search by name, brand, or model..." value={search} onChange={e => setSearch(e.target.value)} style={{ width: '100%', padding: '14px 52px', borderRadius: '16px', border: '1px solid #E2E8F0', background: '#FFF', fontSize: '15px', outline: 'none' }} />
             </div>
             <div style={{ display: 'flex', background: '#F1F5F9', padding: '5px', borderRadius: '16px' }}>
                <button onClick={() => setViewMode('active')} style={{ padding: '10px 24px', borderRadius: '12px', border: 'none', background: viewMode === 'active' ? '#FFF' : 'transparent', fontWeight: '700', color: viewMode === 'active' ? '#111' : '#64748B', cursor: 'pointer', boxShadow: viewMode === 'active' ? '0 2px 8px rgba(0,0,0,0.05)' : 'none' }}>Active</button>
                <button onClick={() => setViewMode('archived')} style={{ padding: '10px 24px', borderRadius: '12px', border: 'none', background: viewMode === 'archived' ? '#FFF' : 'transparent', fontWeight: '700', color: viewMode === 'archived' ? '#111' : '#64748B', cursor: 'pointer', boxShadow: viewMode === 'archived' ? '0 2px 8px rgba(0,0,0,0.05)' : 'none' }}>Archived</button>
             </div>
          </div>

          <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(300px, 1fr))', gap: '32px' }}>
            {filtered.map(p => (
              <div key={p.id} className="p-card" style={{ background: '#FFF', borderRadius: '28px', border: '1px solid #E2E8F0', overflow: 'hidden', position: 'relative' }}>
                <div style={{ height: '220px', background: '#F8FAFC', position: 'relative' }}>
                  <img src={p.image ? buildApiAssetUrl(`/storage/${p.image}`) : ''} alt="" style={{ width: '100%', height: '100%', objectFit: 'cover' }} />
                  {p.is_archived && <div style={{ position: 'absolute', top: '16px', right: '16px', background: '#EF4444', color: '#FFF', padding: '6px 14px', borderRadius: '20px', fontSize: '11px', fontWeight: '900', letterSpacing: '0.5px' }}>ARCHIVED</div>}
                  {p.sales && p.sales.length > 0 && <div style={{ position: 'absolute', top: '16px', left: '16px', background: '#10B981', color: '#FFF', padding: '6px 14px', borderRadius: '20px', fontSize: '11px', fontWeight: '900', letterSpacing: '0.5px' }}>ON SALE</div>}
                </div>
                <div style={{ padding: '24px' }}>
                  <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '8px' }}>
                    <span style={{ fontSize: '13px', color: '#64748B', fontWeight: '800', textTransform: 'uppercase', letterSpacing: '0.5px' }}>{p.brand}</span>
                    <span style={{ fontSize: '18px', fontWeight: '900', color: '#0F172A' }}>₱{parseFloat(p.price).toLocaleString()}</span>
                  </div>
                  <h3 style={{ margin: '0 0 20px', fontSize: '18px', fontWeight: '800', color: '#0F172A', lineHeight: '1.4' }}>{p.name}</h3>
                  
                  <div style={{ display: 'flex', flexDirection: 'column', gap: '10px' }}>
                    <div style={{ display: 'flex', gap: '10px' }}>
                      <button onClick={() => { setEditingProduct(p); setFormData({ ...p, skus: p.skus || [], imagePreview: buildApiAssetUrl(`/storage/${p.image}`) }); setShowForm(true); }} style={{ flex: 1, padding: '12px', borderRadius: '14px', border: '1px solid #E2E8F0', background: '#FFF', fontWeight: '700', color: '#0F172A', cursor: 'pointer', fontSize: '13px' }}>Edit Details</button>
                      <button onClick={() => setPromotingProduct(p)} style={{ flex: 1, padding: '12px', borderRadius: '14px', border: 'none', background: '#6366F1', color: '#FFF', fontWeight: '700', cursor: 'pointer', fontSize: '13px' }}>Promote</button>
                    </div>
                    <div style={{ display: 'flex', gap: '10px' }}>
                      {p.is_archived ? (
                         <button onClick={() => handleArchive(p.id, false)} style={{ flex: 1, padding: '10px', borderRadius: '12px', border: 'none', background: '#0F172A', color: '#FFF', fontWeight: '700', cursor: 'pointer', fontSize: '12px' }}>Restore</button>
                      ) : (
                         <button onClick={() => handleArchive(p.id, true)} style={{ flex: 1, padding: '10px', borderRadius: '12px', border: '1px solid #E2E8F0', color: '#64748B', fontWeight: '700', cursor: 'pointer', fontSize: '12px' }}>Archive Product</button>
                      )}
                      <button onClick={() => handleDelete(p.id)} style={{ padding: '10px 16px', borderRadius: '12px', border: 'none', background: '#FEF2F2', color: '#EF4444', cursor: 'pointer' }}><i className="fas fa-trash-can" /></button>
                    </div>
                  </div>
                </div>
              </div>
            ))}
          </div>
        </>
      ) : (
        <div style={{ background: '#FFF', padding: '40px', borderRadius: '24px', border: '1px solid #EEE' }}>
          <h2 style={{ fontSize: '20px', fontWeight: '800', marginBottom: '32px' }}>{editingProduct ? 'Edit Product' : 'Add New Product'}</h2>
          <form onSubmit={handleSubmit} style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(300px, 1fr))', gap: '32px' }}>
             <div style={{ display: 'flex', flexDirection: 'column', gap: '20px' }}>
                <div>
                  <label style={{ display: 'block', fontSize: '13px', fontWeight: '700', marginBottom: '8px', color: '#1E293B' }}>Product Name</label>
                  <input type="text" value={formData.name} onChange={e => setFormData({...formData, name: e.target.value})} style={{ width: '100%', padding: '14px', borderRadius: '12px', border: '1px solid #E2E8F0', fontSize: '14px', boxSizing: 'border-box' }} placeholder="e.g. Air Jordan 1 Retro" required />
                </div>
                <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '16px' }}>
                   <div>
                     <label style={{ display: 'block', fontSize: '13px', fontWeight: '700', marginBottom: '8px', color: '#1E293B' }}>Brand</label>
                     <input type="text" value={formData.brand} onChange={e => setFormData({...formData, brand: e.target.value})} style={{ width: '100%', padding: '14px', borderRadius: '12px', border: '1px solid #E2E8F0', fontSize: '14px', boxSizing: 'border-box' }} placeholder="Nike" />
                   </div>
                   <div>
                     <label style={{ display: 'block', fontSize: '13px', fontWeight: '700', marginBottom: '8px', color: '#1E293B' }}>Price (₱)</label>
                     <input type="number" value={formData.price} onChange={e => setFormData({...formData, price: e.target.value})} style={{ width: '100%', padding: '14px', borderRadius: '12px', border: '1px solid #E2E8F0', fontSize: '14px', boxSizing: 'border-box' }} placeholder="0.00" required />
                   </div>
                </div>
                <div>
                  <label style={{ display: 'block', fontSize: '13px', fontWeight: '700', marginBottom: '8px', color: '#1E293B' }}>Product Image</label>
                  <div style={{ padding: '20px', border: '2px dashed #E2E8F0', borderRadius: '16px', textAlign: 'center', background: '#F8FAFC' }}>
                    <input type="file" id="prod-img" onChange={e => { const f = e.target.files[0]; if(f) setFormData({...formData, image: f, imagePreview: URL.createObjectURL(f)}); }} style={{ display: 'none' }} />
                    <label htmlFor="prod-img" style={{ cursor: 'pointer', color: '#6366F1', fontWeight: '700', fontSize: '14px' }}>
                      <i className="fas fa-cloud-upload-alt" style={{ marginRight: '8px' }}></i>
                      {formData.image ? 'Change Image' : 'Upload Image'}
                    </label>
                  </div>
                  {formData.imagePreview && <img src={formData.imagePreview} alt="" style={{ marginTop: '16px', width: '100%', height: '180px', borderRadius: '16px', objectFit: 'cover', border: '1px solid #E2E8F0' }} />}
                </div>
             </div>
             <div style={{ display: 'flex', flexDirection: 'column', gap: '20px' }}>
                <div>
                  <label style={{ display: 'block', fontSize: '13px', fontWeight: '700', marginBottom: '8px', color: '#1E293B' }}>Description</label>
                  <textarea value={formData.description} onChange={e => setFormData({...formData, description: e.target.value})} style={{ width: '100%', height: '120px', padding: '14px', borderRadius: '12px', border: '1px solid #E2E8F0', fontSize: '14px', boxSizing: 'border-box', lineHeight: '1.6' }} placeholder="Describe the product features..." />
                </div>
                
                <div>
                  <label style={{ display: 'block', fontSize: '13px', fontWeight: '700', marginBottom: '12px', color: '#1E293B' }}>Variants (Size/Color/Stock)</label>
                  <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr 1fr auto', gap: '10px', marginBottom: '16px' }}>
                     <input type="text" placeholder="Size" value={newSku.size} onChange={e => setNewSku({...newSku, size: e.target.value})} style={{ width: '100%', minWidth: 0, padding: '12px', borderRadius: '10px', border: '1px solid #E2E8F0', fontSize: '13px', boxSizing: 'border-box' }} />
                     <input type="text" placeholder="Color" value={newSku.color} onChange={e => setNewSku({...newSku, color: e.target.value})} style={{ width: '100%', minWidth: 0, padding: '12px', borderRadius: '10px', border: '1px solid #E2E8F0', fontSize: '13px', boxSizing: 'border-box' }} />
                     <input type="number" placeholder="Qty" value={newSku.stock} onChange={e => setNewSku({...newSku, stock: e.target.value})} style={{ width: '100%', minWidth: 0, padding: '12px', borderRadius: '10px', border: '1px solid #E2E8F0', fontSize: '13px', boxSizing: 'border-box' }} />
                     <button type="button" onClick={handleAddSku} style={{ background: '#0F172A', color: '#FFF', border: 'none', borderRadius: '10px', width: '44px', fontWeight: '900', cursor: 'pointer' }}>+</button>
                  </div>
                  <div style={{ display: 'flex', flexWrap: 'wrap', gap: '8px', maxHeight: '150px', overflowY: 'auto', padding: '4px' }}>
                     {formData.skus.map((s, i) => (
                       <span key={i} style={{ background: '#F1F5F9', padding: '6px 14px', borderRadius: '10px', fontSize: '12px', fontWeight: '700', color: '#475569', display: 'flex', alignItems: 'center', gap: '8px' }}>
                          {s.size} / {s.color} ({s.stock}) 
                          <button type="button" onClick={() => setFormData({...formData, skus: formData.skus.filter((_, idx) => idx !== i)})} style={{ background: 'none', border: 'none', padding: 0, color: '#94A3B8', cursor: 'pointer', fontSize: '14px' }}>&times;</button>
                       </span>
                     ))}
                  </div>
                </div>
             </div>
             <div style={{ gridColumn: '1 / -1', display: 'flex', gap: '16px', marginTop: '16px' }}>
                <button type="submit" disabled={loading} style={{ flex: 2, padding: '18px', borderRadius: '16px', border: 'none', background: '#0F172A', color: '#FFF', fontWeight: '800', cursor: 'pointer', fontSize: '16px', boxShadow: '0 4px 12px rgba(0,0,0,0.1)' }}>{loading ? 'Saving Product...' : 'Save Product'}</button>
                <button type="button" onClick={() => { setShowForm(false); setEditingProduct(null); setFormData(EMPTY_FORM); }} style={{ flex: 1, padding: '18px', borderRadius: '16px', border: '1px solid #E2E8F0', background: '#FFF', fontWeight: '800', color: '#64748B', cursor: 'pointer', fontSize: '16px' }}>Cancel</button>
             </div>
          </form>
        </div>
      )}
    </div>
  );
};

export default AdminProducts;