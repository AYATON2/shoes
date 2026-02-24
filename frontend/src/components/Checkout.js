import React, { useState, useEffect } from 'react';
import { useNavigate, Link } from 'react-router-dom';
import axios from 'axios';
import Notification from './Notification';

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

  const handleSubmit = (e) => {
    e.preventDefault();
    
    if (cart.length === 0) {
      setNotification({ message: 'Your cart is empty!', type: 'error' });
      return;
    }

    // Validate shipping address
    if (!shippingAddress.street || !shippingAddress.city || !shippingAddress.state || !shippingAddress.zip || !shippingAddress.country) {
      setNotification({ message: 'Please fill in all required shipping address fields', type: 'error' });
      return;
    }

    setLoading(true);
    const items = cart.map(item => ({
      sku_id: item.sku_id,
      quantity: item.quantity
    }));

    // First create the address
    axios.post('/api/addresses', shippingAddress)
      .then(addressRes => {
        // Then create the order with the new address ID
        return axios.post('/api/orders', {
          items,
          shipping_address_id: addressRes.data.id || addressRes.data.data.id,
          payment_method: paymentMethod
        });
      })
      .then(res => {
        setNotification({ message: 'Order placed successfully!', type: 'success' });
        localStorage.removeItem('cart');
        setCart([]);
        setTimeout(() => navigate('/customer-dashboard'), 2000);
      })
      .catch(err => {
        console.error('Order placement error:', err.response?.data || err.message);
        let errorMsg = 'Order failed. Please try again.';
        
        if (err.response?.data?.errors) {
          // Validation errors
          const errors = err.response.data.errors;
          errorMsg = Object.values(errors).flat().join(', ');
        } else if (err.response?.data?.error) {
          errorMsg = err.response.data.error;
        } else if (err.response?.data?.message) {
          errorMsg = err.response.data.message;
        }
        
        setNotification({ message: errorMsg, type: 'error' });
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
                        src={`http://localhost:8000/storage/${item.image}`}
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
                  <label style={{
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
                    value={paymentMethod}
                    onChange={(e) => setPaymentMethod(e.target.value)}
                    style={{
                      width: '100%',
                      padding: '12px',
                      border: '1px solid #DDD',
                      borderRadius: '8px',
                      fontSize: '14px',
                      boxSizing: 'border-box'
                    }}
                  >
                    <option value="cod">Cash on Delivery</option>
                    <option value="gcash">GCash</option>
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
    </div>
  );
};

export default Checkout;