import { DefaultSession } from 'next-auth';

declare module 'next-auth' {
    interface Session {
        user: {
            id: string;
            email: string;
            name: string;
            restaurantRoles?: Array<{
                restaurantId: string;
                restaurantName: string;
                restaurantSubdomain: string;
                role: string;
                status: string;
            }>;
        } & DefaultSession['user'];
    }

    interface User {
        id: string;
        email: string;
        name: string;
        firstName: string;
        lastName: string;
        restaurantRoles?: any[];
    }
}

declare module 'next-auth/jwt' {
    interface JWT {
        id: string;
        email: string;
        name: string;
        restaurantRoles?: any[];
    }
}
