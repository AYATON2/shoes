import React, { useState, useEffect } from 'react';
import { useNavigate, Link } from 'react-router-dom';
import axios from 'axios';
import Notification from './Notification';
import { buildApiAssetUrl } from '../utils/apiUrl';

const Checkout = () => {
  const [cart, setCart] = useState(JSON.parse(localStorage.getItem('cart') || '[]'));
  const [shippingAddress, setShippingAddress] = useState({
    street: '',
    city: '',
    state: '',
    zip: '',
    country: 'Philippines'
  });
  const [paymentMethod, setPaymentMethod] = useState('cod');
  const [loading, setLoading] = useState(false);
  const [notification, setNotification] = useState(null);
  const [showGCashModal, setShowGCashModal] = useState(false);
  const [gcashPaymentData, setGCashPaymentData] = useState(null);
  const [gcashReference, setGCashReference] = useState('');
  const [gcashScreenshotFile, setGCashScreenshotFile] = useState(null);
  const navigate = useNavigate();

  useEffect(() => {
    const token = localStorage.getItem('token');
    if (!token) {
      navigate('/login');
      return;
    }
    axios.defaults.headers.common['Authorization'] = `Bearer ${token}`;

    const handleCartUpdate = () => {
      setCart(JSON.parse(localStorage.getItem('cart') || '[]'));
    };
    window.addEventListener('cartUpdated', handleCartUpdate);
    return () => window.removeEventListener('cartUpdated', handleCartUpdate);
  }, [navigate]);

  const handleRemoveItem = (productId) => {
    const updatedCart = cart.filter(item => item.product_id !== productId);
    localStorage.setItem('cart', JSON.stringify(updatedCart));
    setCart(updatedCart);
    setNotification({ message: 'Item removed from cart', type: 'success' });
  };

  const handleQuantityChange = (productId, newQuantity) => {
    if (newQuantity < 1) {
      handleRemoveItem(productId);
      return;
    }
    const updatedCart = cart.map(item =>
      item.product_id === productId ? { ...item, quantity: newQuantity } : item
    );
    localStorage.setItem('cart', JSON.stringify(updatedCart));
    setCart(updatedCart);
  };

  const calculateTotal = () => {
    const subtotal = cart.reduce((sum, item) => sum + (parseFloat(item.price) * item.quantity), 0);
    const shippingFee = 50.00;
    return { subtotal, shippingFee, total: subtotal + shippingFee };
  };

  const getOrderErrorMessage = (err) => {
    let errorMsg = 'Order failed. Please try again.';

    if (err.response?.data?.errors) {
      const errors = err.response.data.errors;
      errorMsg = Object.values(errors).flat().join(', ');
    } else if (err.response?.data?.error) {
      errorMsg = err.response.data.error;
    } else if (err.response?.data?.message) {
      errorMsg = err.response.data.message;
    }

    return errorMsg;
  };

  const createOrderRequest = async ({ gcashReferenceValue = null, gcashScreenshot = null } = {}) => {
    const items = cart.map(item => ({
      sku_id: item.sku_id,
      quantity: item.quantity
    }));

    // Create shipping address first
    const addressRes = await axios.post('/api/addresses', shippingAddress);
    const addressData = addressRes.data.data || addressRes.data;
    const addressId = addressData?.id;

    if (!addressId) {
      throw new Error('No address ID returned from server');
    }

    if (paymentMethod === 'gcash') {
      const formData = new FormData();
      formData.append('items', JSON.stringify(items));
      formData.append('shipping_address_id', String(addressId));
      formData.append('payment_method', 'gcash');
      formData.append('gcash_reference', gcashReferenceValue || '');
      if (gcashScreenshot) {
        formData.append('payment_screenshot', gcashScreenshot);
      }

      return axios.post('/api/orders', formData, {
        headers: {
          'Content-Type': 'multipart/form-data'
        }
      });
    }

    return axios.post('/api/orders', {
      items,
      shipping_address_id: addressId,
      payment_method: paymentMethod
    });
  };

  const completeCheckout = (message) => {
    localStorage.removeItem('cart');
    setCart([]);
    setNotification({ message, type: 'success' });
    setTimeout(() => {
      window.location.href = '/customer-dashboard';
    }, 2000);
  };

  const handleSubmit = (e) => {
    e.preventDefault();
    const { total } = calculateTotal();
    
    if (cart.length === 0) {
      setNotification({ message: 'Your cart is empty!', type: 'error' });
      return;
    }

    // Validate shipping address
    if (!shippingAddress.street || !shippingAddress.city || !shippingAddress.state || !shippingAddress.zip || !shippingAddress.country) {
      setNotification({ message: 'Please fill in all required shipping address fields', type: 'error' });
      return;
    }

    // For GCash, open payment form first, then place order after proof upload.
    if (paymentMethod === 'gcash') {
      const referenceNumber = `GCASH-${Date.now()}`;
      setGCashPaymentData({
        amount: total,
        referenceNumber,
        merchantName: 'StepUp Footwear',
        merchantNumber: '09285749453'
      });
      setGCashReference(referenceNumber);
      setGCashScreenshotFile(null);
      setShowGCashModal(true);
      return;
    }

    setLoading(true);
    createOrderRequest()
      .then(() => {
        completeCheckout('Order placed successfully! You will pay upon delivery.');
      })
      .catch(err => {
        console.error('Order placement error:', err.response?.data || err.message);
        setNotification({ message: getOrderErrorMessage(err), type: 'error' });
      })
      .finally(() => {
        setLoading(false);
      });
  };

  const handleGCashProceed = () => {
    if (!gcashReference.trim()) {
      setNotification({ message: 'Please enter GCash reference number.', type: 'error' });
      return;
    }

    if (!gcashScreenshotFile) {
      setNotification({ message: 'Please upload your GCash payment screenshot.', type: 'error' });
      return;
    }

    setLoading(true);
    createOrderRequest({
      gcashReferenceValue: gcashReference.trim(),
      gcashScreenshot: gcashScreenshotFile
    })
      .then(() => {
        setShowGCashModal(false);
        completeCheckout('Payment submitted! Your order is now pending verification.');
      })
      .catch(err => {
        console.error('GCash order placement error:', err.response?.data || err.message);
        setNotification({ message: getOrderErrorMessage(err), type: 'error' });
      })
      .finally(() => {
        setLoading(false);
      });
  };

  const { subtotal, shippingFee, total } = calculateTotal();

  return (
    <div style={{background: '#FAFAFA', minHeight: '100vh', paddingTop: '80px'}}>
      {notification && (
        <Notification
          message={notification.message}
          type={notification.type}
          onClose={() => setNotification(null)}
        />
      )}

      <div style={{maxWidth: '1400px', margin: '0 auto', padding: '40px 20px'}}>
        <h1 style={{
          fontSize: '36px',
          fontWeight: '700',
          color: '#111',
          margin: '0 0 32px 0'
        }}>Shopping Cart</h1>

        <div style={{display: 'grid', gridTemplateColumns: '1fr 380px', gap: '32px'}}>
          {/* Cart Items */}
          <div>
            {cart.length === 0 ? (
              <div style={{
                background: '#FFFFFF',
                padding: '60px 20px',
                textAlign: 'center',
                borderRadius: '8px'
              }}>
                <i className="fas fa-shopping-bag" style={{fontSize: '48px', color: '#DDD', marginBottom: '16px'}}></i>
                <h2 style={{color: '#999', margin: '0 0 8px 0'}}>Your Cart is Empty</h2>
                <p style={{color: '#BBB', margin: '0 0 24px 0'}}>Add some items to get started!</p>
                <Link to="/products" style={{
                  display: 'inline-block',
                  background: '#111',
                  color: '#FFF',
                  padding: '12px 24px',
                  borderRadius: '30px',
                  textDecoration: 'none',
                  fontWeight: '500'
                }}>
                  Continue Shopping
                </Link>
              </div>
            ) : (
              <div style={{display: 'grid', gap: '16px'}}>
                {cart.map(item => (
                  <div key={item.product_id} style={{
                    background: '#FFFFFF',
                    padding: '20px',
                    borderRadius: '8px',
                    border: '1px solid #E5E5E5',
                    display: 'grid',
                    gridTemplateColumns: '100px 1fr 1fr',
                    gap: '20px',
                    alignItems: 'center'
                  }}>
                    {/* Product Image */}
                    {item.image && (
                      <img
                        src={buildApiAssetUrl(`/storage/${item.image}`)}
                        alt={item.name}
                        style={{
                          width: '100px',
                          height: '100px',
                          objectFit: 'cover',
                          borderRadius: '8px',
                          background: '#F5F5F5'
                        }}
                      />
                    )}

                    {/* Product Details */}
                    <div>
                      <h3 style={{
                        margin: 0,
                        marginBottom: '8px',
                        fontSize: '16px',
                        fontWeight: '600',
                        color: '#111'
                      }}>
                        {item.name}
                      </h3>
                      <div style={{
                        display: 'flex',
                        gap: '16px',
                        marginBottom: '8px',
                        fontSize: '13px',
                        color: '#666'
                      }}>
                        {item.size && <span>Size: <strong>{item.size}</strong></span>}
                        {item.color && <span>Color: <strong>{item.color}</strong></span>}
                      </div>
                      <p style={{
                        margin: 0,
                        fontSize: '15px',
                        fontWeight: '500',
                        color: '#FF6B00'
                      }}>
                        ₱{parseFloat(item.price).toFixed(2)}
                      </p>
                    </div>

                    {/* Quantity & Actions */}
                    <div style={{textAlign: 'right'}}>
                      <div style={{
                        display: 'flex',
                        alignItems: 'center',
                        gap: '8px',
                        marginBottom: '12px',
                        justifyContent: 'flex-end'
                      }}>
                        <button
                          onClick={() => handleQuantityChange(item.product_id, item.quantity - 1)}
                          style={{
                            width: '32px',
                            height: '32px',
                            border: '1px solid #DDD',
                            background: '#FFF',
                            fontWeight: '600',
                            cursor: 'pointer',
                            borderRadius: '4px'
                          }}
                        >
                          −
                        </button>
                        <span style={{
                          width: '40px',
                          textAlign: 'center',
                          fontWeight: '600',
                          color: '#111'
                        }}>
                          {item.quantity}
                        </span>
                        <button
                          onClick={() => handleQuantityChange(item.product_id, item.quantity + 1)}
                          style={{
                            width: '32px',
                            height: '32px',
                            border: '1px solid #DDD',
                            background: '#FFF',
                            fontWeight: '600',
                            cursor: 'pointer',
                            borderRadius: '4px'
                          }}
                        >
                          +
                        </button>
                      </div>
                      <p style={{
                        margin: 0,
                        fontSize: '15px',
                        fontWeight: '600',
                        color: '#111',
                        marginBottom: '12px'
                      }}>
                        ₱{(parseFloat(item.price) * item.quantity).toFixed(2)}
                      </p>
                      <div style={{display: 'flex', gap: '12px', justifyContent: 'flex-end'}}>
                        <button
                          onClick={() => navigate(`/product/${item.product_id}?edit=true`)}
                          style={{
                            background: 'transparent',
                            color: '#111',
                            border: 'none',
                            fontSize: '14px',
                            fontWeight: '500',
                            cursor: 'pointer',
                            textDecoration: 'underline'
                          }}
                        >
                          Edit
                        </button>
                        <button
                          onClick={() => handleRemoveItem(item.product_id)}
                          style={{
                            background: 'transparent',
                            color: '#F44336',
                            border: 'none',
                            fontSize: '14px',
                            fontWeight: '500',
                            cursor: 'pointer',
                            textDecoration: 'underline'
                          }}
                        >
                          Remove
                        </button>
                      </div>
                    </div>
                  </div>
                ))}
              </div>
            )}
          </div>

          {/* Order Summary */}
          <div style={{height: 'fit-content'}}>
            <div style={{
              background: '#FFFFFF',
              padding: '24px',
              borderRadius: '8px',
              border: '1px solid #E5E5E5'
            }}>
              <h2 style={{
                fontSize: '18px',
                fontWeight: '700',
                color: '#111',
                margin: '0 0 20px 0'
              }}>Order Summary</h2>

              <form onSubmit={handleSubmit}>
                {/* Shipping Address */}
                <div style={{marginBottom: '20px'}}>
                  <label style={{
                    display: 'block',
                    fontSize: '13px',
                    fontWeight: '600',
                    color: '#666',
                    marginBottom: '12px',
                    textTransform: 'uppercase'
                  }}>
                    Shipping Address
                  </label>
                  
                  <input
                    type="text"
                    placeholder="Street Address *"
                    value={shippingAddress.street}
                    onChange={(e) => setShippingAddress({...shippingAddress, street: e.target.value})}
                    required
                    style={{
                      width: '100%',
                      padding: '12px',
                      border: '1px solid #DDD',
                      borderRadius: '8px',
                      fontSize: '14px',
                      boxSizing: 'border-box',
                      marginBottom: '12px'
                    }}
                  />
                  
                  <div style={{display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '12px', marginBottom: '12px'}}>
                    <input
                      type="text"
                      placeholder="City *"
                      value={shippingAddress.city}
                      onChange={(e) => setShippingAddress({...shippingAddress, city: e.target.value})}
                      required
                      style={{
                        width: '100%',
                        padding: '12px',
                        border: '1px solid #DDD',
                        borderRadius: '8px',
                        fontSize: '14px',
                        boxSizing: 'border-box'
                      }}
                    />
                    
                    <input
                      type="text"
                      placeholder="State/Province *"
                      value={shippingAddress.state}
                      onChange={(e) => setShippingAddress({...shippingAddress, state: e.target.value})}
                      required
                      style={{
                        width: '100%',
                        padding: '12px',
                        border: '1px solid #DDD',
                        borderRadius: '8px',
                        fontSize: '14px',
                        boxSizing: 'border-box'
                      }}
                    />
                  </div>
                  
                  <div style={{display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '12px'}}>
                    <input
                      type="text"
                      placeholder="Postal Code *"
                      value={shippingAddress.zip}
                      onChange={(e) => setShippingAddress({...shippingAddress, zip: e.target.value})}
                      required
                      style={{
                        width: '100%',
                        padding: '12px',
                        border: '1px solid #DDD',
                        borderRadius: '8px',
                        fontSize: '14px',
                        boxSizing: 'border-box'
                      }}
                    />
                    
                    <input
                      type="text"
                      placeholder="Country *"
                      value={shippingAddress.country}
                      onChange={(e) => setShippingAddress({...shippingAddress, country: e.target.value})}
                      required
                      style={{
                        width: '100%',
                        padding: '12px',
                        border: '1px solid #DDD',
                        borderRadius: '8px',
                        fontSize: '14px',
                        boxSizing: 'border-box'
                      }}
                    />
                  </div>
                </div>

                {/* Payment Method */}
                <div style={{marginBottom: '20px'}}>
                  <label htmlFor="paymentMethod" style={{
                    display: 'block',
                    fontSize: '13px',
                    fontWeight: '600',
                    color: '#666',
                    marginBottom: '8px',
                    textTransform: 'uppercase'
                  }}>
                    Payment Method
                  </label>
                  <select
                    id="paymentMethod"
                    name="paymentMethod"
                    value={paymentMethod}
                    onChange={(e) => setPaymentMethod(e.target.value)}
                    style={{
                      width: '100%',
                      padding: '12px',
                      border: '1px solid #DDD',
                      borderRadius: '8px',
                      fontSize: '14px',
                      background: '#FFF',
                      color: '#111',
                      fontWeight: '600',
                      cursor: 'pointer',
                      boxSizing: 'border-box'
                    }}
                  >
                    <option value="cod">💵 Cash on Delivery</option>
                    <option value="gcash">📱 GCash Payment</option>
                  </select>
                </div>

                {/* Price Summary */}
                <div style={{
                  borderTop: '1px solid #E5E5E5',
                  paddingTop: '16px',
                  marginBottom: '20px'
                }}>
                  <div style={{
                    display: 'flex',
                    justifyContent: 'space-between',
                    marginBottom: '12px',
                    fontSize: '14px'
                  }}>
                    <span style={{color: '#666'}}>Subtotal</span>
                    <span style={{fontWeight: '600', color: '#111'}}>₱{subtotal.toFixed(2)}</span>
                  </div>
                  <div style={{
                    display: 'flex',
                    justifyContent: 'space-between',
                    marginBottom: '12px',
                    fontSize: '14px'
                  }}>
                    <span style={{color: '#666'}}>Shipping Fee</span>
                    <span style={{fontWeight: '600', color: '#111'}}>₱{shippingFee.toFixed(2)}</span>
                  </div>
                  <div style={{
                    display: 'flex',
                    justifyContent: 'space-between',
                    paddingTop: '12px',
                    borderTop: '1px solid #E5E5E5',
                    fontSize: '16px',
                    fontWeight: '700'
                  }}>
                    <span style={{color: '#111'}}>Total</span>
                    <span style={{color: '#FF6B00'}}>₱{total.toFixed(2)}</span>
                  </div>
                </div>

                {/* Submit Button */}
                <button
                  type="submit"
                  disabled={cart.length === 0 || loading}
                  style={{
                    width: '100%',
                    padding: '12px',
                    background: cart.length === 0 ? '#CCC' : '#111',
                    color: '#FFF',
                    border: 'none',
                    borderRadius: '8px',
                    fontWeight: '600',
                    fontSize: '15px',
                    cursor: cart.length === 0 ? 'not-allowed' : 'pointer',
                    transition: 'all 0.2s'
                  }}
                  onMouseEnter={(e) => !loading && (e.target.style.opacity = '0.8')}
                  onMouseLeave={(e) => !loading && (e.target.style.opacity = '1')}
                >
                  {loading ? 'Processing...' : 'Place Order'}
                </button>
              </form>
            </div>
          </div>
        </div>
      </div>

      {/* GCash Payment Modal */}
      {showGCashModal && gcashPaymentData && (
        <div style={{
          position: 'fixed',
          top: 0,
          left: 0,
          right: 0,
          bottom: 0,
          background: 'rgba(0, 0, 0, 0.7)',
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'center',
          zIndex: 1000,
          padding: '20px',
          overflow: 'auto',
          backdropFilter: 'blur(2px)'
        }}
        onMouseEnter={() => {
          document.body.style.overflow = 'hidden';
          document.documentElement.style.overflow = 'hidden';
        }}
        onMouseLeave={() => {
          document.body.style.overflow = '';
          document.documentElement.style.overflow = '';
        }}
        >
          <div style={{
            background: '#FFFFFF',
            borderRadius: '16px',
            maxWidth: '500px',
            width: '100%',
            maxHeight: '90vh',
            overflow: 'auto',
            padding: '20px',
            paddingTop: '50px',
            position: 'relative',
            boxShadow: '0 10px 40px rgba(0,0,0,0.2)'
          }}>
            {/* Close Button - Big Orange X */}
            <button
              onClick={() => setShowGCashModal(false)}
              style={{
                position: 'absolute',
                top: '10px',
                right: '10px',
                background: '#FF6B00',
                border: 'none',
                fontSize: '28px',
                cursor: 'pointer',
                color: '#FFFFFF',
                padding: '0',
                borderRadius: '50%',
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
                width: '42px',
                height: '42px',
                transition: 'all 0.2s',
                fontWeight: 'bold',
                boxShadow: '0 2px 8px rgba(0,0,0,0.3)',
                zIndex: 10
              }}
              onMouseEnter={(e) => {
                e.currentTarget.style.background = '#E55A00';
                e.currentTarget.style.transform = 'scale(1.15)';
              }}
              onMouseLeave={(e) => {
                e.currentTarget.style.background = '#FF6B00';
                e.currentTarget.style.transform = 'scale(1)';
              }}
              title="Close"
            >
              ×
            </button>

            {/* Header */}
            <div style={{textAlign: 'center', marginBottom: '16px'}}>
              <div style={{
                width: '60px',
                height: '60px',
                background: 'linear-gradient(135deg, #007DFF, #00C6FF)',
                borderRadius: '12px',
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
                margin: '0 auto 16px',
                fontSize: '28px',
                color: '#FFF'
              }}>
                💳
              </div>
              <h2 style={{
                fontSize: '24px',
                fontWeight: '700',
                color: '#111',
                margin: '0 0 8px 0'
              }}>
                GCash Payment
              </h2>
              <p style={{
                fontSize: '14px',
                color: '#666',
                margin: 0
              }}>
                Scan QR code to complete payment
              </p>
            </div>

            {/* Payment Info Box - QR Code Image */}
            <div style={{
              background: '#F5F5F5',
              padding: '16px',
              borderRadius: '12px',
              marginBottom: '16px',
              textAlign: 'center'
            }}>
              <p style={{
                fontSize: '12px',
                color: '#999',
                margin: '0 0 16px 0',
                textTransform: 'uppercase',
                fontWeight: '600'
              }}>
                Scan to Pay:
              </p>
              
              {/* GCash QR Code - Merchant */}
              <div style={{
                background: '#FFFFFF',
                padding: '16px',
                borderRadius: '12px',
                display: 'inline-block',
                boxShadow: '0 2px 8px rgba(0,0,0,0.1)',
                textAlign: 'center'
              }}>
                <img
                  src="/gcash-qr.jpeg"
                  alt="GCash QR Code"
                  style={{
                    width: '200px',
                    height: '200px',
                    objectFit: 'cover',
                    objectPosition: 'center',
                    border: '2px solid #EEE',
                    display: 'block',
                    margin: '0 auto'
                  }}
                />
              </div>

              {/* Amount to Pay */}
              <div style={{
                marginTop: '12px',
                padding: '12px',
                background: '#FFFFFF',
                borderRadius: '8px'
              }}>
                <p style={{fontSize: '12px', color: '#999', margin: '0 0 8px 0'}}>Amount to Pay</p>
                <p style={{fontSize: '28px', fontWeight: '700', color: '#FF6B00', margin: 0}}>
                  ₱{gcashPaymentData.amount.toFixed(2)}
                </p>
              </div>
            </div>

            {/* Payment Details */}
            <div style={{
              background: '#F9F9F9',
              padding: '12px',
              borderRadius: '8px',
              marginBottom: '16px'
            }}>
              <div style={{
                display: 'flex',
                justifyContent: 'space-between',
                marginBottom: '8px',
                fontSize: '14px'
              }}>
                <span style={{color: '#666'}}>Amount to Pay:</span>
                <span style={{fontWeight: '700', fontSize: '18px', color: '#FF6B00'}}>
                  ₱{gcashPaymentData.amount.toFixed(2)}
                </span>
              </div>
              <div style={{
                display: 'flex',
                justifyContent: 'space-between',
                marginBottom: '8px',
                fontSize: '13px'
              }}>
                <span style={{color: '#666'}}>Reference Number:</span>
                <span style={{fontWeight: '600', color: '#111', fontFamily: 'monospace'}}>
                  {gcashPaymentData.referenceNumber}
                </span>
              </div>
              <div style={{
                display: 'flex',
                justifyContent: 'space-between',
                fontSize: '13px'
              }}>
                <span style={{color: '#666'}}>Merchant:</span>
                <span style={{fontWeight: '600', color: '#111'}}>
                  {gcashPaymentData.merchantName}
                </span>
              </div>
            </div>

            {/* Instructions */}
            <div style={{
              background: '#E3F2FD',
              padding: '12px',
              borderRadius: '8px',
              marginBottom: '16px'
            }}>
              <h3 style={{
                fontSize: '13px',
                fontWeight: '700',
                color: '#1976D2',
                margin: '0 0 12px 0',
                textTransform: 'uppercase'
              }}>
                How to Pay:
              </h3>
              <ol style={{
                margin: 0,
                paddingLeft: '20px',
                fontSize: '13px',
                color: '#555',
                lineHeight: '1.8'
              }}>
                <li>Open your <strong>GCash App</strong></li>
                <li>Tap <strong>"Send Money"</strong> or <strong>"Scan QR"</strong></li>
                <li>Scan the QR code above OR enter amount: <strong>₱{gcashPaymentData.amount.toFixed(2)}</strong></li>
                <li>Review payment details and confirm</li>
                <li>Your order will be confirmed immediately</li>
              </ol>
            </div>

            <div style={{ marginBottom: '12px' }}>
              <label style={{
                display: 'block',
                fontSize: '12px',
                fontWeight: '700',
                color: '#333',
                marginBottom: '6px',
                textTransform: 'uppercase'
              }}>
                GCash Reference Number
              </label>
              <input
                type="text"
                value={gcashReference}
                onChange={(e) => setGCashReference(e.target.value)}
                placeholder="Enter GCash reference number"
                style={{
                  width: '100%',
                  boxSizing: 'border-box',
                  padding: '10px 12px',
                  borderRadius: '8px',
                  border: '1px solid #DDD',
                  fontSize: '14px'
                }}
              />
            </div>

            <div style={{ marginBottom: '16px' }}>
              <label style={{
                display: 'block',
                fontSize: '12px',
                fontWeight: '700',
                color: '#333',
                marginBottom: '6px',
                textTransform: 'uppercase'
              }}>
                Upload Payment Screenshot
              </label>
              <input
                type="file"
                accept="image/jpeg,image/png,image/jpg"
                onChange={(e) => setGCashScreenshotFile(e.target.files?.[0] || null)}
                style={{
                  width: '100%',
                  boxSizing: 'border-box',
                  fontSize: '13px'
                }}
              />
              <p style={{ fontSize: '11px', color: '#777', margin: '6px 0 0 0' }}>
                Accepted formats: JPG, JPEG, PNG (max 5MB)
              </p>
            </div>

            {/* Action Buttons */}
            <div style={{display: 'flex', gap: '12px'}}>
              <button
                onClick={handleGCashProceed}
                disabled={loading}
                style={{
                  flex: 1,
                  padding: '12px',
                  background: '#111',
                  color: '#FFF',
                  border: 'none',
                  borderRadius: '8px',
                  fontWeight: '600',
                  fontSize: '14px',
                  cursor: loading ? 'not-allowed' : 'pointer',
                  opacity: loading ? 0.7 : 1
                }}
              >
                {loading ? 'Submitting...' : 'Proceed'}
              </button>
              <button
                onClick={() => setShowGCashModal(false)}
                style={{
                  flex: 1,
                  padding: '12px',
                  background: '#F5F5F5',
                  color: '#666',
                  border: 'none',
                  borderRadius: '8px',
                  fontWeight: '600',
                  fontSize: '14px',
                  cursor: 'pointer'
                }}
              >
                Close
              </button>
            </div>

            {/* Warning */}
            <p style={{
              fontSize: '11px',
              color: '#999',
              textAlign: 'center',
              margin: '16px 0 0 0',
              lineHeight: '1.6'
            }}>
              ⚠️ Make sure to save your reference number for tracking. Your order will be confirmed after payment verification.
            </p>
          </div>
        </div>
      )}
    </div>
  );
};

export default Checkout;