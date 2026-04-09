<!DOCTYPE html>
<html>
<head>
    <meta charset="UTF-8">
    <title>Invoice {{ $invoice->invoice_number }}</title>
    <style>
        body {
            font-family: Arial, sans-serif;
            color: #333;
            margin: 0;
            padding: 20px;
        }
        .container {
            max-width: 900px;
            margin: 0 auto;
            border: 1px solid #ddd;
            padding: 40px;
            background: #fff;
        }
        .header {
            display: flex;
            justify-content: space-between;
            align-items: flex-start;
            margin-bottom: 40px;
            border-bottom: 2px solid #111;
            padding-bottom: 20px;
        }
        .company-info h1 {
            margin: 0;
            font-size: 28px;
            color: #111;
        }
        .invoice-details {
            text-align: right;
        }
        .invoice-details p {
            margin: 5px 0;
        }
        .invoice-number {
            font-size: 20px;
            font-weight: bold;
            color: #111;
        }
        .section {
            margin-bottom: 30px;
        }
        .section-title {
            font-size: 12px;
            font-weight: bold;
            color: #666;
            text-transform: uppercase;
            margin-bottom: 10px;
            letter-spacing: 1px;
        }
        .customer-info, .order-info {
            margin-bottom: 30px;
        }
        .customer-info p, .order-info p {
            margin: 5px 0;
            font-size: 14px;
        }
        table {
            width: 100%;
            border-collapse: collapse;
            margin: 20px 0;
        }
        table thead {
            background: #f5f5f5;
            border-top: 1px solid #ddd;
            border-bottom: 2px solid #ddd;
        }
        table th {
            text-align: left;
            padding: 12px;
            font-weight: bold;
            font-size: 13px;
            color: #111;
            text-transform: uppercase;
        }
        table td {
            padding: 12px;
            border-bottom: 1px solid #eee;
            font-size: 13px;
        }
        table tr:last-child td {
            border-bottom: none;
        }
        .amount-right {
            text-align: right;
        }
        .totals {
            margin-top: 20px;
            display: flex;
            justify-content: flex-end;
        }
        .totals-table {
            width: 300px;
        }
        .totals-table tr td {
            padding: 8px 12px;
            border: none;
        }
        .totals-table .total-row {
            background: #f5f5f5;
            font-weight: bold;
            border-top: 2px solid #111;
            border-bottom: 2px solid #111;
        }
        .total-row td {
            padding: 12px !important;
        }
        .label {
            text-align: left;
        }
        .value {
            text-align: right;
            width: 120px;
        }
        .footer {
            text-align: center;
            margin-top: 40px;
            padding-top: 20px;
            border-top: 1px solid #ddd;
            font-size: 12px;
            color: #666;
        }
        .payment-status {
            padding: 10px;
            background: #f0f0f0;
            border-radius: 4px;
            text-align: center;
            margin-top: 20px;
            font-weight: bold;
        }
        .status-paid {
            background: #d4edda;
            color: #155724;
        }
        .status-pending {
            background: #fff3cd;
            color: #856404;
        }
    </style>
</head>
<body>
    <div class="container">
        <!-- Header -->
        <div class="header">
            <div class="company-info">
                <h1>StepUp</h1>
                <p style="margin: 5px 0; color: #666;">Premium Footwear Store</p>
                <p style="margin: 5px 0; font-size: 12px; color: #666;">support@stepup.com | www.stepup.com</p>
            </div>
            <div class="invoice-details">
                <div class="invoice-number">{{ $invoice->invoice_number }}</div>
                <p><strong>Issue Date:</strong> {{ $invoice->issue_date->format('M d, Y') }}</p>
                <p><strong>Due Date:</strong> {{ $invoice->due_date->format('M d, Y') }}</p>
                <p><strong>Order ID:</strong> #{{ $order->id }}</p>
            </div>
        </div>

        <!-- Customer & Order Info -->
        <div style="display: flex; gap: 40px; margin-bottom: 30px;">
            <div class="customer-info" style="flex: 1;">
                <div class="section-title">Bill To</div>
                <p><strong>{{ $order->user->name }}</strong></p>
                <p>{{ $order->user->email }}</p>
                @if($order->shippingAddress)
                    <p>{{ $order->shippingAddress->address_line_1 }}</p>
                    @if($order->shippingAddress->address_line_2)
                        <p>{{ $order->shippingAddress->address_line_2 }}</p>
                    @endif
                    <p>{{ $order->shippingAddress->city }}, {{ $order->shippingAddress->state }} {{ $order->shippingAddress->postal_code }}</p>
                    <p>{{ $order->shippingAddress->country }}</p>
                @endif
            </div>
            <div class="order-info" style="flex: 1;">
                <div class="section-title">Order Information</div>
                <p><strong>Order Date:</strong> {{ $order->created_at->format('M d, Y') }}</p>
                <p><strong>Order Status:</strong> <strong style="color: #111;">{{ ucfirst($order->status) }}</strong></p>
                @if($order->payment)
                    <p><strong>Payment Method:</strong> {{ ucfirst($order->payment->payment_method) }}</p>
                    <p><strong>Payment Status:</strong> <span style="color: @if($order->payment->status === 'success') #28a745 @else #dc3545 @endif;">{{ ucfirst($order->payment->status) }}</span></p>
                @endif
            </div>
        </div>

        <!-- Items Table -->
        <div class="section">
            <div class="section-title">Order Items</div>
            <table>
                <thead>
                    <tr>
                        <th style="width: 40%;">Product</th>
                        <th style="width: 15%; text-align: center;">Qty</th>
                        <th style="width: 15%; text-align: right;">Unit Price</th>
                        <th style="width: 15%; text-align: right;">Total</th>
                    </tr>
                </thead>
                <tbody>
                    @foreach($order->orderItems as $item)
                        <tr>
                            <td>
                                <strong>{{ $item->sku->product->name }}</strong><br>
                                <span style="color: #666; font-size: 12px;">
                                    Size: @if($item->sku->size){{ $item->sku->size }}@else N/A @endif
                                    @if($item->sku->color)| Color: {{ $item->sku->color }}@endif
                                    <br>SKU: {{ $item->sku->sku_code }}
                                </span>
                            </td>
                            <td style="text-align: center;">{{ $item->quantity }}</td>
                            <td class="amount-right">${{ number_format($item->price, 2) }}</td>
                            <td class="amount-right"><strong>${{ number_format($item->quantity * $item->price, 2) }}</strong></td>
                        </tr>
                    @endforeach
                </tbody>
            </table>
        </div>

        <!-- Totals -->
        <div class="totals">
            <table class="totals-table">
                <tr>
                    <td class="label">Subtotal:</td>
                    <td class="value">${{ number_format($order->total - $order->shipping_fee, 2) }}</td>
                </tr>
                <tr>
                    <td class="label">Shipping:</td>
                    <td class="value">${{ number_format($order->shipping_fee, 2) }}</td>
                </tr>
                <tr class="total-row">
                    <td class="label">Total:</td>
                    <td class="value">${{ number_format($order->total, 2) }}</td>
                </tr>
            </table>
        </div>

        <!-- Payment Status Badge -->
        <div class="payment-status @if($order->payment && $order->payment->status === 'success') status-paid @else status-pending @endif">
            @if($order->payment && $order->payment->status === 'success')
                ✓ Payment Received - Thank you for your order!
            @else
                ⏳ Payment Pending
            @endif
        </div>

        <!-- Footer -->
        <div class="footer">
            <p><strong>Thank you for your business!</strong></p>
            <p>If you have any questions about this invoice, please contact us at support@stepup.com</p>
            <p style="margin-top: 20px; color: #999;">Generated on {{ now()->format('M d, Y H:i') }}</p>
        </div>
    </div>
</body>
</html>
