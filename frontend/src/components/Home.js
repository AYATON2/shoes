import React from 'react';
import { Link, useNavigate } from 'react-router-dom';
import ProductList from './ProductList';

const Home = () => {
  const navigate = useNavigate();

  const handleShopNow = () => {
    navigate('/products');
  };

  return (
    <div style={{ background: '#FFFFFF', minHeight: '100vh' }}>
      
      {/* Hero Section - Clean Nike Style */}
      <div style={{
        position: 'relative',
        height: '90vh',
        width: '100%',
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'center',
        overflow: 'hidden',
        background: '#000'
      }}>
        {/* Background Image */}
        <div style={{
          position: 'absolute',
          top: 0,
          left: 0,
          width: '100%',
          height: '100%',
          backgroundImage: 'url("/hero-shoe.png")',
          backgroundSize: 'cover',
          backgroundPosition: 'center',
          opacity: '0.6',
          transform: 'scale(1.1)',
          animation: 'zoomOut 20s infinite alternate ease-in-out'
        }} />

        <div className="animate-fade" style={{ 
          position: 'relative',
          maxWidth: '1200px', 
          margin: '0 auto',
          textAlign: 'center',
          padding: '0 20px',
          zIndex: 2
        }}>
          <p style={{
            fontSize: '14px',
            fontWeight: '700',
            color: '#FFF',
            marginBottom: '16px',
            letterSpacing: '4px',
            textTransform: 'uppercase',
            opacity: '0.9'
          }}>
            Est. 2024 • Premium Collection
          </p>
          <h1 style={{
            fontSize: 'clamp(48px, 8vw, 100px)',
            fontWeight: '900',
            color: '#FFF',
            marginBottom: '24px',
            lineHeight: '0.9',
            letterSpacing: '-0.05em',
            textShadow: '0 10px 30px rgba(0,0,0,0.5)'
          }}>
            MOVE WITH<br />PURPOSE
          </h1>
          <p style={{
            fontSize: 'clamp(16px, 2vw, 20px)',
            color: 'rgba(255,255,255,0.8)',
            marginBottom: '48px',
            maxWidth: '600px',
            margin: '0 auto 48px',
            lineHeight: '1.6',
            fontWeight: '400'
          }}>
            Elevate your journey with footwear designed for ultimate performance and timeless style.
          </p>
          <div style={{ display: 'flex', gap: '20px', justifyContent: 'center', flexWrap: 'wrap' }}>
            <button
              onClick={handleShopNow}
              style={{
                background: '#FFF',
                color: '#000',
                padding: '18px 48px',
                fontSize: '16px',
                fontWeight: '700',
                borderRadius: '40px',
                border: 'none',
                cursor: 'pointer',
                transition: 'all 0.3s cubic-bezier(0.4, 0, 0.2, 1)',
                boxShadow: '0 10px 20px rgba(0,0,0,0.2)'
              }}
              onMouseEnter={(e) => { e.currentTarget.style.transform = 'translateY(-3px)'; e.currentTarget.style.boxShadow = '0 15px 30px rgba(0,0,0,0.3)'; }}
              onMouseLeave={(e) => { e.currentTarget.style.transform = 'translateY(0)'; e.currentTarget.style.boxShadow = '0 10px 20px rgba(0,0,0,0.2)'; }}
            >
              Shop Collection
            </button>
          </div>
        </div>

        {/* CSS Animation */}
        <style>{`
          @keyframes zoomOut {
            0% { transform: scale(1.1); }
            100% { transform: scale(1.2); }
          }
          @keyframes fadeIn {
            from { opacity: 0; transform: translateY(20px); }
            to { opacity: 1; transform: translateY(0); }
          }
          .animate-fade {
            animation: fadeIn 0.8s cubic-bezier(0.4, 0, 0.2, 1) forwards;
          }
        `}</style>
      </div>

      {/* Featured Products Section (replaces static Essentials) */}
      <div style={{
        padding: '100px 20px',
        maxWidth: '1400px',
        margin: '0 auto'
      }}>
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-end', marginBottom: '32px' }}>
          <div>
            <h2 style={{ fontSize: '32px', fontWeight: '800', margin: '0 0 8px 0', letterSpacing: '-1px' }}>New Arrivals & Best Sellers</h2>
            <p style={{ color: '#666', fontSize: '16px', margin: 0 }}>Explore our latest drops and most popular picks.</p>
          </div>
          <Link to="/products" style={{ color: '#111', fontWeight: '700', fontSize: '15px', textDecoration: 'none', borderBottom: '2px solid #111', paddingBottom: '4px' }}>
            Shop All →
          </Link>
        </div>
        
        {/* Render actual products just like Customer Dashboard */}
        <ProductList limit={8} />

        {/* Guest CTA */}
        {!localStorage.getItem('token') && (
          <div style={{ 
            marginTop: '60px', 
            padding: '40px', 
            background: '#F9F9F9', 
            borderRadius: '24px', 
            textAlign: 'center',
            border: '1px solid #EEE'
          }}>
            <h3 style={{ fontSize: '24px', fontWeight: '700', marginBottom: '16px' }}>Join the Community</h3>
            <p style={{ color: '#666', marginBottom: '24px', maxWidth: '500px', margin: '0 auto 24px' }}>Sign in or sign up to unlock exclusive drops, manage your orders, and get personalized recommendations.</p>
            <div style={{ display: 'flex', gap: '16px', justifyContent: 'center' }}>
              <Link to="/login" style={{ background: '#111', color: '#FFF', padding: '12px 32px', borderRadius: '30px', textDecoration: 'none', fontWeight: '600' }}>Sign In</Link>
              <Link to="/register" style={{ background: '#FFF', color: '#111', padding: '12px 32px', borderRadius: '30px', textDecoration: 'none', fontWeight: '600', border: '1px solid #E5E5E5' }}>Create Account</Link>
            </div>
          </div>
        )}
      </div>

      {/* Why Choose Us */}
      <div style={{
        background: '#F5F5F5',
        padding: '60px 20px'
      }}>
        <div className="animate-fade" style={{ maxWidth: '1200px', margin: '0 auto' }}>
          <h2 style={{
            fontSize: '36px',
            fontWeight: '700',
            color: '#111',
            textAlign: 'center',
            marginBottom: '48px'
          }}>
            Why Shop With Us
          </h2>
          <div style={{
            display: 'grid',
            gridTemplateColumns: 'repeat(auto-fit, minmax(250px, 1fr))',
            gap: '32px'
          }}>
            {[
              { icon: 'fa-shield-alt', title: 'Authentic Products', desc: '100% genuine footwear from seller' },
              { icon: 'fa-truck', title: 'Fast Delivery', desc: 'Quick and reliable shipping nationwide' },
              { icon: 'fa-undo', title: 'Easy Returns', desc: '30-day hassle-free return policy' },
              { icon: 'fa-headset', title: '24/7 Support', desc: 'Our team is always here to help you' }
            ].map((feature, idx) => (
              <div key={idx} style={{ textAlign: 'center' }}>
                <i className={`fas ${feature.icon}`} style={{
                  fontSize: '32px',
                  marginBottom: '16px',
                  display: 'block',
                  color: '#111'
                }}></i>
                <h4 style={{
                  fontSize: '18px',
                  fontWeight: '600',
                  marginBottom: '8px',
                  color: '#111'
                }}>
                  {feature.title}
                </h4>
                <p style={{
                  fontSize: '14px',
                  color: '#757575',
                  lineHeight: '1.6'
                }}>
                  {feature.desc}
                </p>
              </div>
            ))}
          </div>
        </div>
      </div>

      {/* CTA Section */}
      <div className="animate-fade" style={{ 
        padding: '80px 20px',
        textAlign: 'center',
        background: '#FFF'
      }}>
        <div style={{ maxWidth: '800px', margin: '0 auto' }}>
          <h2 style={{
            fontSize: '48px',
            fontWeight: '700',
            color: '#111',
            marginBottom: '16px',
            lineHeight: '1.2'
          }}>
            Find Your Perfect Pair
          </h2>
          <p style={{
            fontSize: '16px',
            color: '#757575',
            marginBottom: '32px',
            lineHeight: '1.6'
          }}>
            Join thousands of satisfied customers. Browse our collection and step up your shoe game today.
          </p>
          <Link
            to="/products"
            style={{
              background: '#111',
              color: '#FFF',
              padding: '16px 32px',
              fontSize: '16px',
              fontWeight: '500',
              textDecoration: 'none',
              borderRadius: '30px',
              display: 'inline-block',
              transition: 'all 0.2s ease'
            }}
            onMouseEnter={(e) => { e.currentTarget.style.opacity = '0.8'; }}
            onMouseLeave={(e) => { e.currentTarget.style.opacity = '1'; }}
          >
            Explore Collection
          </Link>
        </div>
      </div>

    </div>
  );
};

export default Home;
