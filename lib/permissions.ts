// Permission types
export type Role = 'owner' | 'manager' | 'waiter' | 'kitchen';

export type Permission =
    | 'view:dashboard'
    | 'view:orders'
    | 'view:orders:own'      // Waiter: only their tables
    | 'view:orders:kitchen'  // Kitchen: only kitchen orders
    | 'view:kitchen'
    | 'view:payments'
    | 'view:inventory'
    | 'view:analytics'
    | 'edit:menu'
    | 'edit:inventory'
    | 'edit:settings'
    | 'manage:team'
    | 'process:payments'
    | 'update:order:status'
    | 'add:items';

// Permission matrix for each role
const PERMISSIONS: Record<Role, Permission[]> = {
    owner: [
        'view:dashboard',
        'view:orders',
        'view:kitchen',
        'view:payments',
        'view:inventory',
        'view:analytics',
        'edit:menu',
        'edit:inventory',
        'edit:settings',
        'manage:team',
        'process:payments',
        'update:order:status',
        'add:items'
    ],

    manager: [
        'view:dashboard',
        'view:orders',
        'view:kitchen',
        'view:inventory',
        'view:analytics',
        'edit:inventory',
        'update:order:status',
        'add:items'
    ],

    waiter: [
        'view:dashboard',
        'view:orders:own',  // Only active orders for their tables
        'update:order:status',
        'add:items'
    ],

    kitchen: [
        'view:dashboard',
        'view:orders:kitchen',  // Only kitchen orders (pending/preparing)
        'update:order:status'
    ]
};

// Role hierarchy (higher number = more access)
const ROLE_HIERARCHY: Record<Role, number> = {
    owner: 4,
    manager: 3,
    waiter: 2,
    kitchen: 1
};

/**
 * Check if a role has a specific permission
 */
export function hasPermission(role: Role | null, permission: Permission): boolean {
    if (!role) return false;
    return PERMISSIONS[role]?.includes(permission) ?? false;
}

/**
 * Check if a role can access a route that requires a minimum role level
 */
export function canAccess(
    userRole: Role | null,
    requiredRole: Role
): boolean {
    if (!userRole) return false;
    return ROLE_HIERARCHY[userRole] >= ROLE_HIERARCHY[requiredRole];
}

/**
 * Get all accessible routes for a role
 */
export function getAccessibleRoutes(role: Role): string[] {
    const routes: Record<Role, string[]> = {
        owner: [
            '/dashboard',
            '/dashboard/menu',
            '/dashboard/orders',
            '/dashboard/kitchen',
            '/dashboard/inventory',
            '/dashboard/payments',
            '/dashboard/team',
            '/dashboard/settings',
            '/dashboard/analytics'
        ],

        manager: [
            '/dashboard',
            '/dashboard/orders',
            '/dashboard/kitchen',
            '/dashboard/inventory',
            '/dashboard/analytics'
        ],

        waiter: [
            '/dashboard',
            '/dashboard/tables'  // Custom waiter view
        ],

        kitchen: [
            '/dashboard',
            '/dashboard/kitchen'
        ]
    };

    return routes[role] || [];
}

/**
 * Check if a user has access to a specific route
 */
export function canAccessRoute(role: Role | null, path: string): boolean {
    if (!role) return false;
    const accessibleRoutes = getAccessibleRoutes(role);
    return accessibleRoutes.some(route => path === route || path.startsWith(route + '/'));
}

/**
 * Get the default redirect path for a role
 */
export function getDefaultRedirect(role: Role): string {
    const redirects: Record<Role, string> = {
        owner: '/dashboard',
        manager: '/dashboard/orders',
        waiter: '/dashboard/tables',
        kitchen: '/dashboard/kitchen'
    };

    return redirects[role] || '/dashboard';
}
