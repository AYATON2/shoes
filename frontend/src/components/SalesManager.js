import React, { useState, useEffect } from 'react';
import axios from 'axios';
import './SalesManager.css';

const SalesManager = ({ productId = null, products = [] }) => {
  const [sales, setSales] = useState([]);
  const [loading, setLoading] = useState(false);
  const [notification, setNotification] = useState(null);
  const [showForm, setShowForm] = useState(false);
  const [editingSale, setEditingSale] = useState(null);
  const [formData, setFormData] = useState({
    product_id: null, // Always null for store-wide sales
    title: '',
    description: '',
    discount_amount: '',
    discount_percentage: '',
    start_date: '',
    end_date: ''
  });

  useEffect(() => {
    fetchSales();
  }, []);

  const fetchSales = async () => {
    try {
      setLoading(true);
      const response = await axios.get('/api/sales');
      setSales(response.data.data || response.data);
    } catch (error) {
      console.error('Error fetching sales:', error);
      showNotification('Error loading sales', 'error');
    } finally {
      setLoading(false);
    }
  };

  const handleSubmit = async (e) => {
    e.preventDefault();

    if (!formData.discount_amount && !formData.discount_percentage) {
      showNotification('Please enter either a fixed discount or percentage discount', 'error');
      return;
    }

    try {
      const payload = {
        ...formData,
        product_id: null // Always null for store-wide sales
      };

      if (editingSale) {
        await axios.put(`/api/sales/${editingSale.id}`, payload);
        showNotification('Sale updated successfully!', 'success');
      } else {
        await axios.post('/api/sales', payload);
        showNotification('Sale created successfully!', 'success');
      }
      fetchSales();
      resetForm();
    } catch (error) {
      console.error('Error saving sale:', error);
      const message = error.response?.data?.message || 'Error saving sale';
      showNotification(message, 'error');
    }
  };

  const handleEdit = (sale) => {
    setEditingSale(sale);
    setFormData({
      product_id: null, // Always null for store-wide sales
      title: sale.title,
      description: sale.description || '',
      discount_amount: sale.discount_amount || '',
      discount_percentage: sale.discount_percentage || '',
      start_date: sale.start_date.split('T')[0],
      end_date: sale.end_date.split('T')[0]
    });
    setShowForm(true);
  };

  const handleDelete = async (id) => {
    if (window.confirm('Are you sure you want to delete this sale?')) {
      try {
        await axios.delete(`/api/sales/${id}`);
        showNotification('Sale deleted successfully!', 'success');
        fetchSales();
      } catch (error) {
        showNotification('Error deleting sale', 'error');
      }
    }
  };

  const handleToggleActive = async (id) => {
    try {
      await axios.patch(`/api/sales/${id}/toggle`);
      fetchSales();
    } catch (error) {
      showNotification('Error toggling sale status', 'error');
    }
  };

  const resetForm = () => {
    setFormData({
      product_id: null,
      title: '',
      description: '',
      discount_amount: '',
      discount_percentage: '',
      start_date: '',
      end_date: ''
    });
    setEditingSale(null);
    setShowForm(false);
  };

  const showNotification = (message, type = 'success') => {
    setNotification({ message, type });
    setTimeout(() => setNotification(null), 3000);
  };

  const getProductName = (productId) => {
    if (!productId) return 'All Products (Store-Wide)';
    const product = products.find(p => p.id === productId);
    return product ? product.name : `Product #${productId}`;
  };

  const getSaleStatus = (sale) => {
    const now = new Date();
    const startDate = new Date(sale.start_date);
    const endDate = new Date(sale.end_date);

    if (!sale.is_active) {
      return { label: 'Inactive', color: '#999' };
    } else if (now < startDate) {
      return { label: 'Upcoming', color: '#2196F3' };
    } else if (now > endDate) {
      return { label: 'Ended', color: '#F44336' };
    } else {
      return { label: 'Active', color: '#4CAF50' };
    }
  };

  if (loading) {
    return <div style={{ padding: '20px', textAlign: 'center' }}>Loading...</div>;
  }

  return (
    <div style={{ maxWidth: '1000px', margin: '0 auto', padding: '20px' }}>
      {/* Notification */}
      {notification && (
        <div style={{
          background: notification.type === 'success' ? '#4CAF50' : '#F44336',
          color: '#FFF',
          padding: '12px 16px',
          borderRadius: '8px',
          marginBottom: '20px'
        }}>
          {notification.message}
        </div>
      )}

      {/* Header */}
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '30px' }}>
        <div>
          <h1 style={{ fontSize: '28px', fontWeight: '700', color: '#333', margin: '0 0 4px 0' }}>
            Sales & Promotions
          </h1>
          <p style={{ fontSize: '14px', color: '#666', margin: 0 }}>
            Create store-wide sales that apply to all your products (Holiday Sales, Flash Sales, etc.)
          </p>
        </div>
        {!showForm && (
          <button
            onClick={() => setShowForm(true)}
            style={{
              background: '#FF6B00',
              color: '#FFF',
              border: 'none',
              padding: '12px 24px',
              borderRadius: '8px',
              cursor: 'pointer',
              fontWeight: '600',
              fontSize: '14px'
            }}
          >
            + Create Sale
          </button>
        )}
      </div>

      {/* Create/Edit Form */}
      {showForm && (
        <div style={{
          background: '#F9F9F9',
          padding: '24px',
          borderRadius: '12px',
          marginBottom: '30px',
          border: '1px solid #EEE'
        }}>
          <h2 style={{ fontSize: '18px', fontWeight: '700', color: '#333', margin: '0 0 8px 0' }}>
            {editingSale ? 'Edit Sale' : 'Create New Sale'}
          </h2>
          <p style={{ fontSize: '13px', color: '#666', margin: '0 0 20px 0', lineHeight: '1.6' }}>
            Create a sale that applies to all products or individual products
          </p>

          <form onSubmit={handleSubmit}>
            {/* Sale Type Selection */}
            <div style={{ 
              marginBottom: '20px', 
              padding: '16px', 
              background: '#F5F5F5', 
              borderRadius: '8px',
              border: '1px solid #E0E0E0'
            }}>
              <label style={{ display: 'block', fontWeight: '600', marginBottom: '12px', color: '#333' }}>
                Sale Type *
              </label>
              <div style={{ display: 'flex', gap: '12px' }}>
                <label style={{ 
                  flex: 1,
                  display: 'flex', 
                  alignItems: 'center', 
                  cursor: 'pointer',
                  padding: '12px',
                  background: formData.sale_type === 'store-wide' ? '#E3F2FD' : '#FFF',
                  border: formData.sale_type === 'store-wide' ? '2px solid #2196F3' : '2px solid #E0E0E0',
                  borderRadius: '8px',
                  transition: 'all 0.2s'
                }}>
                  <input
                    type="radio"
                    name="sale_type"
                    value="store-wide"
                    checked={formData.sale_type === 'store-wide'}
                    onChange={(e) => setFormData({ ...formData, sale_type: e.target.value, product_id: null })}
                    style={{ marginRight: '8px', width: '16px', height: '16px', cursor: 'pointer' }}
                  />
                  <div>
                    <div style={{ fontWeight: '600', color: '#333', fontSize: '14px' }}>🏬 Store-Wide</div>
                    <div style={{ fontSize: '12px', color: '#666', marginTop: '2px' }}>Apply to all products</div>
                  </div>
                </label>
                
                <label style={{ 
                  flex: 1,
                  display: 'flex', 
                  alignItems: 'center', 
                  cursor: 'pointer',
                  padding: '12px',
                  background: formData.sale_type === 'individual' ? '#FFF3E0' : '#FFF',
                  border: formData.sale_type === 'individual' ? '2px solid #FF9800' : '2px solid #E0E0E0',
                  borderRadius: '8px',
                  transition: 'all 0.2s'
                }}>
                  <input
                    type="radio"
                    name="sale_type"
                    value="individual"
                    checked={formData.sale_type === 'individual'}
                    onChange={(e) => setFormData({ ...formData, sale_type: e.target.value })}
                    style={{ marginRight: '8px', width: '16px', height: '16px', cursor: 'pointer' }}
                  />
                  <div>
                    <div style={{ fontWeight: '600', color: '#333', fontSize: '14px' }}>🏷️ Individual</div>
                    <div style={{ fontSize: '12px', color: '#666', marginTop: '2px' }}>For specific products</div>
                  </div>
                </label>
              </div>
            </div>

            {/* Info Notice */}
            <div style={{ 
              marginBottom: '20px', 
              padding: '16px', 
              background: '#E3F2FD', 
              borderRadius: '8px',
              border: '1px solid #90CAF9'
            }}>
              <p style={{ 
                margin: '0', 
                fontSize: '13px', 
                color: '#1565C0',
                lineHeight: '1.6'
              }}>
                💡 <strong>Tip:</strong> Individual sales can be assigned to specific products later from the <strong>"My Products"</strong> tab.
                Create the sale here, then go to each product to apply it.
              </p>
            </div>

            {/* Title */}
            <div style={{ marginBottom: '16px' }}>
              <label style={{ display: 'block', fontWeight: '600', marginBottom: '8px', color: '#333' }}>
                Sale Title * (e.g., "11/11 Flash Sale", "Christmas Discount")
              </label>
              <input
                type="text"
                value={formData.title}
                onChange={(e) => setFormData({ ...formData, title: e.target.value })}
                placeholder="Enter sale title (e.g., 7/7 SALE, Holiday Sale 2026)"
                required
                style={{
                  width: '100%',
                  padding: '10px',
                  border: '1px solid #DDD',
                  borderRadius: '6px',
                  fontSize: '14px',
                  boxSizing: 'border-box'
                }}
              />
            </div>

            {/* Description */}
            <div style={{ marginBottom: '16px' }}>
              <label style={{ display: 'block', fontWeight: '600', marginBottom: '8px', color: '#333' }}>
                Description
              </label>
              <textarea
                value={formData.description}
                onChange={(e) => setFormData({ ...formData, description: e.target.value })}
                placeholder="Enter sale description"
                rows="3"
                style={{
                  width: '100%',
                  padding: '10px',
                  border: '1px solid #DDD',
                  borderRadius: '6px',
                  fontSize: '14px',
                  boxSizing: 'border-box',
                  fontFamily: 'inherit'
                }}
              />
            </div>

            {/* Discount Options */}
            <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '16px', marginBottom: '16px' }}>
              <div>
                <label style={{ display: 'block', fontWeight: '600', marginBottom: '8px', color: '#333' }}>
                  Fixed Discount Amount (₱)
                </label>
                <input
                  type="number"
                  value={formData.discount_amount}
                  onChange={(e) => setFormData({ ...formData, discount_amount: e.target.value })}
                  placeholder="e.g., 100.00"
                  min="0"
                  step="0.01"
                  style={{
                    width: '100%',
                    padding: '10px',
                    border: '1px solid #DDD',
                    borderRadius: '6px',
                    fontSize: '14px',
                    boxSizing: 'border-box'
                  }}
                />
              </div>
              <div>
                <label style={{ display: 'block', fontWeight: '600', marginBottom: '8px', color: '#333' }}>
                  Percentage Discount (%)
                </label>
                <input
                  type="number"
                  value={formData.discount_percentage}
                  onChange={(e) => setFormData({ ...formData, discount_percentage: e.target.value })}
                  placeholder="e.g., 20.5"
                  min="0"
                  max="100"
                  step="0.01"
                  style={{
                    width: '100%',
                    padding: '10px',
                    border: '1px solid #DDD',
                    borderRadius: '6px',
                    fontSize: '14px',
                    boxSizing: 'border-box'
                  }}
                />
              </div>
            </div>

            {/* Date Range */}
            <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '16px', marginBottom: '20px' }}>
              <div>
                <label style={{ display: 'block', fontWeight: '600', marginBottom: '8px', color: '#333' }}>
                  Start Date * (e.g., Nov 11)
                </label>
                <input
                  type="date"
                  value={formData.start_date}
                  onChange={(e) => setFormData({ ...formData, start_date: e.target.value })}
                  required
                  style={{
                    width: '100%',
                    padding: '10px',
                    border: '1px solid #DDD',
                    borderRadius: '6px',
                    fontSize: '14px',
                    boxSizing: 'border-box'
                  }}
                />
              </div>
              <div>
                <label style={{ display: 'block', fontWeight: '600', marginBottom: '8px', color: '#333' }}>
                  End Date *
                </label>
                <input
                  type="date"
                  value={formData.end_date}
                  onChange={(e) => setFormData({ ...formData, end_date: e.target.value })}
                  required
                  style={{
                    width: '100%',
                    padding: '10px',
                    border: '1px solid #DDD',
                    borderRadius: '6px',
                    fontSize: '14px',
                    boxSizing: 'border-box'
                  }}
                />
              </div>
            </div>

            {/* Action Buttons */}
            <div style={{ display: 'flex', gap: '12px' }}>
              <button
                type="submit"
                style={{
                  flex: 1,
                  background: '#FF6B00',
                  color: '#FFF',
                  border: 'none',
                  padding: '12px',
                  borderRadius: '6px',
                  cursor: 'pointer',
                  fontWeight: '600',
                  fontSize: '14px'
                }}
              >
                {editingSale ? 'Update Sale' : 'Create Sale'}
              </button>
              <button
                type="button"
                onClick={resetForm}
                style={{
                  flex: 1,
                  background: '#EEE',
                  color: '#333',
                  border: 'none',
                  padding: '12px',
                  borderRadius: '6px',
                  cursor: 'pointer',
                  fontWeight: '600',
                  fontSize: '14px'
                }}
              >
                Cancel
              </button>
            </div>
          </form>
        </div>
      )}

      {/* Sales List */}
      {sales.length === 0 ? (
        <div style={{
          textAlign: 'center',
          padding: '40px 20px',
          background: '#F9F9F9',
          borderRadius: '8px',
          color: '#999'
        }}>
          <p style={{ fontSize: '16px', margin: '0 0 8px 0' }}>No store-wide sales yet</p>
          <p style={{ fontSize: '13px', margin: 0 }}>Create a holiday sale or flash promotion that applies to all your products!</p>
        </div>
      ) : (
        <div style={{ display: 'grid', gap: '16px' }}>
          {sales.map((sale) => {
            const status = getSaleStatus(sale);
            return (
              <div
                key={sale.id}
                style={{
                  background: '#FFF',
                  border: '1px solid #EEE',
                  borderRadius: '12px',
                  padding: '20px',
                  display: 'flex',
                  justifyContent: 'space-between',
                  alignItems: 'center'
                }}
              >
                <div style={{ flex: 1 }}>
                  <div style={{ display: 'flex', alignItems: 'center', gap: '8px', marginBottom: '8px' }}>
                    <h3 style={{ margin: '0', fontSize: '16px', fontWeight: '700', color: '#333' }}>
                      {sale.title}
                    </h3>
                    {!sale.product_id && (
                      <span style={{
                        background: '#E3F2FD',
                        color: '#1976D2',
                        padding: '2px 8px',
                        borderRadius: '4px',
                        fontSize: '11px',
                        fontWeight: '700',
                        textTransform: 'uppercase'
                      }}>
                        STORE-WIDE
                      </span>
                    )}
                  </div>
                  <p style={{ margin: '4px 0', fontSize: '13px', color: '#666' }}>
                    📦 {getProductName(sale.product_id)}
                  </p>
                  <p style={{ margin: '4px 0', fontSize: '13px', color: '#666' }}>
                    {sale.discount_percentage
                      ? `${sale.discount_percentage}% off`
                      : `₱${sale.discount_amount} off`}
                    {sale.product && sale.sale_price && (
                      <span> | Original: ₱{sale.product?.price} → Sale: ₱{sale.sale_price}</span>
                    )}
                  </p>
                  <p style={{ margin: '4px 0', fontSize: '12px', color: '#999' }}>
                    {new Date(sale.start_date).toLocaleDateString()} - {new Date(sale.end_date).toLocaleDateString()}
                  </p>
                </div>

                <div style={{ display: 'flex', gap: '8px', alignItems: 'center' }}>
                  <span
                    style={{
                      background: status.color,
                      color: '#FFF',
                      padding: '6px 12px',
                      borderRadius: '20px',
                      fontSize: '12px',
                      fontWeight: '600',
                      whiteSpace: 'nowrap'
                    }}
                  >
                    {status.label}
                  </span>

                  <button
                    onClick={() => handleToggleActive(sale.id)}
                    style={{
                      background: sale.is_active ? '#4CAF50' : '#FFC107',
                      color: '#FFF',
                      border: 'none',
                      padding: '6px 12px',
                      borderRadius: '6px',
                      cursor: 'pointer',
                      fontSize: '12px',
                      fontWeight: '600'
                    }}
                  >
                    {sale.is_active ? 'Deactivate' : 'Activate'}
                  </button>

                  <button
                    onClick={() => handleEdit(sale)}
                    style={{
                      background: '#2196F3',
                      color: '#FFF',
                      border: 'none',
                      padding: '6px 12px',
                      borderRadius: '6px',
                      cursor: 'pointer',
                      fontSize: '12px',
                      fontWeight: '600'
                    }}
                  >
                    Edit
                  </button>

                  <button
                    onClick={() => handleDelete(sale.id)}
                    style={{
                      background: '#E53935',
                      color: '#FFF',
                      border: 'none',
                      padding: '6px 12px',
                      borderRadius: '6px',
                      cursor: 'pointer',
                      fontSize: '12px',
                      fontWeight: '600'
                    }}
                  >
                    Delete
                  </button>
                </div>
              </div>
            );
          })}
        </div>
      )}
    </div>
  );
};

export default SalesManager;
