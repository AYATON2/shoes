<?php

namespace Database\Seeders;

use App\Models\Product;
use App\Models\Sku;
use App\Models\User;
use Illuminate\Database\Seeder;
use Illuminate\Support\Facades\Hash;

class SampleDataSeeder extends Seeder
{
    /**
     * Seed core sample data for Railway deployment checks.
     *
     * @return void
     */
    public function run()
    {
        $admin = User::updateOrCreate(
            ['email' => 'admin@stepup.com'],
            [
                'name' => 'Admin User',
                'password' => Hash::make('password123'),
                'role' => 'admin',
                'active' => true,
                'approved' => true,
            ]
        );

        $seller = User::updateOrCreate(
            ['email' => 'seller@stepup.com'],
            [
                'name' => 'Seller User',
                'password' => Hash::make('password123'),
                'role' => 'seller',
                'active' => true,
                'approved' => true,
            ]
        );

        User::updateOrCreate(
            ['email' => 'customer@stepup.com'],
            [
                'name' => 'Customer User',
                'password' => Hash::make('password123'),
                'role' => 'customer',
                'active' => true,
                'approved' => true,
            ]
        );

        $products = [
            [
                'name' => 'Air Zoom Velocity',
                'brand' => 'Nike',
                'type' => 'running',
                'material' => 'mesh',
                'description' => 'Lightweight daily trainer with responsive cushioning.',
                'price' => 5995.00,
                'image' => null,
                'seller_id' => $seller->id,
                'performance_tech' => 'Zoom Air',
                'release_date' => '2025-01-15',
                'gender' => 'unisex',
                'age_group' => 'adult',
                'is_trending' => true,
                'view_count' => 150,
                'skus' => [
                    ['size' => '8', 'color' => 'Black/White', 'width' => 'medium', 'stock' => 20],
                    ['size' => '9', 'color' => 'Black/White', 'width' => 'medium', 'stock' => 18],
                    ['size' => '10', 'color' => 'Black/White', 'width' => 'wide', 'stock' => 10],
                ],
            ],
            [
                'name' => 'Court Legacy Pro',
                'brand' => 'Nike',
                'type' => 'lifestyle',
                'material' => 'leather',
                'description' => 'Clean court-inspired style for everyday wear.',
                'price' => 4895.00,
                'image' => null,
                'seller_id' => $seller->id,
                'performance_tech' => 'Foam Midsole',
                'release_date' => '2024-11-01',
                'gender' => 'unisex',
                'age_group' => 'adult',
                'is_trending' => false,
                'view_count' => 95,
                'skus' => [
                    ['size' => '7', 'color' => 'White/Green', 'width' => 'medium', 'stock' => 16],
                    ['size' => '8', 'color' => 'White/Green', 'width' => 'medium', 'stock' => 14],
                    ['size' => '9', 'color' => 'White/Green', 'width' => 'medium', 'stock' => 12],
                ],
            ],
            [
                'name' => 'Trail Guard X',
                'brand' => 'Nike',
                'type' => 'running',
                'material' => 'synthetic',
                'description' => 'Rugged trail shoe with durable traction and support.',
                'price' => 6595.00,
                'image' => null,
                'seller_id' => $seller->id,
                'performance_tech' => 'React Foam',
                'release_date' => '2025-02-20',
                'gender' => 'men',
                'age_group' => 'adult',
                'is_trending' => true,
                'view_count' => 210,
                'skus' => [
                    ['size' => '9', 'color' => 'Olive/Black', 'width' => 'medium', 'stock' => 9],
                    ['size' => '10', 'color' => 'Olive/Black', 'width' => 'medium', 'stock' => 11],
                    ['size' => '11', 'color' => 'Olive/Black', 'width' => 'wide', 'stock' => 8],
                ],
            ],
        ];

        foreach ($products as $data) {
            $skuRows = $data['skus'];
            unset($data['skus']);

            $product = Product::updateOrCreate(
                [
                    'seller_id' => $data['seller_id'],
                    'name' => $data['name'],
                ],
                $data
            );

            foreach ($skuRows as $sku) {
                Sku::updateOrCreate(
                    [
                        'product_id' => $product->id,
                        'size' => $sku['size'],
                        'color' => $sku['color'],
                        'width' => $sku['width'],
                    ],
                    [
                        'stock' => $sku['stock'],
                    ]
                );
            }
        }
    }
}
