import React, { useEffect } from 'react';

const Notification = ({ message, type = 'info', onClose }) => {
  useEffect(() => {
    const timer = setTimeout(() => {
      onClose();
    }, 5000);
    return () => clearTimeout(timer);
  }, [onClose]);

  const getStyles = () => {
    switch (type) {
      case 'success':
        return { background: '#16a34a', color: '#FFF' };
      case 'error':
        return { background: '#dc2626', color: '#FFF' };
      default:
        return { background: '#111', color: '#FFF' };
    }
  };

  const style = getStyles();

  return (
    <div style={{
      position: 'fixed',
      top: '24px',
      right: '24px',
      padding: '16px 24px',
      borderRadius: '12px',
      boxShadow: '0 10px 30px rgba(0,0,0,0.1)',
      zIndex: 9999,
      display: 'flex',
      alignItems: 'center',
      gap: '12px',
      animation: 'slideInRight 0.3s cubic-bezier(0.4, 0, 0.2, 1)',
      ...style
    }}>
      <i className={`fas ${type === 'success' ? 'fa-check-circle' : type === 'error' ? 'fa-exclamation-circle' : 'fa-info-circle'}`}></i>
      <span style={{ fontWeight: '500', fontSize: '14px' }}>{message}</span>
      <button onClick={onClose} style={{
        background: 'none',
        border: 'none',
        color: 'inherit',
        fontSize: '18px',
        cursor: 'pointer',
        padding: '0 0 0 12px',
        opacity: 0.7
      }}>&times;</button>
    </div>
  );
};

export default Notification;
