import React, { useState, useEffect } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import axios from 'axios';

const ProductDetail = () => {
  const { id } = useParams();
  const navigate = useNavigate();
  const [product, setProduct] = useState(null);
  const [selectedSku, setSelectedSku] = useState(null);

  useEffect(() => {
    axios.get(`/api/products/${id}`).then(res => setProduct(res.data));
  }, [id]);

  const addToCart = () => {
    const token = localStorage.getItem('token');
    if (!token) {
      navigate('/login');
      return;
    }
    if (!selectedSku) return;
    const cart = JSON.parse(localStorage.getItem('cart') || '[]');
    const existing = cart.find(item => item.sku_id === selectedSku.id);
    if (existing) {
      existing.quantity += 1;
    } else {
      cart.push({ sku_id: selectedSku.id, quantity: 1 });
    }
    localStorage.setItem('cart', JSON.stringify(cart));
    alert('Added to cart');
  };

  if (!product) return <div>Loading...</div>;

  return (
    <div className="container mt-5">
      <div className="row">
        <div className="col-md-6">
          <img src={product.image ? `http://localhost:8000/storage/${product.image}` : '/default.jpg'} alt={product.name} className="img-fluid rounded shadow" />
        </div>
        <div className="col-md-6">
          <div className="card shadow-sm">
            <div className="card-body">
              <h1 className="mb-3" style={{fontSize: '2.5rem', fontWeight: '300'}}>{product.name}</h1>
              <p className="card-text">{product.description}</p>
              <h4 className="text-primary">Price: ${product.price}</h4>
              <div className="mb-3">
                <h3>SKUs</h3>
                {product.skus.map(sku => (
                  <div key={sku.id} className="form-check">
                    <input className="form-check-input" type="radio" name="sku" onChange={() => setSelectedSku(sku)} />
                    <label className="form-check-label">
                      Size: {sku.size}, Color: {sku.colorway}, Width: {sku.width}, Stock: {sku.stock}
                    </label>
                  </div>
                ))}
              </div>
              <button className="btn btn-success btn-lg" onClick={addToCart} disabled={!selectedSku}>Add to Cart</button>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

export default ProductDetail;