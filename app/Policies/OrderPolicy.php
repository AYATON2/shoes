<?php

namespace App\Policies;

use App\Models\Order;
use App\Models\User;
use Illuminate\Auth\Access\HandlesAuthorization;

class OrderPolicy
{
    use HandlesAuthorization;

    public function view(User $user, Order $order)
    {
        if ($user->role === 'admin') return true;
        if ($user->role === 'customer' && $order->user_id === $user->id) return true;
        if ($user->role === 'seller' && $order->orderItems()->whereHas('sku.product', function ($q) use ($user) {
            $q->where('seller_id', $user->id);
        })->exists()) return true;
        return false;
    }

    public function update(User $user, Order $order)
    {
        if ($user->role === 'admin') return true;
        if ($user->role === 'seller' && $order->orderItems()->whereHas('sku.product', function ($q) use ($user) {
            $q->where('seller_id', $user->id);
        })->exists()) return true;
        return false;
    }
}