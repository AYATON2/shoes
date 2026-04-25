<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Factories\HasFactory;
use Illuminate\Database\Eloquent\Model;

class Logistics extends Model
{
    use HasFactory;

    protected $fillable = ['name', 'base_cost', 'is_local', 'is_active'];

    public function orders()
    {
        return $this->hasMany(Order::class);
    }

    public function staff()
    {
        return $this->hasMany(User::class, 'logistic_id');
    }
}
