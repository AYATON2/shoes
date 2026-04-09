<?php

namespace App\Services;

use App\Models\Invoice;
use App\Models\Order;
use Barryvdh\DomPDF\Facade\Pdf;
use Illuminate\Support\Facades\Mail;
use Illuminate\Support\Facades\Storage;

class InvoiceService
{
    /**
     * Generate invoice for an order
     */
    public static function generateInvoice(Order $order)
    {
        // Check if invoice already exists
        $existingInvoice = Invoice::where('order_id', $order->id)->first();
        if ($existingInvoice) {
            return $existingInvoice;
        }

        // Create invoice record
        $invoice = Invoice::create([
            'order_id' => $order->id,
            'invoice_number' => Invoice::generateInvoiceNumber(),
            'issue_date' => now(),
            'due_date' => now()->addDays(30),
            'status' => 'draft'
        ]);

        // Generate PDF
        self::generatePDF($invoice);

        return $invoice;
    }

    /**
     * Generate and save PDF file
     */
    public static function generatePDF(Invoice $invoice)
    {
        $order = $invoice->order()->with([
            'orderItems.sku.product',
            'shippingAddress',
            'payment',
            'user'
        ])->first();

        $pdf = Pdf::loadView('invoices.pdf', [
            'invoice' => $invoice,
            'order' => $order
        ])
        ->setPaper('a4')
        ->setOption('isHtml5ParserEnabled', true)
        ->setOption('isPhpEnabled', true);

        // Store PDF
        $path = 'invoices/' . $invoice->id . '_' . $invoice->invoice_number . '.pdf';
        Storage::disk('public')->put($path, $pdf->output());

        $invoice->update([
            'pdf_path' => $path,
            'status' => 'sent'
        ]);

        return $invoice;
    }

    /**
     * Send invoice to customer via email
     */
    public static function emailInvoice(Invoice $invoice)
    {
        $order = $invoice->order;
        $customer = $order->user;

        try {
            // Generate fresh PDF if needed
            if (!$invoice->pdf_path || !Storage::disk('public')->exists($invoice->pdf_path)) {
                self::generatePDF($invoice);
            }

            // Get PDF path
            $pdfPath = Storage::disk('public')->path($invoice->pdf_path);

            // Send email with attachment
            Mail::send('emails.invoice', [
                'customer_name' => $customer->name,
                'invoice_number' => $invoice->invoice_number,
                'order_id' => $order->id
            ], function ($message) use ($customer, $invoice, $pdfPath) {
                $message->to($customer->email)
                    ->subject('Your Invoice - ' . $invoice->invoice_number)
                    ->attach($pdfPath, [
                        'as' => $invoice->invoice_number . '.pdf',
                        'mime' => 'application/pdf'
                    ]);
            });

            $invoice->update(['sent_at' => now()]);
            return true;
        } catch (\Exception $e) {
            \Log::error('Invoice email failed: ' . $e->getMessage());
            return false;
        }
    }

    /**
     * Download invoice PDF
     */
    public static function downloadInvoice(Invoice $invoice)
    {
        if (!$invoice->pdf_path || !Storage::disk('public')->exists($invoice->pdf_path)) {
            self::generatePDF($invoice);
        }

        $invoice->update(['viewed_at' => now()]);

        return Storage::disk('public')->download(
            $invoice->pdf_path,
            $invoice->invoice_number . '.pdf'
        );
    }

    /**
     * Mark invoice as paid
     */
    public static function markAsPaid(Invoice $invoice)
    {
        $invoice->update(['status' => 'paid']);
        return $invoice;
    }
}
