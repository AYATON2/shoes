<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Factories\HasFactory;
use Illuminate\Database\Eloquent\Model;

class Payment extends Model
{
    use HasFactory;

    protected $fillable = ['order_id', 'method', 'amount', 'status', 'payment_screenshot', 'gcash_reference', 'verified_at', 'verified_by'];

    public function order()
    {
        return $this->belongsTo(Order::class);
    }
}