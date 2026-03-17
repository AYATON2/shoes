<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Factories\HasFactory;
use Illuminate\Database\Eloquent\Model;

/**
 * @property float $discount_amount
 * @property float $discount_percentage
 * @property float $sale_price
 * @property bool $is_active
 * @property \Carbon\Carbon $start_date
 * @property \Carbon\Carbon $end_date
 */
class Sale extends Model
{
    use HasFactory;

    protected $fillable = [
        'product_id',
        'seller_id',
        'title',
        'description',
        'discount_amount',
        'discount_percentage',
        'start_date',
        'end_date',
        'is_active',
        'sale_price'
    ];

    protected $casts = [
        'start_date' => 'datetime',
        'end_date' => 'datetime',
        'is_active' => 'boolean',
        'discount_amount' => 'decimal:2',
        'discount_percentage' => 'decimal:2',
        'sale_price' => 'decimal:2'
    ];

    public function product()
    {
        return $this->belongsTo(Product::class);
    }

    public function seller()
    {
        return $this->belongsTo(User::class, 'seller_id');
    }

    // Check if sale is currently active (dates and status)
    public function isCurrentlyActive()
    {
        $now = now();
        return $this->is_active && 
               $now->isBetween($this->start_date, $this->end_date);
    }
}
