import React, { useState, useEffect, useCallback } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import axios from 'axios';

const InvoiceDetail = () => {
  const { orderId } = useParams();
  const navigate = useNavigate();
  const [invoice, setInvoice] = useState(null);
  const [order, setOrder] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [downloading, setDownloading] = useState(false);
  const [emailSending, setEmailSending] = useState(false);

  const getAuthConfig = () => {
    const token = localStorage.getItem('token');
    return {
      headers: {
        Authorization: `Bearer ${token}`
      }
    };
  };

  const fetchInvoice = useCallback(async () => {
    try {
      setLoading(true);
      // Get invoice data
      const res = await axios.get(`/api/invoices/${orderId}`, getAuthConfig());
      setInvoice(res.data.invoice);
      
      // Get order data separately if needed
      const orderRes = await axios.get(`/api/orders/${orderId}`, getAuthConfig());
      setOrder(orderRes.data);
    } catch (err) {
      setError(err.response?.data?.message || 'Failed to load invoice');
    } finally {
      setLoading(false);
    }
  }, [orderId]);

  useEffect(() => {
    fetchInvoice();
  }, [fetchInvoice]);

  const handleDownload = async () => {
    try {
      setDownloading(true);
      const res = await axios.get(`/api/invoices/${invoice.id}/download`, {
        ...getAuthConfig(),
        responseType: 'blob'
      });
      
      // Create download link
      const url = window.URL.createObjectURL(new Blob([res.data]));
      const link = document.createElement('a');
      link.href = url;
      link.setAttribute('download', `${invoice.invoice_number}.pdf`);
      document.body.appendChild(link);
      link.click();
      link.parentNode.removeChild(link);
      window.URL.revokeObjectURL(url);
    } catch (err) {
      setError('Failed to download invoice');
    } finally {
      setDownloading(false);
    }
  };

  const handleEmail = async () => {
    try {
      setEmailSending(true);
      await axios.post(`/api/invoices/${invoice.id}/email`, {}, getAuthConfig());
      alert('Invoice sent to your email');
    } catch (err) {
      setError(err.response?.data?.message || 'Failed to send invoice');
    } finally {
      setEmailSending(false);
    }
  };

  const handlePrint = () => {
    window.print();
  };

  if (loading) {
    return (
      <div style={{ display: 'flex', justifyContent: 'center', alignItems: 'center', minHeight: '100vh' }}>
        <div className="spinner-border" role="status">
          <span className="sr-only">Loading...</span>
        </div>
      </div>
    );
  }

  if (error) {
    return (
      <div style={{ padding: '24px' }}>
        <button onClick={() => navigate(-1)} style={{ marginBottom: '16px', padding: '8px 16px', background: '#111', color: '#FFF', border: 'none', borderRadius: '4px', cursor: 'pointer' }}>
          ← Back
        </button>
        <div style={{ backgroundColor: '#ffebee', color: '#c62828', padding: '16px', borderRadius: '4px' }}>
          {error}
        </div>
      </div>
    );
  }

  if (!invoice || !order) {
    return (
      <div style={{ padding: '24px' }}>
        <p>Invoice not found</p>
      </div>
    );
  }

  const safeUser = order.user || {};
  const shippingAddress = order.shipping_address || order.shippingAddress || null;
  const orderItems = order.order_items || order.orderItems || [];
  const shippingFee = parseFloat(order.shipping_fee || 0);
  const total = parseFloat(order.total || 0);
  const subtotal = total - shippingFee;

  return (
    <div style={{ padding: '24px', maxWidth: '1000px', margin: '0 auto' }}>
      {/* Header Actions */}
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '24px', gap: '12px', flexWrap: 'wrap' }}>
        <button 
          onClick={() => navigate(-1)} 
          style={{ padding: '10px 16px', background: '#f5f5f5', color: '#111', border: 'none', borderRadius: '4px', cursor: 'pointer', fontWeight: '500' }}
        >
          ← Back
        </button>
        <div style={{ display: 'flex', gap: '12px', flexWrap: 'wrap' }}>
          <button 
            onClick={handlePrint}
            style={{ padding: '10px 16px', background: '#e3f2fd', color: '#1976d2', border: 'none', borderRadius: '4px', cursor: 'pointer', fontWeight: '500' }}
          >
            <i className="fas fa-print"></i> Print
          </button>
          <button 
            onClick={handleDownload}
            disabled={downloading}
            style={{ padding: '10px 16px', background: '#e8f5e9', color: '#388e3c', border: 'none', borderRadius: '4px', cursor: 'pointer', fontWeight: '500', opacity: downloading ? 0.6 : 1 }}
          >
            <i className="fas fa-download"></i> {downloading ? 'Downloading...' : 'Download PDF'}
          </button>
          <button 
            onClick={handleEmail}
            disabled={emailSending}
            style={{ padding: '10px 16px', background: '#fff3e0', color: '#f57c00', border: 'none', borderRadius: '4px', cursor: 'pointer', fontWeight: '500', opacity: emailSending ? 0.6 : 1 }}
          >
            <i className="fas fa-envelope"></i> {emailSending ? 'Sending...' : 'Email'}
          </button>
        </div>
      </div>

      {/* Invoice Document */}
      <div style={{ background: '#fff', border: '1px solid #e0e0e0', padding: '40px', borderRadius: '8px', boxShadow: '0 2px 8px rgba(0,0,0,0.08)' }}>
        {/* Header */}
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', marginBottom: '40px', paddingBottom: '20px', borderBottom: '2px solid #111' }}>
          <div>
            <h1 style={{ margin: 0, fontSize: '28px', fontWeight: '700', color: '#111' }}>StepUp</h1>
            <p style={{ margin: '5px 0', color: '#666', fontSize: '14px' }}>Premium Footwear Store</p>
            <p style={{ margin: '5px 0', color: '#999', fontSize: '12px' }}>support@stepup.com | www.stepup.com</p>
          </div>
          <div style={{ textAlign: 'right' }}>
            <div style={{ fontSize: '20px', fontWeight: 'bold', color: '#111', marginBottom: '8px' }}>{invoice.invoice_number}</div>
            <p style={{ margin: '5px 0', fontSize: '14px' }}><strong>Issue Date:</strong> {new Date(invoice.issue_date).toLocaleDateString()}</p>
            <p style={{ margin: '5px 0', fontSize: '14px' }}><strong>Due Date:</strong> {new Date(invoice.due_date).toLocaleDateString()}</p>
            <p style={{ margin: '5px 0', fontSize: '14px' }}><strong>Order ID:</strong> #{order.id}</p>
          </div>
        </div>

        {/* Customer & Order Info */}
        <div style={{ display: 'flex', gap: '40px', marginBottom: '30px' }}>
          <div style={{ flex: 1 }}>
            <p style={{ fontSize: '12px', fontWeight: 'bold', color: '#666', textTransform: 'uppercase', marginBottom: '10px', letterSpacing: '1px' }}>Bill To</p>
            <p style={{ margin: '5px 0', fontWeight: 'bold' }}>{safeUser.name || 'Customer'}</p>
            <p style={{ margin: '5px 0', fontSize: '14px' }}>{safeUser.email || 'No email provided'}</p>
            {shippingAddress && (
              <>
                <p style={{ margin: '5px 0', fontSize: '14px' }}>{shippingAddress.street || 'No street provided'}</p>
                <p style={{ margin: '5px 0', fontSize: '14px' }}>
                  {[shippingAddress.city, shippingAddress.state, shippingAddress.zip].filter(Boolean).join(', ') || 'No city/state/zip provided'}
                </p>
                <p style={{ margin: '5px 0', fontSize: '14px' }}>{shippingAddress.country || 'No country provided'}</p>
              </>
            )}
          </div>
          <div style={{ flex: 1 }}>
            <p style={{ fontSize: '12px', fontWeight: 'bold', color: '#666', textTransform: 'uppercase', marginBottom: '10px', letterSpacing: '1px' }}>Order Information</p>
            <p style={{ margin: '5px 0', fontSize: '14px' }}><strong>Order Date:</strong> {new Date(order.created_at).toLocaleDateString()}</p>
            <p style={{ margin: '5px 0', fontSize: '14px' }}><strong>Order Status:</strong> <strong style={{ color: '#111' }}>{(order.status || 'unknown').toUpperCase()}</strong></p>
            {order.payment && (
              <>
                <p style={{ margin: '5px 0', fontSize: '14px' }}><strong>Payment Method:</strong> {order.payment.method}</p>
                <p style={{ margin: '5px 0', fontSize: '14px' }}><strong>Payment Status:</strong> <span style={{ color: order.payment.status === 'completed' ? '#28a745' : '#dc3545' }}>{(order.payment.status || 'pending').toUpperCase()}</span></p>
              </>
            )}
          </div>
        </div>

        {/* Items Table */}
        <div style={{ marginBottom: '30px' }}>
          <p style={{ fontSize: '12px', fontWeight: 'bold', color: '#666', textTransform: 'uppercase', marginBottom: '10px', letterSpacing: '1px' }}>Order Items</p>
          <table style={{ width: '100%', borderCollapse: 'collapse' }}>
            <thead>
              <tr style={{ background: '#f5f5f5', borderTop: '1px solid #ddd', borderBottom: '2px solid #ddd' }}>
                <th style={{ textAlign: 'left', padding: '12px', fontWeight: 'bold', fontSize: '13px', color: '#111', textTransform: 'uppercase', width: '40%' }}>Product</th>
                <th style={{ textAlign: 'center', padding: '12px', fontWeight: 'bold', fontSize: '13px', color: '#111', textTransform: 'uppercase', width: '15%' }}>Qty</th>
                <th style={{ textAlign: 'right', padding: '12px', fontWeight: 'bold', fontSize: '13px', color: '#111', textTransform: 'uppercase', width: '15%' }}>Unit Price</th>
                <th style={{ textAlign: 'right', padding: '12px', fontWeight: 'bold', fontSize: '13px', color: '#111', textTransform: 'uppercase', width: '15%' }}>Total</th>
              </tr>
            </thead>
            <tbody>
              {orderItems.map((item, idx) => {
                const qty = parseFloat(item.quantity || 0);
                const unitPrice = parseFloat(item.price || 0);
                const productName = item?.sku?.product?.name || 'Unknown Product';
                const size = item?.sku?.size || 'N/A';
                const color = item?.sku?.color;
                const skuCode = item?.sku?.sku_code || 'N/A';

                return (
                <tr key={idx} style={{ borderBottom: '1px solid #eee' }}>
                  <td style={{ padding: '12px', fontSize: '13px' }}>
                    <strong>{productName}</strong><br/>
                    <span style={{ color: '#666', fontSize: '12px' }}>
                      Size: {size}
                      {color ? ` | Color: ${color}` : ''}
                      <br/>SKU: {skuCode}
                    </span>
                  </td>
                  <td style={{ padding: '12px', fontSize: '13px', textAlign: 'center' }}>{qty}</td>
                  <td style={{ padding: '12px', fontSize: '13px', textAlign: 'right' }}>${unitPrice.toFixed(2)}</td>
                  <td style={{ padding: '12px', fontSize: '13px', textAlign: 'right' }}><strong>${(qty * unitPrice).toFixed(2)}</strong></td>
                </tr>
                );
              })}
            </tbody>
          </table>
        </div>

        {/* Totals */}
        <div style={{ display: 'flex', justifyContent: 'flex-end', marginTop: '20px' }}>
          <table style={{ width: '300px', borderCollapse: 'collapse' }}>
            <tbody>
              <tr>
                <td style={{ padding: '8px 12px', textAlign: 'left' }}>Subtotal:</td>
                <td style={{ padding: '8px 12px', textAlign: 'right', width: '120px' }}>${subtotal.toFixed(2)}</td>
              </tr>
              <tr>
                <td style={{ padding: '8px 12px', textAlign: 'left' }}>Shipping:</td>
                <td style={{ padding: '8px 12px', textAlign: 'right', width: '120px' }}>${shippingFee.toFixed(2)}</td>
              </tr>
              <tr style={{ background: '#f5f5f5', fontWeight: 'bold', borderTop: '2px solid #111', borderBottom: '2px solid #111' }}>
                <td style={{ padding: '12px' }}>Total:</td>
                <td style={{ padding: '12px', textAlign: 'right' }}>${total.toFixed(2)}</td>
              </tr>
            </tbody>
          </table>
        </div>

        {/* Payment Status */}
        <div style={{ 
          padding: '10px', 
          background: order.payment?.status === 'completed' ? '#d4edda' : '#fff3cd',
          color: order.payment?.status === 'completed' ? '#155724' : '#856404',
          borderRadius: '4px',
          textAlign: 'center',
          marginTop: '20px',
          fontWeight: 'bold'
        }}>
          {order.payment?.status === 'completed' ? '✓ Payment Received - Thank you for your order!' : '⏳ Payment Pending'}
        </div>

        {/* Footer */}
        <div style={{ textAlign: 'center', marginTop: '40px', paddingTop: '20px', borderTop: '1px solid #ddd', fontSize: '12px', color: '#666' }}>
          <p><strong>Thank you for your business!</strong></p>
          <p>If you have any questions about this invoice, please contact us at support@stepup.com</p>
          <p style={{ marginTop: '20px', color: '#999' }}>Generated on {new Date().toLocaleDateString()}</p>
        </div>
      </div>

      {/* Print Styles */}
      <style>{`
        @media print {
          body {
            margin: 0;
            padding: 0;
          }
          div[role="button"], button {
            display: none !important;
          }
        }
      `}</style>
    </div>
  );
};

export default InvoiceDetail;
