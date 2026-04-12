<?php

namespace App\Http\Controllers\API;

use App\Http\Controllers\Controller;
use App\Models\User;
use Illuminate\Http\Request;
use Illuminate\Support\Facades\Hash;
use Illuminate\Support\Facades\Validator;

class UserController extends Controller
{
    public function store(Request $request)
    {
        if (auth()->user()->role !== 'admin') {
            return response()->json(['message' => 'Unauthorized'], 403);
        }

        $validator = Validator::make($request->all(), [
            'name' => 'required|string|max:255',
            'email' => 'required|email|unique:users,email',
            'password' => 'required|string|min:8',
            'role' => 'required|in:customer,seller,admin',
            'active' => 'sometimes|boolean',
            'approved' => 'sometimes|boolean',
        ]);

        if ($validator->fails()) {
            return response()->json($validator->errors(), 422);
        }

        $role = $request->role;
        $isApproved = $request->has('approved')
            ? (bool) $request->approved
            : ($role !== 'seller');

        $user = User::create([
            'name' => $request->name,
            'email' => $request->email,
            'password' => Hash::make($request->password),
            'role' => $role,
            'active' => $request->has('active') ? (bool) $request->active : true,
            'approved' => $isApproved,
        ]);

        return response()->json($user, 201);
    }

    public function index()
    {
        // Only admins can view all users
        if (auth()->user()->role !== 'admin') {
            return response()->json(['message' => 'Unauthorized'], 403);
        }
        
        $users = User::all();
        return response()->json($users);
    }

    public function updateProfile(Request $request)
    {
        /** @var User $user */
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

    public function activate(User $user)
    {
        $this->authorize('update', $user);
        $user->update(['active' => true]);
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
