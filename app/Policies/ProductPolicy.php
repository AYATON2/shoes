<?php

namespace App\Policies;

use App\Models\Product;
use App\Models\User;
use Illuminate\Auth\Access\HandlesAuthorization;

class ProductPolicy
{
    use HandlesAuthorization;

    public function viewAny(User $user)
    {
        return true;
    }

    public function view(User $user, Product $product)
    {
        return true;
    }

    public function create(User $user)
    {
        return in_array($user->role, ['seller', 'admin']);
    }

    public function update(User $user, Product $product)
    {
        return $user->id === $product->seller_id || $user->role === 'admin';
    }

    public function delete(User $user, Product $product)
    {
        return $user->id === $product->seller_id || $user->role === 'admin';
    }
}