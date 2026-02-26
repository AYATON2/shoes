<?php

namespace App\Http\Controllers\Api;

use App\Http\Controllers\Controller;
use App\Models\Notification;
use Illuminate\Http\Request;

class NotificationController extends Controller
{
    public function index(Request $request)
    {
        $user = auth()->user();
        $notifications = Notification::where('user_id', $user->id)
            ->with('order')
            ->orderBy('created_at', 'desc')
            ->paginate(20);
        
        return response()->json($notifications);
    }

    public function unread(Request $request)
    {
        $user = auth()->user();
        $unreadCount = Notification::where('user_id', $user->id)
            ->where('read', false)
            ->count();
        
        $unreadNotifications = Notification::where('user_id', $user->id)
            ->where('read', false)
            ->with('order')
            ->orderBy('created_at', 'desc')
            ->get();
        
        return response()->json([
            'count' => $unreadCount,
            'notifications' => $unreadNotifications
        ]);
    }

    public function markAsRead($id)
    {
        $notification = Notification::findOrFail($id);
        
        // Check authorization
        if ($notification->user_id !== auth()->id()) {
            return response()->json(['message' => 'Unauthorized'], 403);
        }

        $notification->update([
            'read' => true,
            'read_at' => now()
        ]);

        return response()->json($notification);
    }

    public function markAllAsRead(Request $request)
    {
        $user = auth()->user();
        Notification::where('user_id', $user->id)
            ->where('read', false)
            ->update([
                'read' => true,
                'read_at' => now()
            ]);

        return response()->json(['message' => 'All notifications marked as read']);
    }

    public function destroy($id)
    {
        $notification = Notification::findOrFail($id);
        
        // Check authorization
        if ($notification->user_id !== auth()->id()) {
            return response()->json(['message' => 'Unauthorized'], 403);
        }

        $notification->delete();
        return response()->json(['message' => 'Notification deleted']);
    }
}
