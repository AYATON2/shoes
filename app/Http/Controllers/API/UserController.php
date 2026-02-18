<?php

namespace App\Http\Controllers\API;

use App\Http\Controllers\Controller;
use App\Models\User;
use Illuminate\Http\Request;
use Illuminate\Support\Facades\Hash;

class UserController extends Controller
{
    public function updateProfile(Request $request)
    {
        $user = auth()->user();
        $validator = Validator::make($request->all(), [
            'name' => 'required|string|max:255',
            'email' => 'required|email|unique:users,email,' . $user->id,
        ]);

        if ($validator->fails()) {
            return response()->json($validator->errors(), 422);
        }

        $user->update($request->only('name', 'email'));
        return response()->json($user);
    }

    public function update(Request $request, User $user)
    {
        $this->authorize('update', $user);
        $user->update($request->only('name', 'email', 'role'));
        return $user;
    }

    public function deactivate(User $user)
    {
        $this->authorize('update', $user);
        $user->update(['active' => false]);
        return $user;
    }

    public function approve(User $user)
    {
        $this->authorize('update', $user);
        if ($user->role === 'seller') {
            $user->update(['approved' => true]);
        }
        return $user;
    }

    public function suspend(User $user)
    {
        $this->authorize('update', $user);
        if ($user->role === 'seller') {
            $user->update(['approved' => false]);
        }
        return $user;
    }
}
