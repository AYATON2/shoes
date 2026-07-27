<?php

namespace App\Http\Controllers\Concerns;

use Illuminate\Contracts\Validation\Validator;
use Illuminate\Http\JsonResponse;

trait ApiResponses
{
    protected function unauthorizedResponse(string $message = 'Unauthorized'): JsonResponse
    {
        return response()->json(['message' => $message], 403);
    }

    /**
     * @param  bool  $wrapErrors  When true the messages are nested under an "errors" key.
     */
    protected function validationErrorResponse(Validator $validator, bool $wrapErrors = true): JsonResponse
    {
        $errors = $validator->errors();

        return response()->json($wrapErrors ? ['errors' => $errors] : $errors, 422);
    }

    protected function errorsResponse(array $errors): JsonResponse
    {
        return response()->json(['errors' => $errors], 422);
    }

    protected function failureResponse(string $error, string $message, int $status = 500): JsonResponse
    {
        return response()->json([
            'error' => $error,
            'message' => $message,
        ], $status);
    }
}
