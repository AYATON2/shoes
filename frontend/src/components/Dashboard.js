import React, { useState, useEffect } from 'react';
import axios from 'axios';

const Dashboard = () => {
  const [user, setUser] = useState(null);
  const [orders, setOrders] = useState([]);
  const [addresses, setAddresses] = useState([]);
  const [newAddress, setNewAddress] = useState({ street: '', city: '', state: '', zip: '', country: '', is_default: false });

  useEffect(() => {
    axios.get('/api/user').then(res => setUser(res.data));
    axios.get('/api/orders').then(res => setOrders(res.data.data));
    axios.get('/api/addresses').then(res => setAddresses(res.data));
  }, []);

  const addAddress = (e) => {
    e.preventDefault();
    axios.post('/api/addresses', newAddress).then(res => {
      setAddresses([...addresses, res.data]);
      setNewAddress({ street: '', city: '', state: '', zip: '', country: '', is_default: false });
    });
  };

  if (!user) return <div>Loading...</div>;

  return (
    <div className="container">
      <h1>Dashboard - {user.role}</h1>
      {user.role === 'customer' && (
        <div>
          <h2>My Orders</h2>
          {orders.map(order => (
            <div key={order.id}>
              Order #{order.id} - Status: {order.status} - Total: ${order.total}
              <button onClick={() => axios.get(`/api/orders/${order.id}/invoice`).then(res => console.log(res.data))}>View Invoice</button>
            </div>
          ))}
          <h2>My Addresses</h2>
          <form onSubmit={addAddress}>
            <input placeholder="Street" value={newAddress.street} onChange={(e) => setNewAddress({ ...newAddress, street: e.target.value })} required />
            <input placeholder="City" value={newAddress.city} onChange={(e) => setNewAddress({ ...newAddress, city: e.target.value })} required />
            <input placeholder="State" value={newAddress.state} onChange={(e) => setNewAddress({ ...newAddress, state: e.target.value })} required />
            <input placeholder="Zip" value={newAddress.zip} onChange={(e) => setNewAddress({ ...newAddress, zip: e.target.value })} required />
            <input placeholder="Country" value={newAddress.country} onChange={(e) => setNewAddress({ ...newAddress, country: e.target.value })} required />
            <label><input type="checkbox" checked={newAddress.is_default} onChange={(e) => setNewAddress({ ...newAddress, is_default: e.target.checked })} /> Default</label>
            <button type="submit">Add Address</button>
          </form>
          {addresses.map(addr => (
            <div key={addr.id}>{addr.street}, {addr.city} {addr.is_default && '(Default)'}</div>
          ))}
        </div>
      )}
      {user.role === 'seller' && (
        <div>
          <h2>My Products</h2>
          <button onClick={() => {/* Add product form */}}>Add Product</button>
          {/* List products */}
        </div>
      )}
      {user.role === 'admin' && (
        <div>
          <h2>Admin Panel</h2>
          <button onClick={() => axios.get('/api/reports/inventory').then(res => console.log(res.data))}>View Inventory Report</button>
          <button onClick={() => axios.get('/api/reports/sales').then(res => console.log(res.data))}>View Sales Report</button>
          <button onClick={() => axios.get('/api/reports/orders').then(res => console.log(res.data))}>View Order Status Report</button>
        </div>
      )}
    </div>
  );
};

export default Dashboard;