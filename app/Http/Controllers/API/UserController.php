<?php

namespace App\Http\Controllers\API;

use App\Http\Controllers\Controller;
use App\Models\User;
use Illuminate\Http\Request;
use Illuminate\Support\Facades\Hash;
use Illuminate\Support\Facades\Validator;

class UserController extends Controller
{
    public function index()
    {
        // Only admins can view all users
        if (auth()->user()->role !== 'admin') {
            return response()->json(['message' => 'Unauthorized'], 403);
        }
        
        $users = User::with('logistic')->get();
        return response()->json($users);
    }

    public function store(Request $request)
    {
        if (auth()->user()->role !== 'admin') {
            return response()->json(['message' => 'Unauthorized'], 403);
        }

        $validator = Validator::make($request->all(), [
            'name' => 'required|string|max:255',
            'email' => 'required|email|unique:users',
            'password' => 'required|string|min:8',
            'role' => 'required|string|in:admin,staff,rider,customer',
            'logistic_id' => 'nullable|exists:logistics,id'
        ]);

        if ($validator->fails()) {
            return response()->json(['errors' => $validator->errors()], 422);
        }

        $user = User::create([
            'name' => $request->name,
            'email' => $request->email,
            'password' => Hash::make($request->password),
            'role' => $request->role,
            'logistic_id' => $request->logistic_id,
            'active' => true,
            'approved' => $request->role === 'staff' ? true : false,
        ]);

        return response()->json($user->load('logistic'), 201);
    }

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
        $user->update($request->only('name', 'email', 'role', 'logistic_id'));
        return $user->load('logistic');
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
        if ($user->role === 'staff') {
            $user->update(['approved' => true]);
        }
        return $user;
    }

    public function suspend(User $user)
    {
        $this->authorize('update', $user);
        if ($user->role === 'staff') {
            $user->update(['approved' => false]);
        }
        return $user;
    }

    public function notifications()
    {
        return auth()->user()->notifications()->orderBy('created_at', 'desc')->take(20)->get();
    }

    public function markNotificationsRead()
    {
        auth()->user()->notifications()->where('read', false)->update(['read' => true]);
        return response()->json(['message' => 'Notifications marked as read']);
    }
}
