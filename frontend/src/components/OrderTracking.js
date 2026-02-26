import React, { useState, useEffect } from 'react';
import { useNavigate, useLocation } from 'react-router-dom';
import axios from 'axios';
import './OrderTracking.css';

const OrderTracking = () => {
  const [orders, setOrders] = useState([]);
  const [notifications, setNotifications] = useState([]);
  const [loading, setLoading] = useState(true);
  const [activePage, setActivePage] = useState('orders');
  const [expandedOrder, setExpandedOrder] = useState(null);
  const navigate = useNavigate();
  const location = useLocation();

  useEffect(() => {
    const token = localStorage.getItem('token');
    if (!token) {
      navigate('/login');
      return;
    }
    axios.defaults.headers.common['Authorization'] = `Bearer ${token}`;
    fetchOrders();
    fetchNotifications();
    
    // Refresh notifications every 10 seconds
    const interval = setInterval(() => {
      fetchNotifications();
    }, 10000);

    return () => clearInterval(interval);
  }, []);

  useEffect(() => {
    const params = new URLSearchParams(location.search);
    const tab = params.get('tab');
    if (tab === 'notifications') {
      setActivePage('notifications');
    }
  }, [location.search]);

  const fetchOrders = async () => {
    try {
      setLoading(true);
      const response = await axios.get('/api/orders');
      setOrders(response.data.data || response.data);
    } catch (error) {
      console.error('Error fetching orders:', error);
    } finally {
      setLoading(false);
    }
  };

  const fetchNotifications = async () => {
    try {
      const response = await axios.get('/api/notifications/unread');
      setNotifications(response.data.notifications);
    } catch (error) {
      console.error('Error fetching notifications:', error);
    }
  };

  const markNotificationAsRead = async (notificationId) => {
    try {
      await axios.put(`/api/notifications/${notificationId}/read`);
      fetchNotifications();
    } catch (error) {
      console.error('Error marking notification as read:', error);
    }
  };

  const markAllNotificationsAsRead = async () => {
    try {
      await axios.put('/api/notifications/read-all');
      fetchNotifications();
    } catch (error) {
      console.error('Error marking all notifications as read:', error);
    }
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
      'delivered': 'Delivered'
    };
    return labels[status] || status;
  };

  const statuses = ['received', 'quality_check', 'shipped', 'delivered'];

  const getStatusPosition = (status) => {
    return (statuses.indexOf(status) / (statuses.length - 1)) * 100;
  };

  if (loading) {
    return <div style={{ padding: '20px', textAlign: 'center' }}>Loading...</div>;
  }

  return (
    <div style={{ maxWidth: '1200px', margin: '0 auto', padding: '20px' }}>
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '24px' }}>
        <button
          onClick={() => navigate('/customer-dashboard')}
          style={{
            background: 'none',
            border: '1px solid #E5E5E5',
            color: '#111',
            padding: '10px 16px',
            borderRadius: '24px',
            cursor: 'pointer',
            display: 'inline-flex',
            alignItems: 'center',
            gap: '8px',
            fontSize: '14px',
            fontWeight: '600'
          }}
          aria-label="Back to customer dashboard"
        >
          <i className="fas fa-arrow-left"></i>
          Back to Dashboard
        </button>

        <div style={{ display: 'flex', gap: '12px', alignItems: 'center' }}>
          <button
            onClick={() => setActivePage('notifications')}
            style={{
              position: 'relative',
              background: '#FFF',
              border: '1px solid #E5E5E5',
              color: '#111',
              width: '40px',
              height: '40px',
              borderRadius: '50%',
              cursor: 'pointer',
              display: 'inline-flex',
              alignItems: 'center',
              justifyContent: 'center'
            }}
            aria-label="View notifications"
            title="Notifications"
          >
            <i className="fas fa-bell"></i>
            {notifications.length > 0 && (
              <span style={{
                position: 'absolute',
                top: '-4px',
                right: '-4px',
                background: '#FF3B30',
                color: '#FFF',
                borderRadius: '999px',
                padding: '2px 6px',
                fontSize: '10px',
                fontWeight: '700'
              }}>
                {notifications.length}
              </span>
            )}
          </button>
          <button
            onClick={() => navigate('/customer-dashboard?tab=settings')}
            style={{
              background: '#FFF',
              border: '1px solid #E5E5E5',
              color: '#111',
              width: '40px',
              height: '40px',
              borderRadius: '50%',
              cursor: 'pointer',
              display: 'inline-flex',
              alignItems: 'center',
              justifyContent: 'center'
            }}
            aria-label="Go to profile settings"
            title="Profile settings"
          >
            <i className="fas fa-cog"></i>
          </button>
        </div>
      </div>

      {/* Header */}
      <div style={{ marginBottom: '40px' }}>
        <h1 style={{ fontSize: '32px', fontWeight: '700', color: '#333', marginBottom: '10px' }}>
          Order Tracking
        </h1>
        <p style={{ color: '#666', fontSize: '14px' }}>Track your orders and receive notifications</p>
      </div>

      {/* Notification Badge */}
      <div style={{ marginBottom: '30px' }}>
        {notifications.length > 0 && (
          <div style={{
            background: '#E3F2FD',
            border: '1px solid #2196F3',
            borderRadius: '8px',
            padding: '16px',
            marginBottom: '20px'
          }}>
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
              <div>
                <h3 style={{ margin: '0 0 10px 0', color: '#1976D2' }}>
                  You have {notifications.length} new notification{notifications.length !== 1 ? 's' : ''}
                </h3>
                {notifications.map((notif, idx) => (
                  <div key={idx} style={{
                    background: '#FFF',
                    padding: '12px',
                    borderRadius: '6px',
                    marginBottom: '8px',
                    borderLeft: '4px solid #2196F3',
                    cursor: 'pointer',
                    transition: 'all 0.3s ease'
                  }} onClick={() => markNotificationAsRead(notif.id)}>
                    <p style={{ margin: '0 0 4px 0', fontWeight: '600', fontSize: '14px', color: '#333' }}>
                      {notif.title}
                    </p>
                    <p style={{ margin: 0, fontSize: '13px', color: '#666' }}>{notif.message}</p>
                  </div>
                ))}
              </div>
              <button
                onClick={markAllNotificationsAsRead}
                style={{
                  background: '#2196F3',
                  color: '#FFF',
                  border: 'none',
                  padding: '8px 16px',
                  borderRadius: '6px',
                  cursor: 'pointer',
                  whiteSpace: 'nowrap',
                  marginLeft: '20px',
                  fontSize: '12px'
                }}
              >
                Mark All as Read
              </button>
            </div>
          </div>
        )}
      </div>

      {/* Tabs */}
      <div style={{ borderBottom: '2px solid #EEE', marginBottom: '30px', display: 'flex', gap: '20px' }}>
        <button
          onClick={() => setActivePage('orders')}
          style={{
            background: 'none',
            border: 'none',
            padding: '12px 0',
            fontSize: '16px',
            fontWeight: activePage === 'orders' ? '700' : '500',
            color: activePage === 'orders' ? '#FF6B00' : '#999',
            borderBottom: activePage === 'orders' ? '3px solid #FF6B00' : 'none',
            cursor: 'pointer',
            transition: 'all 0.3s ease'
          }}
        >
          My Orders ({orders.length})
        </button>
        <button
          onClick={() => setActivePage('notifications')}
          style={{
            background: 'none',
            border: 'none',
            padding: '12px 0',
            fontSize: '16px',
            fontWeight: activePage === 'notifications' ? '700' : '500',
            color: activePage === 'notifications' ? '#FF6B00' : '#999',
            borderBottom: activePage === 'notifications' ? '3px solid #FF6B00' : 'none',
            cursor: 'pointer',
            transition: 'all 0.3s ease'
          }}
        >
          All Notifications
        </button>
      </div>

      {/* Orders Tab */}
      {activePage === 'orders' && (
        <div>
          {orders.length === 0 ? (
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
            <div style={{ display: 'flex', flexDirection: 'column', gap: '20px' }}>
              {orders.map((order) => (
                <div
                  key={order.id}
                  style={{
                    background: '#FFF',
                    border: '1px solid #EEE',
                    borderRadius: '12px',
                    padding: '20px',
                    cursor: 'pointer',
                    transition: 'all 0.3s ease',
                    boxShadow: expandedOrder === order.id ? '0 8px 24px rgba(0,0,0,0.12)' : '0 2px 8px rgba(0,0,0,0.08)'
                  }}
                  onClick={() => setExpandedOrder(expandedOrder === order.id ? null : order.id)}
                >
                  {/* Order Header */}
                  <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '20px' }}>
                    <div>
                      <h3 style={{ margin: 0, fontSize: '18px', fontWeight: '700', color: '#333' }}>
                        Order #{order.id}
                      </h3>
                      <p style={{ margin: '5px 0 0 0', fontSize: '12px', color: '#999' }}>
                        {new Date(order.created_at).toLocaleDateString()}
                      </p>
                    </div>
                    <div style={{ textAlign: 'right' }}>
                      <p style={{ margin: '0 0 5px 0', fontSize: '18px', fontWeight: '700', color: '#FF6B00' }}>
                        ₱{(parseFloat(order.total) || 0).toFixed(2)}
                      </p>
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

                  {/* Status Timeline */}
                  <div style={{ position: 'relative', marginBottom: '20px', padding: '20px 0' }}>
                    <div style={{
                      position: 'absolute',
                      top: '20px',
                      left: 0,
                      right: 0,
                      height: '2px',
                      background: '#EEE',
                      zIndex: 0
                    }} />
                    <div style={{
                      position: 'absolute',
                      top: '20px',
                      left: 0,
                      height: '2px',
                      background: '#FF6B00',
                      width: `${getStatusPosition(order.status)}%`,
                      transition: 'width 0.5s ease',
                      zIndex: 1
                    }} />
                    <div style={{ display: 'flex', justifyContent: 'space-between', position: 'relative', zIndex: 2 }}>
                      {statuses.map((status) => (
                        <div key={status} style={{ textAlign: 'center', flex: 1 }}>
                          <div style={{
                            width: '40px',
                            height: '40px',
                            borderRadius: '50%',
                            background: statuses.indexOf(status) <= statuses.indexOf(order.status) ? '#FF6B00' : '#EEE',
                            border: '3px solid #FFF',
                            margin: '0 auto 10px',
                            display: 'flex',
                            alignItems: 'center',
                            justifyContent: 'center',
                            color: '#FFF',
                            fontSize: '20px',
                            boxShadow: '0 2px 8px rgba(0,0,0,0.1)'
                          }}>
                            {statuses.indexOf(status) <= statuses.indexOf(order.status) && '✓'}
                          </div>
                          <p style={{ margin: 0, fontSize: '12px', fontWeight: '600', color: '#333' }}>
                            {getStatusLabel(status).split(' ')[0]}
                          </p>
                        </div>
                      ))}
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
                            <p style={{ margin: 0, fontSize: '14px', fontWeight: '600', color: '#333' }}>
                              {item.sku?.product?.name}
                            </p>
                            <p style={{ margin: '5px 0 0 0', fontSize: '12px', color: '#999' }}>
                              Quantity: {item.quantity}
                            </p>
                          </div>
                          <p style={{ margin: 0, fontSize: '14px', fontWeight: '600', color: '#FF6B00' }}>
                            ₱{((parseFloat(item.price) || 0) * (parseFloat(item.quantity) || 0)).toFixed(2)}
                          </p>
                        </div>
                      ))}
                      
                      {/* Shipping Address */}
                      <div style={{ marginTop: '20px', padding: '15px', background: '#FFF', borderRadius: '6px', border: '1px solid #EEE' }}>
                        <h4 style={{ margin: '0 0 10px 0', fontSize: '14px', fontWeight: '700', color: '#333' }}>
                          Shipping Address
                        </h4>
                        <p style={{ margin: 0, fontSize: '13px', color: '#666' }}>
                          {order.shippingAddress?.street},
                        </p>
                        <p style={{ margin: '5px 0 0 0', fontSize: '13px', color: '#666' }}>
                          {order.shippingAddress?.city}, {order.shippingAddress?.state} {order.shippingAddress?.zip}
                        </p>
                      </div>
                    </div>
                  )}
                </div>
              ))}
            </div>
          )}
        </div>
      )}

      {/* Notifications Tab */}
      {activePage === 'notifications' && (
        <div>
          {notifications.length === 0 ? (
            <div style={{
              textAlign: 'center',
              padding: '40px 20px',
              background: '#F9F9F9',
              borderRadius: '8px',
              color: '#999'
            }}>
              <p style={{ fontSize: '16px' }}>No new notifications</p>
            </div>
          ) : (
            <div style={{ display: 'flex', flexDirection: 'column', gap: '12px' }}>
              {notifications.map((notif) => (
                <div
                  key={notif.id}
                  style={{
                    background: '#FFF',
                    border: '1px solid #EEE',
                    borderLeft: '4px solid #FF6B00',
                    borderRadius: '8px',
                    padding: '16px',
                    display: 'flex',
                    justifyContent: 'space-between',
                    alignItems: 'center'
                  }}
                >
                  <div>
                    <h4 style={{ margin: '0 0 5px 0', fontSize: '14px', fontWeight: '700', color: '#333' }}>
                      {notif.title}
                    </h4>
                    <p style={{ margin: '0 0 5px 0', fontSize: '13px', color: '#666' }}>
                      {notif.message}
                    </p>
                    <p style={{ margin: 0, fontSize: '11px', color: '#999' }}>
                      Order #{notif.order_id}
                    </p>
                  </div>
                  <button
                    onClick={() => markNotificationAsRead(notif.id)}
                    style={{
                      background: '#FF6B00',
                      color: '#FFF',
                      border: 'none',
                      padding: '6px 12px',
                      borderRadius: '4px',
                      cursor: 'pointer',
                      fontSize: '12px',
                      marginLeft: '20px',
                      whiteSpace: 'nowrap'
                    }}
                  >
                    Mark as Read
                  </button>
                </div>
              ))}
            </div>
          )}
        </div>
      )}
    </div>
  );
};

export default OrderTracking;
