<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Factories\HasFactory;
use Illuminate\Database\Eloquent\Model;

class Invoice extends Model
{
    use HasFactory;

    protected $fillable = [
        'order_id',
        'invoice_number',
        'issue_date',
        'due_date',
        'pdf_path',
        'status', // draft, sent, paid, overdue
        'sent_at',
        'viewed_at'
    ];

    protected $casts = [
        'issue_date' => 'datetime',
        'due_date' => 'datetime',
        'sent_at' => 'datetime',
        'viewed_at' => 'datetime'
    ];

    public function order()
    {
        return $this->belongsTo(Order::class);
    }

    /**
     * Generate unique invoice number
     */
    public static function generateInvoiceNumber()
    {
        $date = date('Y');
        $count = static::whereYear('created_at', date('Y'))->count() + 1;
        return 'INV-' . $date . '-' . str_pad($count, 6, '0', STR_PAD_LEFT);
    }
}
