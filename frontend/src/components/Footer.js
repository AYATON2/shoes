
import React from 'react';
import { Link } from 'react-router-dom';

const Footer = () => {
  return (
    <footer style={{ background: '#000', color: '#FFF', padding: '80px 20px 40px', fontFamily: "'Inter', sans-serif" }}>
      <div style={{ maxWidth: '1200px', margin: '0 auto', display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(200px, 1fr))', gap: '48px', marginBottom: '60px' }}>
        
        {/* Brand */}
        <div style={{ gridColumn: 'span 2' }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: '10px', marginBottom: '24px' }}>
            <div style={{ width: '32px', height: '32px', background: '#FFF', color: '#000', borderRadius: '50%', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
              <i className="fas fa-check" style={{ fontSize: '14px' }} />
            </div>
            <span style={{ fontSize: '20px', fontWeight: '800', letterSpacing: '-0.5px' }}>StepUp</span>
          </div>
          <p style={{ color: 'rgba(255,255,255,0.6)', fontSize: '14px', lineHeight: '1.6', maxWidth: '300px' }}>
            Premium footwear for the modern explorer. Quality, comfort, and style in every step.
          </p>
        </div>

        {/* Links */}
        <div>
          <h4 style={{ fontSize: '16px', fontWeight: '700', marginBottom: '24px', color: '#FFF' }}>Shop</h4>
          <ul style={{ listStyle: 'none', padding: 0, margin: 0, display: 'grid', gap: '12px' }}>
            <li><Link to="/products" style={{ color: 'rgba(255,255,255,0.6)', textDecoration: 'none', fontSize: '14px', transition: 'color 0.2s' }} onMouseEnter={e=>e.currentTarget.style.color='#FFF'} onMouseLeave={e=>e.currentTarget.style.color='rgba(255,255,255,0.6)'}>New Arrivals</Link></li>
            <li><Link to="/products" style={{ color: 'rgba(255,255,255,0.6)', textDecoration: 'none', fontSize: '14px', transition: 'color 0.2s' }} onMouseEnter={e=>e.currentTarget.style.color='#FFF'} onMouseLeave={e=>e.currentTarget.style.color='rgba(255,255,255,0.6)'}>Best Sellers</Link></li>
            <li><Link to="/products" style={{ color: 'rgba(255,255,255,0.6)', textDecoration: 'none', fontSize: '14px', transition: 'color 0.2s' }} onMouseEnter={e=>e.currentTarget.style.color='#FFF'} onMouseLeave={e=>e.currentTarget.style.color='rgba(255,255,255,0.6)'}>Sale</Link></li>
          </ul>
        </div>

        <div>
          <h4 style={{ fontSize: '16px', fontWeight: '700', marginBottom: '24px', color: '#FFF' }}>Support</h4>
          <ul style={{ listStyle: 'none', padding: 0, margin: 0, display: 'grid', gap: '12px' }}>
            <li><Link to="/" style={{ color: 'rgba(255,255,255,0.6)', textDecoration: 'none', fontSize: '14px', transition: 'color 0.2s' }} onMouseEnter={e=>e.currentTarget.style.color='#FFF'} onMouseLeave={e=>e.currentTarget.style.color='rgba(255,255,255,0.6)'}>Shipping Info</Link></li>
            <li><Link to="/" style={{ color: 'rgba(255,255,255,0.6)', textDecoration: 'none', fontSize: '14px', transition: 'color 0.2s' }} onMouseEnter={e=>e.currentTarget.style.color='#FFF'} onMouseLeave={e=>e.currentTarget.style.color='rgba(255,255,255,0.6)'}>Returns</Link></li>
            <li><Link to="/" style={{ color: 'rgba(255,255,255,0.6)', textDecoration: 'none', fontSize: '14px', transition: 'color 0.2s' }} onMouseEnter={e=>e.currentTarget.style.color='#FFF'} onMouseLeave={e=>e.currentTarget.style.color='rgba(255,255,255,0.6)'}>Contact Us</Link></li>
          </ul>
        </div>

        {/* Social */}
        <div>
          <h4 style={{ fontSize: '16px', fontWeight: '700', marginBottom: '24px', color: '#FFF' }}>Follow Us</h4>
          <div style={{ display: 'flex', gap: '16px' }}>
            {['facebook', 'instagram', 'twitter'].map(s => (
              <a key={s} href="/" style={{ width: '40px', height: '40px', borderRadius: '50%', background: 'rgba(255,255,255,0.1)', display: 'flex', alignItems: 'center', justifyContent: 'center', color: '#FFF', textDecoration: 'none', transition: 'background 0.2s' }} onMouseEnter={e=>e.currentTarget.style.background='rgba(255,255,255,0.2)'} onMouseLeave={e=>e.currentTarget.style.background='rgba(255,255,255,0.1)'}>
                <i className={`fab fa-${s}`} />
              </a>
            ))}
          </div>
        </div>
      </div>

      <div style={{ maxWidth: '1200px', margin: '0 auto', paddingTop: '40px', borderTop: '1px solid rgba(255,255,255,0.1)', display: 'flex', justifyContent: 'space-between', alignItems: 'center', flexWrap: 'wrap', gap: '20px' }}>
        <p style={{ color: 'rgba(255,255,255,0.4)', fontSize: '12px' }}>
          © {new Date().getFullYear()} StepUp Footwear. All rights reserved.
        </p>
        <div style={{ display: 'flex', gap: '24px' }}>
          <Link to="/" style={{ color: 'rgba(255,255,255,0.4)', textDecoration: 'none', fontSize: '12px' }}>Privacy Policy</Link>
          <Link to="/" style={{ color: 'rgba(255,255,255,0.4)', textDecoration: 'none', fontSize: '12px' }}>Terms of Service</Link>
        </div>
      </div>
    </footer>
  );
};

export default Footer;
