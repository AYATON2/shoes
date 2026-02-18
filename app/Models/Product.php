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
}