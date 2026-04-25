import React, { useState, useEffect } from 'react';
import axios from 'axios';

const ReviewManager = () => {
  const [reviews, setReviews] = useState([]);
  const [loading, setLoading] = useState(false);

  useEffect(() => {
    fetchReviews();
  }, []);

  const fetchReviews = () => {
    setLoading(true);
    axios.get('/api/admin/reviews').then(res => {
      setReviews(res.data);
      setLoading(false);
    }).catch(err => {
      console.error('Failed to fetch reviews:', err);
      setLoading(false);
    });
  };

  const toggleArchive = (id) => {
    axios.patch(`/api/reviews/${id}/archive`).then(() => {
      fetchReviews();
    }).catch(err => console.error(err));
  };

  // Helper function to render stars
  const renderStars = (rating) => {
    const stars = [];
    for (let i = 1; i <= 5; i++) {
      stars.push(
        <i 
          key={i} 
          className={i <= rating ? 'fas fa-star' : 'far fa-star'} 
          style={{ color: i <= rating ? '#FFD700' : '#E0E0E0', fontSize: '14px' }}
        ></i>
      );
    }
    return stars;
  };

  return (
    <div className="fade-in">
      <div style={{ marginBottom: 'var(--spacing-lg)' }}>
        <h2 style={{ fontSize: 'var(--font-size-2xl)', fontWeight: 700 }}>Review Management</h2>
        <p style={{ color: 'var(--gray-600)' }}>Monitor and moderate product reviews</p>
      </div>

      <div className="card">
        <div className="card-header">
          <h3 style={{ margin: 0 }}>All Product Reviews</h3>
        </div>
        <div className="card-body">
          {loading ? (
            <div style={{ textAlign: 'center', padding: 'var(--spacing-xl)' }}>Loading...</div>
          ) : (
            <div className="table-responsive">
              <table className="premium-table">
                <thead>
                  <tr>
                    <th>Customer</th>
                    <th>Product</th>
                    <th>Rating</th>
                    <th>Comment</th>
                    <th>Status</th>
                    <th>Actions</th>
                  </tr>
                </thead>
                <tbody>
                  {reviews.map(review => (
                    <tr key={review.id}>
                      <td style={{ fontWeight: 500 }}>{review.user?.name || 'Unknown User'}</td>
                      <td>{review.product?.name || 'Unknown Product'}</td>
                      <td style={{ minWidth: '100px' }}>{renderStars(review.rating)}</td>
                      <td style={{ maxWidth: '300px', whiteSpace: 'nowrap', overflow: 'hidden', textOverflow: 'ellipsis' }}>
                        {review.comment || <span style={{ color: '#999', fontStyle: 'italic' }}>No comment</span>}
                      </td>
                      <td>
                        <span className={`badge badge-${review.is_archived ? 'secondary' : 'success'}`}>
                          {review.is_archived ? 'Archived' : 'Published'}
                        </span>
                      </td>
                      <td>
                        <button 
                          className={`btn btn-sm ${review.is_archived ? 'btn-success' : 'btn-warning'}`} 
                          onClick={() => toggleArchive(review.id)}
                        >
                          {review.is_archived ? 'Unarchive' : 'Archive'}
                        </button>
                      </td>
                    </tr>
                  ))}
                  {reviews.length === 0 && (
                    <tr>
                      <td colSpan="6" style={{ textAlign: 'center', padding: 'var(--spacing-md)' }}>No reviews found.</td>
                    </tr>
                  )}
                </tbody>
              </table>
            </div>
          )}
        </div>
      </div>
    </div>
  );
};

export default ReviewManager;
