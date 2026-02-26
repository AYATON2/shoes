<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Factories\HasFactory;
use Illuminate\Database\Eloquent\Model;

class Product extends Model
{
    use HasFactory;

    protected $fillable = ['name', 'brand', 'type', 'material', 'description', 'price', 'image', 'seller_id', 'performance_tech', 'release_date', 'gender', 'age_group'];

    public function seller()
    {
        return $this->belongsTo(User::class, 'seller_id');
    }

    public function skus()
    {
        return $this->hasMany(Sku::class);
    }

    public function collections()
    {
        return $this->hasMany(UserCollection::class);
    }

    public function sales()
    {
        return $this->hasMany(Sale::class);
    }

    // Get active sale for this product
    public function activeSale()
    {
        return $this->sales()
            ->where('is_active', true)
            ->where('start_date', '<=', now())
            ->where('end_date', '>=', now())
            ->first();
    }
}