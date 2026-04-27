<?php

namespace App\Http\Controllers\API;

use App\Models\Invoice;
use App\Models\Order;
use App\Services\InvoiceService;
use Illuminate\Http\Request;
use Illuminate\Foundation\Auth\Access\AuthorizesRequests;

class InvoiceController
{
    use AuthorizesRequests;

    /**
     * Get invoice for an order
     */
    public function show($orderId)
    {
        $order = Order::findOrFail($orderId);
        $this->authorize('view', $order);

        $invoice = Invoice::where('order_id', $orderId)->first();

        if (!$invoice) {
            // Generate invoice if not exists
            $invoice = InvoiceService::generateInvoice($order);
        }

        return response()->json([
            'invoice' => $invoice,
            'download_url' => route('invoices.download', $invoice->id)
        ]);
    }

    /**
     * List invoices for authenticated user
     */
    public function index(Request $request)
    {
        $user = $request->user();

        if ($user->role === 'customer') {
            $invoices = Invoice::whereHas('order', function ($query) use ($user) {
                $query->where('user_id', $user->id);
            })->with('order')->latest()->get();
        } else if ($user->role === 'seller') {
            $invoices = Invoice::whereHas('order.orderItems.sku.product', function ($query) use ($user) {
                $query->where('seller_id', $user->id);
            })->with('order')->latest()->get();
        } else if ($user->role === 'admin') {
            $invoices = Invoice::with('order')->latest()->get();
        } else {
            return response()->json(['message' => 'Unauthorized'], 403);
        }

        return response()->json(['invoices' => $invoices]);
    }

    /**
     * Download invoice PDF
     */
    public function download(Invoice $invoice)
    {
        $order = $invoice->order;
        $user = request()->user();

        // Check authorization
        if ($user->role === 'customer' && $order->user_id !== $user->id) {
            return response()->json(['message' => 'Unauthorized'], 403);
        }

        if ($user->role === 'seller') {
            $isSellerOfProduct = $order->orderItems()->whereHas('sku.product', function ($q) use ($user) {
                $q->where('seller_id', $user->id);
            })->exists();

            if (!$isSellerOfProduct && $user->role !== 'admin') {
                return response()->json(['message' => 'Unauthorized'], 403);
            }
        }

        return InvoiceService::downloadInvoice($invoice);
    }

    /**
     * Email invoice to customer
     */
    public function email(Invoice $invoice)
    {
        $order = $invoice->order;
        $user = request()->user();

        // Only customer, seller of the order, or admin can email invoice
        if (!in_array($user->role, ['admin', 'customer'])) {
            if ($user->role === 'seller') {
                $isSellerOfProduct = $order->orderItems()->whereHas('sku.product', function ($q) use ($user) {
                    $q->where('seller_id', $user->id);
                })->exists();
                if (!$isSellerOfProduct) {
                    return response()->json(['message' => 'Unauthorized'], 403);
                }
            }
        }

        $success = InvoiceService::emailInvoice($invoice);

        if ($success) {
            return response()->json([
                'message' => 'Invoice emailed successfully',
                'invoice' => $invoice
            ]);
        } else {
            return response()->json(['message' => 'Failed to email invoice'], 500);
        }
    }

    /**
     * Mark invoice as paid
     */
    public function markAsPaid(Invoice $invoice)
    {
        $this->authorize('update', $invoice->order);

        InvoiceService::markAsPaid($invoice);

        return response()->json([
            'message' => 'Invoice marked as paid',
            'invoice' => $invoice
        ]);
    }

    /**
     * Regenerate invoice PDF
     */
    public function regenerate(Invoice $invoice)
    {
        $this->authorize('update', $invoice->order);

        InvoiceService::generatePDF($invoice);

        return response()->json([
            'message' => 'Invoice regenerated successfully',
            'invoice' => $invoice
        ]);
    }
}
