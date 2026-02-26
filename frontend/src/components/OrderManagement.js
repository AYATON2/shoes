import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import axios from 'axios';
import './OrderManagement.css';

const OrderManagement = () => {
  const [orders, setOrders] = useState([]);
  const [loading, setLoading] = useState(true);
  const [syncing, setSyncing] = useState(false);
  const [selectedOrders, setSelectedOrders] = useState(new Set());
  const [filterStatus, setFilterStatus] = useState('all');
  const [expandedOrder, setExpandedOrder] = useState(null);
  const [previousOrderCount, setPreviousOrderCount] = useState(0);
  const [notifiedOrderIds, setNotifiedOrderIds] = useState(new Set());
  const navigate = useNavigate();

  useEffect(() => {
    const token = localStorage.getItem('token');
    const user = JSON.parse(localStorage.getItem('user') || '{}');
    
    if (!token) {
      navigate('/login');
      return;
    }

    if (user.role !== 'seller' && user.role !== 'admin') {
      navigate('/');
      return;
    }

    axios.defaults.headers.common['Authorization'] = `Bearer ${token}`;
    fetchOrders(true); // Initial load with loading state
    
    // Auto-refresh orders every 3 seconds for real-time feel
    const interval = setInterval(() => fetchOrders(false), 3000);
    return () => clearInterval(interval);
  }, []);

  const fetchOrders = async (isInitialLoad = false) => {
    try {
      if (isInitialLoad) {
        setLoading(true);
      } else {
        setSyncing(true);
      }
      
      const response = await axios.get('/api/orders', { timeout: 10000 });
      const newOrders = response.data.data || response.data;
      
      console.log('Orders fetched. Count:', newOrders.length);
      if (newOrders.length > 0) {
        console.log('First order:', newOrders[0]);
        console.log('First order shippingAddress:', newOrders[0].shippingAddress);
      }
      
      // Check if truly new orders (not seen before)
      const newOrderIds = new Set(newOrders.map(o => o.id));
      const neverNotifiedOrders = newOrders.filter(o => !notifiedOrderIds.has(o.id) && isInitialLoad === false);
      
      if (neverNotifiedOrders.length > 0) {
        setNotifiedOrderIds(prev => new Set([...prev, ...newOrderIds]));
      }
      
      // Mark all current orders as notified on load
      if (isInitialLoad) {
        setNotifiedOrderIds(newOrderIds);
      }
      
      setPreviousOrderCount(newOrders.length);
      setOrders(newOrders);
    } catch (error) {
      console.error('Error fetching orders:', error);
    } finally {
      setLoading(false);
      setSyncing(false);
    }
  };

  const isNewOrder = (createdAt) => {
    const orderTime = new Date(createdAt);
    const timeDiff = Date.now() - orderTime.getTime();
    return timeDiff < 2 * 60 * 1000; // 2 minutes
  };

  const updateOrderStatus = async (orderId, newStatus) => {
    try {
      const order = orders.find(o => o.id === orderId);
      
      // Check if GCash payment needs verification before quality check
      if (newStatus === 'quality_check' && order.payment_method === 'gcash') {
        if (!order.payment?.verified_at) {
          alert('Please verify the GCash payment proof before moving to quality check.');
          return;
        }
      }
      
      await axios.put(`/api/orders/${orderId}`, { status: newStatus });
      fetchOrders();
    } catch (error) {
      console.error('Error updating order:', error);
    }
  };

  const verifyPayment = async (orderId, action) => {
    try {
      const response = await axios.post(`/api/orders/${orderId}/verify-payment`, { action });
      alert(response.data.message);
      fetchOrders();
    } catch (error) {
      console.error('Error verifying payment:', error);
      alert(error.response?.data?.message || 'Error verifying payment');
    }
  };

  const cancelOrder = async (orderId) => {
    if (window.confirm('Are you sure you want to cancel this order?')) {
      try {
        // Update order status to cancelled
        const response = await axios.put(`/api/orders/${orderId}`, { status: 'cancelled' });
        console.log('Order cancelled:', response.data);
        // Refresh orders immediately
        await fetchOrders(false);
      } catch (error) {
        console.error('Error cancelling order:', error.response?.data || error.message);
      }
    }
  };

  const handleOrderSelect = (orderId) => {
    const newSelected = new Set(selectedOrders);
    if (newSelected.has(orderId)) {
      newSelected.delete(orderId);
    } else {
      newSelected.add(orderId);
    }
    setSelectedOrders(newSelected);
  };

  const getStatusColor = (status) => {
    const colors = {
      'received': '#FFC107',
      'quality_check': '#2196F3',
      'shipped': '#FF9800',
      'delivered': '#4CAF50'
    };
    return colors[status] || '#999';
  };

  const getStatusLabel = (status) => {
    const labels = {
      'received': 'Order Received',
      'quality_check': 'Quality Check',
      'shipped': 'Shipped',
      'delivered': 'Delivered',
      'cancelled': 'Cancelled'
    };
    return labels[status] || status;
  };

  const statuses = ['received', 'quality_check', 'shipped', 'delivered', 'cancelled'];

  const filteredOrders = (filterStatus === 'all'
    ? orders
    : orders.filter(order => order.status === filterStatus)
  ).sort((a, b) => new Date(b.created_at) - new Date(a.created_at));

  if (loading) {
    return <div style={{ padding: '20px', textAlign: 'center' }}>Loading...</div>;
  }

  return (
    <div style={{ maxWidth: '1200px', margin: '0 auto', padding: '20px' }}>
      {/* Header */}
      <div style={{ marginBottom: '30px' }}>
        <h1 style={{ fontSize: '32px', fontWeight: '700', color: '#333', marginBottom: '10px' }}>
          Order Management
        </h1>
        <p style={{ color: '#666', fontSize: '14px' }}>Manage and track customer orders</p>
      </div>

      {/* Filter Tabs */}
      <div style={{ borderBottom: '2px solid #EEE', marginBottom: '30px', display: 'flex', gap: '20px', overflowX: 'auto' }}>
        {['all', 'received', 'quality_check', 'shipped', 'delivered', 'cancelled'].map((status) => (
          <button
            key={status}
            onClick={() => setFilterStatus(status)}
            style={{
              background: 'none',
              border: 'none',
              padding: '12px 0',
              fontSize: '14px',
              fontWeight: filterStatus === status ? '700' : '500',
              color: filterStatus === status ? '#FF6B00' : '#999',
              borderBottom: filterStatus === status ? '3px solid #FF6B00' : 'none',
              cursor: 'pointer',
              transition: 'all 0.3s ease',
              whiteSpace: 'nowrap'
            }}
          >
            {status === 'all' ? 'All Orders' : getStatusLabel(status)}
            ({orders.filter(o => status === 'all' || o.status === status).length})
          </button>
        ))}
      </div>

      {/* Orders List */}
      {filteredOrders.length === 0 ? (
        <div style={{
          textAlign: 'center',
          padding: '40px 20px',
          background: '#F9F9F9',
          borderRadius: '8px',
          color: '#999'
        }}>
          <p style={{ fontSize: '16px' }}>No orders found</p>
        </div>
      ) : (
        <div style={{ display: 'flex', flexDirection: 'column', gap: '16px' }}>
          {filteredOrders.map((order) => (
            <div
              key={order.id}
              style={{
                background: '#FFF',
                border: '1px solid #EEE',
                borderRadius: '12px',
                padding: '20px',
                transition: 'all 0.3s ease',
                boxShadow: expandedOrder === order.id ? '0 8px 24px rgba(0,0,0,0.12)' : '0 2px 8px rgba(0,0,0,0.08)'
              }}
            >
              {/* Order Header */}
              <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start' }}>
                <div style={{ flex: 1, cursor: 'pointer' }} onClick={() => setExpandedOrder(expandedOrder === order.id ? null : order.id)}>
                  <h3 style={{ margin: '0 0 5px 0', fontSize: '16px', fontWeight: '700', color: '#333', display: 'flex', alignItems: 'center', gap: '10px' }}>
                    Order #{order.id}
                    {isNewOrder(order.created_at) && (
                      <span style={{
                        background: '#FF6B00',
                        color: '#FFF',
                        padding: '4px 10px',
                        borderRadius: '12px',
                        fontSize: '11px',
                        fontWeight: '700',
                        animation: 'blink 1.5s infinite'
                      }}>
                        🆕 NEW
                      </span>
                    )}
                    {order.payment_method === 'gcash' && order.payment?.status === 'pending' && (
                      <span style={{
                        background: '#FFC107',
                        color: '#FFFFFF',
                        padding: '4px 10px',
                        borderRadius: '12px',
                        fontSize: '11px',
                        fontWeight: '700'
                      }}>
                        💳 Needs Verification
                      </span>
                    )}
                  </h3>
                  <p style={{ margin: '0 0 10px 0', fontSize: '12px', color: '#999' }}>
                    Customer: {order.user?.name || 'Unknown'}
                  </p>
                  <p style={{ margin: 0, fontSize: '12px', color: '#999' }}>
                    {new Date(order.created_at).toLocaleDateString()} - ₱{parseFloat(order.total || 0).toFixed(2)}
                  </p>
                </div>

                <div style={{ display: 'flex', gap: '12px', alignItems: 'center' }}>
                  <span style={{
                    background: getStatusColor(order.status),
                    color: '#FFF',
                    padding: '6px 12px',
                    borderRadius: '20px',
                    fontSize: '12px',
                    fontWeight: '600'
                  }}>
                    {getStatusLabel(order.status)}
                  </span>
                </div>
              </div>

              {/* Expanded Details */}
              {expandedOrder === order.id && (
                <div style={{
                  background: '#F9F9F9',
                  padding: '20px',
                  borderRadius: '8px',
                  marginTop: '20px',
                  borderTop: '1px solid #EEE'
                }}>
                  {/* Order Items */}
                  <div style={{ marginBottom: '20px' }}>
                    <h4 style={{ margin: '0 0 15px 0', fontSize: '14px', fontWeight: '700', color: '#333' }}>
                      Order Items
                    </h4>
                    {order.orderItems?.map((item, idx) => (
                      <div key={idx} style={{
                        display: 'flex',
                        justifyContent: 'space-between',
                        padding: '10px 0',
                        borderBottom: idx !== order.orderItems.length - 1 ? '1px solid #EEE' : 'none'
                      }}>
                        <div>
                          <p style={{ margin: '0 0 5px 0', fontSize: '14px', fontWeight: '600', color: '#333' }}>
                            {item.sku?.product?.name}
                          </p>
                          <p style={{ margin: 0, fontSize: '12px', color: '#999' }}>
                            Quantity: {item.quantity} × ₱{parseFloat(item.price || 0).toFixed(2)}
                          </p>
                        </div>
                        <p style={{ margin: 0, fontSize: '14px', fontWeight: '600', color: '#FF6B00' }}>
                          ₱{(parseFloat(item.price || 0) * parseFloat(item.quantity || 0)).toFixed(2)}
                        </p>
                      </div>
                    ))}
                  </div>

                  {/* Shipping Address */}
                  <div style={{ marginBottom: '20px', padding: '15px', background: '#FFF', borderRadius: '6px', border: '1px solid #EEE' }}>
                    <h4 style={{ margin: '0 0 10px 0', fontSize: '14px', fontWeight: '700', color: '#333' }}>
                      Shipping Address
                    </h4>
                    {(() => {
                      const shippingAddress = order.shippingAddress || order.shipping_address;
                      return shippingAddress ? (
                      <>
                        <p style={{ margin: 0, fontSize: '13px', color: '#666' }}>
                          {shippingAddress.street || 'No street address'}
                        </p>
                        <p style={{ margin: '5px 0 0 0', fontSize: '13px', color: '#666' }}>
                          {[shippingAddress.city, shippingAddress.state, shippingAddress.zip].filter(Boolean).join(', ') || 'No city/state/zip'}
                        </p>
                      </>
                      ) : (
                        <p style={{ margin: 0, fontSize: '13px', color: '#999' }}>No shipping address provided</p>
                      );
                    })()}
                  </div>

                  {/* Payment Information */}
                  {order.payment_method === 'gcash' && order.payment && (
                    <div style={{ marginBottom: '20px', padding: '15px', background: '#FFF', borderRadius: '6px', border: '1px solid #EEE' }}>
                      <h4 style={{ margin: '0 0 10px 0', fontSize: '14px', fontWeight: '700', color: '#333' }}>
                        GCash Payment Information
                      </h4>
                      <p style={{ margin: '0 0 5px 0', fontSize: '13px', color: '#666' }}>
                        <strong>Reference:</strong> {order.payment.gcash_reference || 'N/A'}
                      </p>
                      <p style={{ margin: '0 0 10px 0', fontSize: '13px', color: '#666' }}>
                        <strong>Status:</strong> 
                        <span style={{ 
                          marginLeft: '8px',
                          padding: '2px 8px', 
                          borderRadius: '12px',
                          fontSize: '12px',
                          fontWeight: '600',
                          background: order.payment.status === 'completed' ? '#4CAF50' : 
                                     order.payment.status === 'failed' ? '#FF6B6B' : '#FFC107',
                          color: '#FFF'
                        }}>
                          {order.payment.status === 'completed' ? '✓ Verified' : 
                           order.payment.status === 'failed' ? '✗ Rejected' : '⏳ Pending'}
                        </span>
                      </p>
                      {order.payment.verified_at && (
                        <p style={{ margin: '0 0 10px 0', fontSize: '12px', color: '#999' }}>
                          Verified on {new Date(order.payment.verified_at).toLocaleString()}
                        </p>
                      )}
                      {order.payment.payment_screenshot && (
                        <div>
                          <p style={{ margin: '0 0 5px 0', fontSize: '13px', fontWeight: '600', color: '#333' }}>
                            Payment Proof:
                          </p>
                          <img 
                            src={`/${order.payment.payment_screenshot}`} 
                            alt="Payment Proof" 
                            style={{ 
                              maxWidth: '100%', 
                              maxHeight: '400px', 
                              borderRadius: '8px',
                              border: '2px solid #EEE',
                              cursor: 'pointer'
                            }}
                            onClick={() => window.open(`/${order.payment.payment_screenshot}`, '_blank')}
                          />
                        </div>
                      )}
                      {order.payment.status === 'pending' && !order.payment.verified_at && (
                        <div style={{ marginTop: '15px', display: 'flex', gap: '10px' }}>
                          <button
                            onClick={() => verifyPayment(order.id, 'approve')}
                            style={{
                              background: '#4CAF50',
                              color: '#FFF',
                              border: 'none',
                              padding: '10px 20px',
                              borderRadius: '8px',
                              cursor: 'pointer',
                              fontSize: '13px',
                              fontWeight: '600',
                              transition: 'all 0.3s ease',
                            }}
                            onMouseEnter={(e) => e.currentTarget.style.background = '#45a049'}
                            onMouseLeave={(e) => e.currentTarget.style.background = '#4CAF50'}
                          >
                            ✓ Approve Payment
                          </button>
                          <button
                            onClick={() => {
                              if (window.confirm('Are you sure you want to reject this payment? This will cancel the order.')) {
                                verifyPayment(order.id, 'reject');
                              }
                            }}
                            style={{
                              background: '#FF6B6B',
                              color: '#FFF',
                              border: 'none',
                              padding: '10px 20px',
                              borderRadius: '8px',
                              cursor: 'pointer',
                              fontSize: '13px',
                              fontWeight: '600',
                              transition: 'all 0.3s ease',
                            }}
                            onMouseEnter={(e) => e.currentTarget.style.background = '#E74C3C'}
                            onMouseLeave={(e) => e.currentTarget.style.background = '#FF6B6B'}
                          >
                            ✗ Reject Payment
                          </button>
                        </div>
                      )}
                    </div>
                  )}

                  {/* Status Update & Actions */}
                  <div style={{
                    background: '#FFF',
                    padding: '20px',
                    borderRadius: '8px',
                    border: '1px solid #EEE'
                  }}>
                    <h4 style={{ margin: '0 0 15px 0', fontSize: '14px', fontWeight: '700', color: '#333' }}>
                      Order Actions
                    </h4>
                    <div style={{ display: 'flex', gap: '10px', flexWrap: 'wrap', alignItems: 'center' }}>
                      {statuses.map((status) => (
                        <button
                          key={status}
                          onClick={() => updateOrderStatus(order.id, status)}
                          disabled={status === order.status}
                          style={{
                            background: status === order.status ? '#E8E8E8' : '#4CAF50',
                            color: status === order.status ? '#999' : '#FFF',
                            border: 'none',
                            padding: '10px 16px',
                            borderRadius: '8px',
                            cursor: status === order.status ? 'default' : 'pointer',
                            fontSize: '13px',
                            fontWeight: '600',
                            transition: 'all 0.3s ease',
                            opacity: status === order.status ? 0.6 : 1
                          }}
                          onMouseEnter={(e) => {
                            if (status !== order.status) {
                              e.currentTarget.style.background = '#45a049';
                              e.currentTarget.style.transform = 'translateY(-2px)';
                            }
                          }}
                          onMouseLeave={(e) => {
                            if (status !== order.status) {
                              e.currentTarget.style.background = '#4CAF50';
                              e.currentTarget.style.transform = 'translateY(0)';
                            }
                          }}
                        >
                          ✓ {getStatusLabel(status)}
                        </button>
                      ))}
                      
                      <button
                        onClick={() => cancelOrder(order.id)}
                        disabled={order.status === 'cancelled' || order.status === 'delivered'}
                        style={{
                          background: order.status === 'cancelled' || order.status === 'delivered' ? '#E8E8E8' : '#FF6B6B',
                          color: order.status === 'cancelled' || order.status === 'delivered' ? '#999' : '#FFF',
                          border: 'none',
                          padding: '10px 16px',
                          borderRadius: '8px',
                          cursor: (order.status === 'cancelled' || order.status === 'delivered') ? 'default' : 'pointer',
                          fontSize: '13px',
                          fontWeight: '600',
                          transition: 'all 0.3s ease',
                          opacity: (order.status === 'cancelled' || order.status === 'delivered') ? 0.6 : 1
                        }}
                        onMouseEnter={(e) => {
                          if (order.status !== 'cancelled' && order.status !== 'delivered') {
                            e.currentTarget.style.background = '#E74C3C';
                            e.currentTarget.style.transform = 'translateY(-2px)';
                          }
                        }}
                        onMouseLeave={(e) => {
                          if (order.status !== 'cancelled' && order.status !== 'delivered') {
                            e.currentTarget.style.background = '#FF6B6B';
                            e.currentTarget.style.transform = 'translateY(0)';
                          }
                        }}
                      >
                        ✕ Cancel Order
                      </button>
                    </div>
                  </div>
                </div>
              )}
            </div>
          ))}
        </div>
      )}
    </div>
  );
};

export default OrderManagement;
