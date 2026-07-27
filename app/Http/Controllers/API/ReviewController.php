<?php

namespace App\Http\Controllers\API;

use App\Http\Controllers\Controller;
use App\Models\Review;
use Illuminate\Http\Request;
use Illuminate\Support\Facades\Validator;

class ReviewController extends Controller
{
    public function __construct()
    {
        $this->middleware(['auth:sanctum'])->only(['store']);
        $this->middleware(['auth:sanctum', 'role:admin,staff'])->only(['adminIndex', 'archive']);
    }

    public function index($productId)
    {
        $reviews = Review::where('product_id', $productId)
            ->where('is_archived', false)
            ->with('user:id,name')
            ->orderBy('created_at', 'desc')
            ->get();
        return response()->json($reviews);
    }

    public function adminIndex()
    {
        $reviews = Review::with(['user:id,name', 'product:id,name'])
            ->orderBy('created_at', 'desc')
            ->get();
        return response()->json($reviews);
    }

    public function store(Request $request)
    {
        $validator = Validator::make($request->all(), [
            'product_id' => 'required|exists:products,id',
            'rating' => 'required|integer|min:1|max:5',
            'comment' => 'nullable|string',
        ]);

        if ($validator->fails()) {
            return $this->validationErrorResponse($validator, false);
        }

        $review = Review::create([
            'user_id' => $request->user()->id,
            'product_id' => $request->product_id,
            'rating' => $request->rating,
            'comment' => $request->comment,
        ]);

        return response()->json($review, 201);
    }

    public function archive($id)
    {
        $review = Review::findOrFail($id);
        $review->update(['is_archived' => !$review->is_archived]);
        return response()->json(['message' => $review->is_archived ? 'Review archived' : 'Review unarchived']);
    }
}
