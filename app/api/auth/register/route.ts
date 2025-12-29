import { NextRequest, NextResponse } from 'next/server';
import bcrypt from 'bcryptjs';
import { supabaseAdmin } from '@/lib/supabase-admin';
import { generateSubdomain, isValidSubdomain, isReservedSubdomain } from '@/lib/tenant';

interface DemoProduct {
    name: { en: string; it?: string; fr?: string; de?: string };
    description: { en: string; it?: string; fr?: string; de?: string };
    price: number;
    category: string;
    imageUrl?: string;
    nutrition?: { calories?: number; protein?: number; carbs?: number; fat?: number };
    allergens?: string[];
    ingredients?: string[];
    available?: boolean;
}

export async function POST(request: NextRequest) {
    try {
        const body = await request.json();
        const { email, password, firstName, lastName, phone, restaurantName, planSlug, demoProducts } = body;

        // Validate required fields
        if (!email || !password || !firstName || !lastName || !restaurantName) {
            return NextResponse.json(
                { error: 'Missing required fields' },
                { status: 400 }
            );
        }

        // Check if user already exists
        const { data: existingUser } = await supabaseAdmin
            .from('User')
            .select('id')
            .eq('email', email)
            .single();

        if (existingUser) {
            return NextResponse.json(
                { error: 'User with this email already exists' },
                { status: 400 }
            );
        }

        // Generate subdomain from restaurant name
        let subdomain = generateSubdomain(restaurantName);

        // Validate subdomain format
        if (!isValidSubdomain(subdomain)) {
            return NextResponse.json(
                { error: 'Invalid restaurant name for subdomain generation' },
                { status: 400 }
            );
        }

        // Check if subdomain is reserved
        if (isReservedSubdomain(subdomain)) {
            return NextResponse.json(
                { error: 'This restaurant name is reserved' },
                { status: 400 }
            );
        }

        // Check if subdomain already exists
        const { data: existingRestaurant } = await supabaseAdmin
            .from('Restaurant')
            .select('id')
            .eq('subdomain', subdomain)
            .single();

        // If exists, add random suffix
        if (existingRestaurant) {
            const randomSuffix = Math.random().toString(36).substring(2, 7);
            subdomain = `${subdomain}-${randomSuffix}`;
        }

        // Hash password
        const hashedPassword = await bcrypt.hash(password, 10);

        // Create user
        const { data: user, error: userError } = await supabaseAdmin
            .from('User')
            .insert({
                email,
                password: hashedPassword,
                firstName,
                lastName,
                phone: phone || null
            })
            .select()
            .single();

        if (userError || !user) {
            console.error('User creation error:', userError);
            return NextResponse.json(
                { error: 'Failed to create user account' },
                { status: 500 }
            );
        }

        // Look up subscription plan if provided
        let subscriptionPlanId = null;
        if (planSlug) {
            const { data: plan } = await supabaseAdmin
                .from('SubscriptionPlan')
                .select('id')
                .eq('slug', planSlug)
                .single();
            subscriptionPlanId = plan?.id || null;
        }

        // Calculate trial end date (14 days from now)
        const trialEndsAt = new Date();
        trialEndsAt.setDate(trialEndsAt.getDate() + 14);

        // Create restaurant with subscription
        const { data: restaurant, error: restaurantError } = await supabaseAdmin
            .from('Restaurant')
            .insert({
                name: restaurantName,
                subdomain,
                phone: phone || null,
                subscriptionPlanId,
                subscriptionStatus: 'trial',
                subscriptionStartedAt: new Date().toISOString(),
                trialEndsAt: trialEndsAt.toISOString(),
            })
            .select()
            .single();

        if (restaurantError || !restaurant) {
            console.error('Restaurant creation error:', restaurantError);
            // Rollback user creation
            await supabaseAdmin.from('User').delete().eq('id', user.id);
            return NextResponse.json(
                { error: 'Failed to create restaurant' },
                { status: 500 }
            );
        }

        // Link user to restaurant as owner
        const { error: ownerError } = await supabaseAdmin
            .from('Owner')
            .insert({
                userId: user.id,
                restaurantId: restaurant.id
            });

        if (ownerError) {
            console.error('Owner link creation error:', ownerError);
            // Rollback
            await supabaseAdmin.from('Restaurant').delete().eq('id', restaurant.id);
            await supabaseAdmin.from('User').delete().eq('id', user.id);
            return NextResponse.json(
                { error: 'Failed to link owner to restaurant' },
                { status: 500 }
            );
        }

        // Create restaurant role for the owner
        const { error: roleError } = await supabaseAdmin
            .from('RestaurantRole')
            .insert({
                userId: user.id,
                restaurantId: restaurant.id,
                role: 'owner',
                status: 'accepted'
            });

        if (roleError) {
            console.error('Role creation error:', roleError);
            // Continue anyway - owner link is more important
        }

        // Import demo products if provided
        if (demoProducts && Array.isArray(demoProducts) && demoProducts.length > 0) {
            try {
                const productsToInsert = (demoProducts as DemoProduct[]).map((p: DemoProduct) => ({
                    restaurantId: restaurant.id,
                    name: p.name,
                    description: p.description,
                    price: p.price,
                    category: p.category || 'Main Course',
                    imageUrl: p.imageUrl || null,
                    nutrition: p.nutrition || null,
                    allergens: p.allergens || [],
                    ingredients: p.ingredients || [],
                    stock: 100,
                    available: p.available !== false,
                    isAiGenerated: true
                }));

                const { error: productsError } = await supabaseAdmin
                    .from('Product')
                    .insert(productsToInsert);

                if (productsError) {
                    console.error('Demo products import error:', productsError);
                    // Continue anyway - registration succeeded
                }
            } catch (importError) {
                console.error('Demo products import failed:', importError);
                // Continue anyway - registration succeeded
            }
        }

        return NextResponse.json({
            success: true,
            user: {
                id: user.id,
                email: user.email,
                firstName: user.firstName,
                lastName: user.lastName
            },
            restaurant: {
                id: restaurant.id,
                name: restaurant.name,
                subdomain: restaurant.subdomain
            }
        });

    } catch (error) {
        console.error('Registration error:', error);
        return NextResponse.json(
            { error: 'Failed to create account' },
            { status: 500 }
        );
    }
}

