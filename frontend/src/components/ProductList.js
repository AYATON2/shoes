import React, { useState, useEffect, useCallback } from 'react';
import { Link } from 'react-router-dom';
import axios from 'axios';

const ProductList = () => {
  const [products, setProducts] = useState([]);
  const [filters, setFilters] = useState({});
  const [filterOptions, setFilterOptions] = useState({ brands: [], types: [], performance_tech: [] });

  const fetchProducts = useCallback(() => {
    axios.get('/api/products', { params: filters }).then(res => setProducts(res.data.data));
  }, [filters]);

  useEffect(() => {
    fetchProducts();
  }, [fetchProducts]);

  useEffect(() => {
    axios.get('/api/products/filter-options').then(res => setFilterOptions(res.data));
  }, []);

  const handleFilterChange = (e) => {
    setFilters({ ...filters, [e.target.name]: e.target.value });
  };

  return (
    <div className="container mt-5">
      <h1 className="text-center" style={{fontSize: '2.5rem', fontWeight: '300'}}>Products</h1>
      <div className="filters row mb-4">
        <div className="col-md-4">
          <input name="brand" placeholder="Brand" onChange={handleFilterChange} className="form-control" list="brands" />
          <datalist id="brands">
            {filterOptions.brands.map(brand => <option key={brand} value={brand} />)}
          </datalist>
        </div>
        <div className="col-md-4">
          <input name="type" placeholder="Type" onChange={handleFilterChange} className="form-control" list="types" />
          <datalist id="types">
            {filterOptions.types.map(type => <option key={type} value={type} />)}
          </datalist>
        </div>
        <div className="col-md-4">
          <input name="performance_tech" placeholder="Performance Tech" onChange={handleFilterChange} className="form-control" list="performance_tech" />
          <datalist id="performance_tech">
            {filterOptions.performance_tech.map(tech => <option key={tech} value={tech} />)}
          </datalist>
        </div>
        <div className="col-md-12 mt-2">
          <button onClick={fetchProducts} className="btn btn-primary btn-block">Apply Filters</button>
        </div>
      </div>
      <div className="row">
        {products.map(product => (
          <div key={product.id} className="col-md-4 mb-4">
            <div className="card shadow-sm h-100">
              <img src={product.image ? `http://localhost:8000/storage/${product.image}` : '/default.jpg'} className="card-img-top" alt={product.name} style={{height: '200px', objectFit: 'cover'}} />
              <div className="card-body d-flex flex-column">
                <h5 className="card-title">{product.name}</h5>
                <p className="card-text text-muted">{product.description.substring(0, 100)}...</p>
                <h6 className="text-primary">${product.price}</h6>
                <Link to={`/product/${product.id}`} target="_blank" rel="noopener noreferrer" className="btn btn-outline-primary mt-auto">View Details</Link>
              </div>
            </div>
          </div>
        ))}
      </div>
    </div>
  );
};

export default ProductList;