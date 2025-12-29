'use client';

import { useEffect, useState } from 'react';
import { io, Socket } from 'socket.io-client';

let socket: Socket | null = null;

export const useSocket = (restaurantId?: string) => {
    const [isConnected, setIsConnected] = useState(false);

    useEffect(() => {
        // Initialize socket connection
        if (!socket) {
            socket = io({
                path: '/api/socket',
            });

            socket.on('connect', () => {
                console.log('Socket connected');
                setIsConnected(true);
            });

            socket.on('disconnect', () => {
                console.log('Socket disconnected');
                setIsConnected(false);
            });
        }

        // Join restaurant room if provided
        if (restaurantId && socket) {
            socket.emit('join-restaurant', restaurantId);
        }

        return () => {
            if (restaurantId && socket) {
                socket.emit('leave-restaurant', restaurantId);
            }
        };
    }, [restaurantId]);

    return { socket, isConnected };
};

export const useKitchenSocket = (restaurantId?: string) => {
    const [isConnected, setIsConnected] = useState(false);

    useEffect(() => {
        if (!socket) {
            socket = io({
                path: '/api/socket',
            });

            socket.on('connect', () => {
                console.log('Kitchen socket connected');
                setIsConnected(true);
            });

            socket.on('disconnect', () => {
                console.log('Kitchen socket disconnected');
                setIsConnected(false);
            });
        }

        if (restaurantId && socket) {
            socket.emit('join-kitchen', restaurantId);
        }

        return () => {
            if (restaurantId && socket) {
                socket.emit('leave-kitchen', restaurantId);
            }
        };
    }, [restaurantId]);

    return { socket, isConnected };
};
