import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import axios from 'axios';

const Checkout = () => {
  const [cart, setCart] = useState(JSON.parse(localStorage.getItem('cart') || '[]'));
  const [addresses, setAddresses] = useState([]);
  const [addressId, setAddressId] = useState('');
  const [paymentMethod, setPaymentMethod] = useState('cod');
  const navigate = useNavigate();

  useEffect(() => {
    const token = localStorage.getItem('token');
    if (!token) {
      navigate('/login');
      return;
    }
    axios.defaults.headers.common['Authorization'] = `Bearer ${token}`;
    axios.get('/api/addresses').then(res => setAddresses(res.data)).catch(() => navigate('/login'));
  }, [navigate]);

  const handleSubmit = (e) => {
    e.preventDefault();
    const items = cart.map(item => ({ sku_id: item.sku_id, quantity: item.quantity }));
    axios.post('/api/orders', { items, shipping_address_id: addressId, payment_method: paymentMethod })
      .then(res => {
        alert('Order placed');
        localStorage.removeItem('cart');
        setCart([]);
      })
      .catch(err => alert('Order failed'));
  };

  return (
    <div className="container mt-5">
      <div className="row">
        <div className="col-md-8">
          <div className="card shadow-sm">
            <div className="card-header gradient-bg text-white">
              <h1 className="card-title mb-0">Checkout</h1>
            </div>
            <div className="card-body">
              <h2>Your Cart</h2>
              {cart.length === 0 ? <p className="text-muted">Your cart is empty.</p> : cart.map((item, index) => (
                <div key={index} className="d-flex justify-content-between align-items-center border-bottom py-2">
                  <span>SKU {item.sku_id}</span>
                  <span>Qty: {item.quantity}</span>
                </div>
              ))}
            </div>
          </div>
        </div>
        <div className="col-md-4">
          <div className="card shadow-sm">
            <div className="card-body">
              <form onSubmit={handleSubmit}>
                <div className="form-group">
                  <label>Shipping Address</label>
                  <select className="form-control" onChange={(e) => setAddressId(e.target.value)} required>
                    <option value="">Select Address</option>
                    {addresses.map(addr => (
                      <option key={addr.id} value={addr.id}>{addr.street}, {addr.city}</option>
                    ))}
                  </select>
                </div>
                <div className="form-group">
                  <label>Payment Method</label>
                  <select className="form-control" onChange={(e) => setPaymentMethod(e.target.value)}>
                    <option value="cod">Cash on Delivery</option>
                    <option value="gcash">GCash</option>
                  </select>
                </div>
                <p className="mt-3">Shipping Fee: <strong>$50.00</strong></p>
                <p>Total: <strong>${cart.reduce((sum, item) => sum + (item.quantity * 120), 0) + 50}</strong></p>
                <button type="submit" className="btn btn-success btn-block">Place Order</button>
              </form>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

export default Checkout;