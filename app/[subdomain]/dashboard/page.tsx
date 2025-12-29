'use client';

import React from 'react';
import { useRouter } from 'next/navigation';
import { useSession } from 'next-auth/react';
import { AdminPanel } from '@/components/AdminPanel';
import { ManagerDashboard } from '@/components/ManagerDashboard';
import { WaiterDashboard } from '@/components/WaiterDashboard';
import { useApp } from '@/app/providers';
import { LoadingSkeleton } from '@/components/LoadingSkeletons';

export default function TenantDashboard({ params }: { params: { subdomain: string } }) {
    const router = useRouter();
    const { data: session, status } = useSession();
    const {
        user,
        products,
        addProduct,
        updateProduct,
        deleteProduct,
        categories,
        addCategory,
        updateCategory,
        deleteCategory,
        tables,
        addTable,
        removeTable,
        settings,
        updateSettings
    } = useApp();

    // Redirect if not authenticated
    React.useEffect(() => {
        if (status === 'loading') return;
        if (status === 'unauthenticated') {
            router.push('/login');
            return;
        }
    }, [status, router]);

    if (status === 'loading') {
        return (
            <div className="min-h-screen bg-[#FFFFF0] p-6">
                <LoadingSkeleton />
            </div>
        );
    }

    if (!session) return null;

    const userRoles = (session.user as any).restaurantRoles || [];
    const primaryRole = userRoles[0]?.role || 'owner';

    if (primaryRole === 'manager') return <ManagerDashboard />;
    if (primaryRole === 'waiter') return <WaiterDashboard />;
    if (primaryRole === 'kitchen') {
        router.push(`/${params.subdomain}/kitchen`);
        return null;
    }

    return (
        <div className="min-h-screen bg-[#FFFFF0]">
            <AdminPanel
                products={products}
                categories={categories}
                onAddProduct={addProduct}
                onUpdateProduct={updateProduct}
                onDeleteProduct={deleteProduct}
                onAddCategory={addCategory}
                onUpdateCategory={updateCategory}
                onDeleteCategory={deleteCategory}
                tables={tables}
                onAddTable={addTable}
                onRemoveTable={removeTable}
                settings={settings}
                onUpdateSettings={updateSettings}
            />
        </div>
    );
}
