import React from 'react';
import { Link } from 'react-router-dom';

const Home = () => {
  return (
    <div style={{ background: '#FFFFFF', minHeight: '100vh' }}>
      
      {/* Hero Section - Clean Nike Style */}
      <div style={{
        background: '#F5F5F5',
        padding: '80px 20px',
        textAlign: 'center'
      }}>
        <div style={{ maxWidth: '1200px', margin: '0 auto' }}>
          <p style={{
            fontSize: '14px',
            fontWeight: '500',
            color: '#111',
            marginBottom: '8px',
            letterSpacing: '0.5px'
          }}>
            First Look
          </p>
          <h1 style={{
            fontSize: '64px',
            fontWeight: '700',
            color: '#111',
            marginBottom: '16px',
            lineHeight: '1.1',
            letterSpacing: '-0.02em'
          }}>
            STEP INTO GREATNESS
          </h1>
          <p style={{
            fontSize: '18px',
            color: '#111',
            marginBottom: '32px',
            maxWidth: '600px',
            margin: '0 auto 32px',
            lineHeight: '1.6'
          }}>
            Discover the perfect pair that matches your style. Premium quality, authentic brands, delivered to your doorstep.
          </p>
          <div style={{ display: 'flex', gap: '12px', justifyContent: 'center', flexWrap: 'wrap' }}>
            <Link
              to="/products"
              style={{
                background: '#111',
                color: '#FFF',
                padding: '12px 24px',
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
              Shop Now
            </Link>
            <Link
              to="/register"
              style={{
                background: '#FFF',
                color: '#111',
                padding: '12px 24px',
                fontSize: '16px',
                fontWeight: '500',
                textDecoration: 'none',
                borderRadius: '30px',
                display: 'inline-block',
                border: '1px solid #CCCCC',
                transition: 'all 0.2s ease'
              }}
              onMouseEnter={(e) => { 
                e.currentTarget.style.borderColor = '#111';
              }}
              onMouseLeave={(e) => { 
                e.currentTarget.style.borderColor = '#CCCCCC';
              }}
            >
              Join Us
            </Link>
          </div>
        </div>
      </div>

      {/* Featured Section */}
      <div style={{
        padding: '60px 20px',
        maxWidth: '1200px',
        margin: '0 auto'
      }}>
        <div style={{
          display: 'grid',
          gridTemplateColumns: 'repeat(auto-fit, minmax(300px, 1fr))',
          gap: '24px'
        }}>
          {[
            { title: 'New Arrivals', subtitle: 'Latest Styles', icon: 'fa-sparkles' },
            { title: 'Best Sellers', subtitle: 'Top Rated', icon: 'fa-fire' },
            { title: 'Sale', subtitle: 'Up to 40% Off', icon: 'fa-tags' }
          ].map((item, idx) => (
            <Link
              key={idx}
              to="/products"
              style={{
                background: '#F5F5F5',
                padding: '48px 32px',
                textAlign: 'center',
                textDecoration: 'none',
                color: '#111',
                transition: 'all 0.3s ease',
                position: 'relative',
                overflow: 'hidden'
              }}
              onMouseEnter={(e) => { 
                e.currentTarget.style.background = '#E5E5E5';
              }}
              onMouseLeave={(e) => { 
                e.currentTarget.style.background = '#F5F5F5';
              }}
            >
              <i className={`fas ${item.icon}`} style={{
                fontSize: '48px',
                marginBottom: '16px',
                display: 'block',
                color: '#111'
              }}></i>
              <h3 style={{
                fontSize: '24px',
                fontWeight: '700',
                marginBottom: '8px',
                color: '#111'
              }}>
                {item.title}
              </h3>
              <p style={{
                fontSize: '14px',
                color: '#757575'
              }}>
                {item.subtitle}
              </p>
            </Link>
          ))}
        </div>
      </div>

      {/* Why Choose Us */}
      <div style={{
        background: '#F5F5F5',
        padding: '60px 20px'
      }}>
        <div style={{ maxWidth: '1200px', margin: '0 auto' }}>
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
              { icon: 'fa-shield-alt', title: 'Authentic Products', desc: '100% genuine footwear from verified sellers' },
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
      <div style={{
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
