import { NextResponse } from 'next/server';
import { supabaseAdmin } from '@/lib/supabase-admin';

export async function GET() {
    try {
        // 1. Get or Create a Tenant (Restaurant)
        let { data: restaurant } = await supabaseAdmin.from('Restaurant').select('id').limit(1).maybeSingle();

        if (!restaurant) {
            // Create dummy restaurant if none
            const { data: newRest, error } = await supabaseAdmin.from('Restaurant').insert({
                name: 'Culinary AI Demo',
                subdomain: 'demo',
            }).select().single();
            if (error) throw error;
            restaurant = newRest;
        }

        const restaurantId = restaurant.id;

        // 2. Create Categories
        const categories = [
            { name: { en: 'Appetizers', ar: 'مقبلات' }, displayOrder: 1 },
            { name: { en: 'Main Course', ar: 'الطبق الرئيسي' }, displayOrder: 2 },
            { name: { en: 'Beverages', ar: 'مشروبات' }, displayOrder: 3 },
        ];

        const filledCategories = [];

        for (const cat of categories) {
            const { data, error } = await supabaseAdmin.from('Category').insert({
                restaurantId,
                name: cat.name,
                displayOrder: cat.displayOrder
            }).select().single();
            if (error) console.log('Cat exists or error', error);
            else filledCategories.push(data);
        }

        // 3. Create Products
        // Need category IDs
        const { data: allCats } = await supabaseAdmin.from('Category').select('*').eq('restaurantId', restaurantId);
        if (!allCats) return NextResponse.json({ error: 'No categories' });

        const appParams = allCats.find((c: any) => c.name.en === 'Appetizers')?.id;
        const mainParams = allCats.find((c: any) => c.name.en === 'Main Course')?.id;
        const bevParams = allCats.find((c: any) => c.name.en === 'Beverages')?.id;

        const products = [
            {
                name: { en: 'Truffle Fries', ar: 'بطاطا الكمأة' },
                description: { en: 'Crispy fries with truffle oil and parmesan', ar: 'بطاطا مقرمشة مع زيت الكمأة والبارميزان' },
                price: 12.00,
                categoryId: appParams,
                imageUrl: 'https://images.unsplash.com/photo-1573080496987-a199f8cd75c9?w=800&q=80',
                stock: 50,
                available: true
            },
            {
                name: { en: 'Wagyu Burger', ar: 'برجر واغيو' },
                description: { en: 'Premium Wagyu beef, brioche bun, secret sauce', ar: 'لحم واغيو فاخر، خبز بريوش، صلصة سرية' },
                price: 28.00,
                categoryId: mainParams,
                imageUrl: 'https://images.unsplash.com/photo-1568901346375-23c9450c58cd?w=800&q=80',
                stock: 20,
                available: true
            },
            {
                name: { en: 'Matcha Latte', ar: 'ماتشا لاتيه' },
                description: { en: 'Premium ceremonial grade matcha with oat milk', ar: 'ماتشا فاخرة مع حليب الشوفان' },
                price: 6.50,
                categoryId: bevParams,
                imageUrl: 'https://images.unsplash.com/photo-1515825838458-f2a94b20105a?w=800&q=80',
                stock: 100,
                available: true
            },
            {
                name: { en: 'Caesar Salad', ar: 'سلطة سيزر' },
                description: { en: 'Romaine lettuce, croutons, parmesan, caesar dressing', ar: 'خس روماني، خبز محمص، بارميزان، تتبيلة سيزر' },
                price: 14.00,
                categoryId: appParams,
                imageUrl: 'https://images.unsplash.com/photo-1550304943-4f24f54ddde9?w=800&q=80',
                stock: 30,
                available: true
            }
        ];

        let count = 0;
        for (const p of products) {
            if (!p.categoryId) continue;
            const { error } = await supabaseAdmin.from('Product').insert({
                restaurantId,
                ...p
            });
            if (!error) count++;
        }

        return NextResponse.json({ success: true, seeded: count });

    } catch (e: any) {
        return NextResponse.json({ error: e.message }, { status: 500 });
    }
}
