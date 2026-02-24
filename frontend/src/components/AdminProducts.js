import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import axios from 'axios';

const AdminProducts = () => {
  const [products, setProducts] = useState([]);
  const navigate = useNavigate();

  // Check authentication on component mount
  useEffect(() => {
    const token = localStorage.getItem('token');
    if (!token) {
      navigate('/login');
      return;
    }
  }, [navigate]);

  useEffect(() => {
    axios.get('/api/products').then(res => setProducts(res.data.data)).catch(err => {
      console.error('Failed to fetch products:', err);
      if (err.response?.status === 401) {
        localStorage.removeItem('token');
        navigate('/login');
      }
    });
  }, [navigate]);

  const deleteProduct = (productId) => {
    if (window.confirm('Are you sure you want to delete this product?')) {
      axios.delete(`/api/products/${productId}`).then(() => {
        setProducts(products.filter(p => p.id !== productId));
      }).catch(err => console.error('Failed to delete product:', err));
    }
  };

  return (
    <div className="container mt-5">
      <div className="d-flex justify-content-between align-items-center mb-4">
        <h1>Product Management</h1>
        <button className="btn btn-secondary" onClick={() => navigate('/admin-dashboard')}>
          <i className="fas fa-arrow-left"></i> Back to Dashboard
        </button>
      </div>
      <div className="table-responsive">
        <table className="table table-modern table-sm">
          <thead>
            <tr>
              <th>Name</th>
              <th>Brand</th>
              <th>Price</th>
              <th>Seller</th>
              <th>Actions</th>
            </tr>
          </thead>
          <tbody>
            {products.map(p => (
              <tr key={p.id}>
                  <td>
                    <button className="btn btn-link p-0" onClick={() => navigate(`/admin-product/${p.id}`)}>
                      {p.name}
                    </button>
                  </td>
                <td>{p.brand}</td>
                <td>${p.price}</td>
                <td>{p.seller?.name || 'N/A'}</td>
                <td>
                  <button className="btn btn-sm btn-danger" onClick={() => deleteProduct(p.id)}>Delete</button>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </div>
  );
};

export default AdminProducts;