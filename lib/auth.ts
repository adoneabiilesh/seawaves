import { NextAuthOptions } from 'next-auth';
import CredentialsProvider from 'next-auth/providers/credentials';
import bcrypt from 'bcryptjs';

// Dynamic import to avoid ESM issues
async function getSupabaseAdmin() {
    const { supabaseAdmin } = await import('./supabase-admin');
    return supabaseAdmin;
}

export const authOptions: NextAuthOptions = {
    providers: [
        CredentialsProvider({
            name: 'Credentials',
            credentials: {
                email: { label: 'Email', type: 'email' },
                password: { label: 'Password', type: 'password' }
            },
            async authorize(credentials) {
                if (!credentials?.email || !credentials?.password) {
                    throw new Error('Email and password required');
                }

                const supabaseAdmin = await getSupabaseAdmin();

                // Find user by email using Supabase
                const { data: user, error } = await supabaseAdmin
                    .from('User')
                    .select('*')
                    .eq('email', credentials.email)
                    .single();

                if (error || !user) {
                    throw new Error('Invalid email or password');
                }

                // Verify password
                const isValidPassword = await bcrypt.compare(
                    credentials.password,
                    user.password
                );

                if (!isValidPassword) {
                    throw new Error('Invalid email or password');
                }

                // Get user's restaurant roles
                const { data: roles } = await supabaseAdmin
                    .from('RestaurantRole')
                    .select(`
            *,
            Restaurant (
              id,
              name,
              subdomain
            )
          `)
                    .eq('userId', user.id)
                    .eq('status', 'accepted');

                // Return user data for session
                return {
                    id: user.id,
                    email: user.email,
                    name: `${user.firstName} ${user.lastName}`,
                    firstName: user.firstName,
                    lastName: user.lastName,
                    // Include restaurant roles for authorization
                    restaurantRoles: (roles || []).map((role: any) => ({
                        restaurantId: role.restaurantId,
                        restaurantName: role.Restaurant?.name,
                        restaurantSubdomain: role.Restaurant?.subdomain,
                        role: role.role,
                        status: role.status
                    }))
                };
            }
        })
    ],

    session: {
        strategy: 'jwt',
        maxAge: 30 * 24 * 60 * 60, // 30 days
    },

    pages: {
        signIn: '/login',
        error: '/login',
    },

    callbacks: {
        async jwt({ token, user }) {
            // On sign in, add user data to token
            if (user) {
                token.id = user.id;
                token.email = user.email;
                token.name = user.name;
                token.restaurantRoles = (user as any).restaurantRoles;
            }
            return token;
        },

        async session({ session, token }) {
            // Add user data to session
            if (token) {
                session.user = {
                    ...session.user,
                    id: token.id as string,
                    email: token.email as string,
                    name: token.name as string,
                    restaurantRoles: token.restaurantRoles as any[]
                };
            }
            return session;
        }
    },

    secret: process.env.NEXTAUTH_SECRET,
};
