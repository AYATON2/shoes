import React from 'react';
import { Link, useNavigate } from 'react-router-dom';

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

      {/* Featured Section */}
      <div style={{
        padding: '100px 20px',
        maxWidth: '1400px',
        margin: '0 auto'
      }}>
        <h2 style={{ fontSize: '24px', fontWeight: '600', marginBottom: '32px' }}>The Essentials</h2>
        <div style={{
          display: 'grid',
          gridTemplateColumns: 'repeat(auto-fit, minmax(400px, 1fr))',
          gap: '12px'
        }}>
          {[
            { title: 'New Arrivals', subtitle: 'Shop the latest styles', icon: 'fa-bolt', filter: 'new', img: 'https://images.unsplash.com/photo-1542291026-7eec264c27ff?auto=format&fit=crop&q=80&w=800' },
            { title: 'Best Sellers', subtitle: 'Our most popular picks', icon: 'fa-fire', filter: 'bestseller', img: 'https://images.unsplash.com/photo-1595950653106-6c9ebd614d3a?auto=format&fit=crop&q=80&w=800' },
            { title: 'Sale', subtitle: 'Exclusive discounts', icon: 'fa-tag', filter: 'sale', img: 'https://images.unsplash.com/photo-1549298916-b41d501d3772?auto=format&fit=crop&q=80&w=800' }
          ].map((item, idx) => (
            <Link
              key={idx}
              to={`/products?filter=${item.filter}`}
              style={{
                height: '500px',
                position: 'relative',
                display: 'flex',
                alignItems: 'flex-end',
                padding: '40px',
                textDecoration: 'none',
                color: '#FFF',
                overflow: 'hidden',
                borderRadius: '4px',
                transition: 'all 0.3s ease'
              }}
              onMouseEnter={(e) => { e.currentTarget.querySelector('img').style.transform = 'scale(1.05)'; }}
              onMouseLeave={(e) => { e.currentTarget.querySelector('img').style.transform = 'scale(1)'; }}
            >
              <img 
                src={item.img} 
                alt={item.title}
                style={{
                  position: 'absolute',
                  top: 0,
                  left: 0,
                  width: '100%',
                  height: '100%',
                  objectFit: 'cover',
                  zIndex: 1,
                  transition: 'transform 0.8s cubic-bezier(0.4, 0, 0.2, 1)'
                }}
              />
              <div style={{
                position: 'absolute',
                top: 0,
                left: 0,
                width: '100%',
                height: '100%',
                background: 'linear-gradient(to top, rgba(0,0,0,0.6) 0%, transparent 50%)',
                zIndex: 2
              }} />
              <div style={{ position: 'relative', zIndex: 3 }}>
                <h3 style={{ fontSize: '24px', fontWeight: '700', margin: '0 0 8px 0' }}>{item.title}</h3>
                <p style={{ fontSize: '15px', opacity: 0.9 }}>{item.subtitle}</p>
                <button style={{
                  marginTop: '16px',
                  background: '#FFF',
                  color: '#111',
                  border: 'none',
                  padding: '8px 20px',
                  borderRadius: '20px',
                  fontWeight: '600',
                  fontSize: '14px',
                  cursor: 'pointer'
                }}>Shop</button>
              </div>
            </Link>
          ))}
        </div>
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
