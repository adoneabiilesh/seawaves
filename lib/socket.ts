import { Server as HTTPServer } from 'http';
import { Server as SocketIOServer } from 'socket.io';
import { NextApiRequest } from 'next';

export type SocketServer = SocketIOServer;

let io: SocketIOServer | null = null;

export const initSocketServer = (httpServer: HTTPServer) => {
    if (io) {
        console.log('Socket.io already initialized');
        return io;
    }

    io = new SocketIOServer(httpServer, {
        path: '/api/socket',
        addTrailingSlash: false,
        cors: {
            origin: process.env.NEXT_PUBLIC_APP_URL || 'http://localhost:3000',
            methods: ['GET', 'POST'],
        },
    });

    io.on('connection', (socket) => {
        console.log('Client connected:', socket.id);

        // Join restaurant room
        socket.on('join-restaurant', (restaurantId: string) => {
            socket.join(`restaurant-${restaurantId}`);
            console.log(`Socket ${socket.id} joined restaurant-${restaurantId}`);
        });

        // Leave restaurant room
        socket.on('leave-restaurant', (restaurantId: string) => {
            socket.leave(`restaurant-${restaurantId}`);
            console.log(`Socket ${socket.id} left restaurant-${restaurantId}`);
        });

        // Join kitchen room
        socket.on('join-kitchen', (restaurantId: string) => {
            socket.join(`kitchen-${restaurantId}`);
            console.log(`Socket ${socket.id} joined kitchen-${restaurantId}`);
        });

        socket.on('disconnect', () => {
            console.log('Client disconnected:', socket.id);
        });
    });

    console.log('Socket.io server initialized');
    return io;
};

export const getSocketServer = (): SocketIOServer | null => {
    return io;
};

// Emit events
export const emitNewOrder = (restaurantId: string, order: any) => {
    if (io) {
        io.to(`restaurant-${restaurantId}`).emit('new-order', order);
        io.to(`kitchen-${restaurantId}`).emit('new-order', order);
    }
};

export const emitOrderStatusChange = (restaurantId: string, orderId: string, status: string) => {
    if (io) {
        io.to(`restaurant-${restaurantId}`).emit('order-status-changed', { orderId, status });
        io.to(`kitchen-${restaurantId}`).emit('order-status-changed', { orderId, status });
    }
};

export const emitKitchenUpdate = (restaurantId: string, update: any) => {
    if (io) {
        io.to(`kitchen-${restaurantId}`).emit('kitchen-update', update);
    }
};

export const emitLowStockAlert = (restaurantId: string, product: any) => {
    if (io) {
        io.to(`restaurant-${restaurantId}`).emit('low-stock-alert', product);
    }
};
