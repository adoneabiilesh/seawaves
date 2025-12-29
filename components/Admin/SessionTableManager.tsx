'use client';

import React, { useState, useEffect } from 'react';
import { Table, QrCode, Plus, Users, Clock, DollarSign, X, RefreshCw, Check, AlertCircle, Download, Minus } from 'lucide-react';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '../ui/card';
import { Button } from '../ui/button';
import { Input } from '../ui/input';
import { TableSession } from '@/types';
import { useApp } from '@/app/providers';
import { cn } from '@/lib/utils';

interface SessionTableManagerProps {
    tables: number[];
    onAddTable: (num: number) => void;
    onRemoveTable: (num: number) => void;
}

export const SessionTableManager: React.FC<SessionTableManagerProps> = ({
    tables,
    onAddTable,
    onRemoveTable,
}) => {
    const { restaurantId } = useApp();
    const [sessions, setSessions] = useState<TableSession[]>([]);
    const [isLoading, setIsLoading] = useState(false);
    const [newTableNum, setNewTableNum] = useState('');
    const [selectedSession, setSelectedSession] = useState<TableSession | null>(null);

    // Guest count popup state
    const [showGuestPopup, setShowGuestPopup] = useState(false);
    const [pendingTableNumber, setPendingTableNumber] = useState<number | null>(null);
    const [guestCount, setGuestCount] = useState(2);

    // Fetch active sessions
    const fetchSessions = async () => {
        if (!restaurantId) return;

        setIsLoading(true);
        try {
            const res = await fetch(`/api/sessions/open?restaurantId=${restaurantId}`);
            const data = await res.json();
            setSessions(data.sessions || []);
        } catch (error) {
            console.error('Error fetching sessions:', error);
        }
        setIsLoading(false);
    };

    useEffect(() => {
        fetchSessions();
        // Poll every 30 seconds for updates
        const interval = setInterval(fetchSessions, 30000);
        return () => clearInterval(interval);
    }, [restaurantId]);

    // Show guest popup before opening session
    const handleOpenTable = (tableNumber: number) => {
        setPendingTableNumber(tableNumber);
        setGuestCount(2); // Reset to default
        setShowGuestPopup(true);
    };

    // Confirm and open session
    const confirmOpenSession = async () => {
        if (!restaurantId || !pendingTableNumber) return;

        try {
            const res = await fetch('/api/sessions/open', {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({ restaurantId, tableNumber: pendingTableNumber, guestCount })
            });
            const data = await res.json();

            if (data.success) {
                setShowGuestPopup(false);
                setPendingTableNumber(null);
                fetchSessions();
            } else {
                alert(data.error || 'Failed to open table');
            }
        } catch (error) {
            console.error('Error opening session:', error);
            alert('Failed to open table session');
        }
    };

    // Close a session
    const closeSession = async (sessionId: string) => {
        try {
            const res = await fetch('/api/sessions/close', {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({ sessionId })
            });
            const data = await res.json();

            if (data.success) {
                alert(data.message);
                setSelectedSession(null);
                fetchSessions();
            } else {
                alert(data.error || 'Failed to close session');
            }
        } catch (error) {
            console.error('Error closing session:', error);
            alert('Failed to close session');
        }
    };

    // Get session for a table (check sessionStatus, not status)
    const getSessionForTable = (tableNumber: number) => {
        return sessions.find(s => s.tableNumber === tableNumber && (s as any).sessionStatus === 'active');
    };

    // Generate permanent QR code URL
    const getQrCodeUrl = (tableNumber: number, size: number = 200) => {
        const dineInUrl = `${typeof window !== 'undefined' ? window.location.origin : ''}/dine-in?table=${tableNumber}`;
        return `https://api.qrserver.com/v1/create-qr-code/?size=${size}x${size}&data=${encodeURIComponent(dineInUrl)}`;
    };

    // Download QR code
    const downloadQR = async (tableNumber: number) => {
        const url = getQrCodeUrl(tableNumber, 400);
        const response = await fetch(url);
        const blob = await response.blob();
        const link = document.createElement('a');
        link.href = URL.createObjectURL(blob);
        link.download = `table-${tableNumber}-qr.png`;
        link.click();
    };

    // Format elapsed time
    const formatElapsed = (startedAt: string) => {
        const start = new Date(startedAt);
        const now = new Date();
        const mins = Math.floor((now.getTime() - start.getTime()) / 60000);
        const hours = Math.floor(mins / 60);
        if (hours > 0) return `${hours}h ${mins % 60}m`;
        return `${mins}m`;
    };

    return (
        <div className="space-y-6">
            {/* Header with refresh and add table */}
            <div className="flex items-center justify-between">
                <div>
                    <h2 className="text-2xl font-black uppercase tracking-wider">Table Sessions</h2>
                    <p className="text-sm text-gray-500">Click a free table to open session • Click active table to view/close</p>
                </div>
                <div className="flex gap-3">
                    <Button variant="outline" onClick={fetchSessions} disabled={isLoading}>
                        <RefreshCw className={cn("h-4 w-4 mr-2", isLoading && "animate-spin")} />
                        Refresh
                    </Button>
                    <div className="flex gap-2">
                        <Input
                            type="number"
                            className="w-20"
                            placeholder="#"
                            value={newTableNum}
                            onChange={e => setNewTableNum(e.target.value)}
                        />
                        <Button onClick={() => {
                            if (newTableNum) {
                                onAddTable(parseInt(newTableNum));
                                setNewTableNum('');
                            }
                        }}>
                            <Plus className="h-4 w-4 mr-2" /> Add Table
                        </Button>
                    </div>
                </div>
            </div>

            {/* Table Grid */}
            <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-5 gap-4">
                {tables.map(tableNum => {
                    const session = getSessionForTable(tableNum);
                    const isActive = !!session;

                    return (
                        <Card
                            key={tableNum}
                            className={cn(
                                "cursor-pointer transition-all border-2 hover:shadow-lg",
                                isActive
                                    ? "border-[#DC143C] bg-[#DC143C]/5"
                                    : "border-gray-200 hover:border-black"
                            )}
                            onClick={() => isActive ? setSelectedSession(session) : handleOpenTable(tableNum)}
                        >
                            <CardContent className="p-4 flex flex-col items-center gap-2">
                                <div className="flex justify-between w-full">
                                    <span className={cn(
                                        "text-xs uppercase font-bold px-2 py-0.5 rounded",
                                        isActive ? "bg-[#DC143C] text-white" : "bg-green-100 text-green-800"
                                    )}>
                                        {isActive ? 'Active' : 'Free'}
                                    </span>
                                    {isActive && (
                                        <span className="text-xs text-gray-500 flex items-center gap-1">
                                            <Clock className="h-3 w-3" />
                                            {formatElapsed(session.startedAt)}
                                        </span>
                                    )}
                                </div>

                                <div className="text-3xl font-black">{tableNum}</div>

                                {isActive ? (
                                    <div className="text-center">
                                        <div className="flex items-center gap-1 text-sm">
                                            <Users className="h-4 w-4" /> {session.guestCount} guests
                                        </div>
                                        <div className="font-bold text-lg text-[#DC143C]">
                                            ${(session.totalAmount || 0).toFixed(2)}
                                        </div>
                                    </div>
                                ) : (
                                    <Button size="sm" className="mt-2 w-full" onClick={(e) => {
                                        e.stopPropagation();
                                        handleOpenTable(tableNum);
                                    }}>
                                        Open Table
                                    </Button>
                                )}
                            </CardContent>
                        </Card>
                    );
                })}
            </div>

            {/* Guest Count Popup Modal */}
            {showGuestPopup && pendingTableNumber && (
                <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-4">
                    <Card className="w-full max-w-sm border-2 border-black shadow-[8px_8px_0px_0px_rgba(0,0,0,1)]">
                        <CardHeader>
                            <CardTitle className="flex items-center gap-2">
                                <Users className="h-6 w-6" />
                                Open Table {pendingTableNumber}
                            </CardTitle>
                            <CardDescription>How many guests at this table?</CardDescription>
                        </CardHeader>
                        <CardContent className="space-y-4">
                            {/* Guest Count Selector */}
                            <div className="flex items-center justify-center gap-4">
                                <Button
                                    variant="outline"
                                    size="icon"
                                    className="h-12 w-12 rounded-full border-2"
                                    onClick={() => setGuestCount(Math.max(1, guestCount - 1))}
                                >
                                    <Minus className="h-5 w-5" />
                                </Button>
                                <div className="text-5xl font-black w-20 text-center">{guestCount}</div>
                                <Button
                                    variant="outline"
                                    size="icon"
                                    className="h-12 w-12 rounded-full border-2"
                                    onClick={() => setGuestCount(guestCount + 1)}
                                >
                                    <Plus className="h-5 w-5" />
                                </Button>
                            </div>

                            {/* Actions */}
                            <div className="flex gap-3 pt-4">
                                <Button
                                    variant="outline"
                                    className="flex-1"
                                    onClick={() => {
                                        setShowGuestPopup(false);
                                        setPendingTableNumber(null);
                                    }}
                                >
                                    Cancel
                                </Button>
                                <Button
                                    className="flex-1 bg-[#DC143C] hover:bg-[#DC143C]/90"
                                    onClick={confirmOpenSession}
                                >
                                    <Check className="h-4 w-4 mr-2" />
                                    Open Table
                                </Button>
                            </div>
                        </CardContent>
                    </Card>
                </div>
            )}

            {/* Selected Session Detail Modal */}
            {selectedSession && (
                <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-4">
                    <Card className="w-full max-w-lg border-2 border-black">
                        <CardHeader className="flex flex-row items-center justify-between">
                            <div>
                                <CardTitle>Table {selectedSession.tableNumber}</CardTitle>
                                <CardDescription>
                                    Session active for {formatElapsed(selectedSession.startedAt)}
                                </CardDescription>
                            </div>
                            <Button variant="ghost" size="sm" onClick={() => setSelectedSession(null)}>
                                <X className="h-5 w-5" />
                            </Button>
                        </CardHeader>
                        <CardContent className="space-y-4">
                            {/* QR Code */}
                            <div className="flex flex-col items-center p-4 bg-white rounded-xl border-2 border-dashed border-gray-300">
                                <img
                                    src={getQrCodeUrl(selectedSession.tableNumber)}
                                    alt="Table QR Code"
                                    className="w-40 h-40"
                                />
                                <p className="text-sm text-gray-500 mt-2">Permanent QR for Table {selectedSession.tableNumber}</p>
                                <Button
                                    variant="outline"
                                    size="sm"
                                    className="mt-2"
                                    onClick={() => downloadQR(selectedSession.tableNumber)}
                                >
                                    <Download className="h-4 w-4 mr-2" /> Download QR
                                </Button>
                            </div>

                            {/* Session Info */}
                            <div className="grid grid-cols-2 gap-4">
                                <div className="bg-gray-50 p-3 rounded-lg">
                                    <p className="text-xs text-gray-500 uppercase">Guests</p>
                                    <p className="text-xl font-bold flex items-center gap-2">
                                        <Users className="h-5 w-5" /> {selectedSession.guestCount}
                                    </p>
                                </div>
                                <div className="bg-gray-50 p-3 rounded-lg">
                                    <p className="text-xs text-gray-500 uppercase">Running Total</p>
                                    <p className="text-xl font-bold flex items-center gap-2 text-[#DC143C]">
                                        <DollarSign className="h-5 w-5" /> {(selectedSession.totalAmount || 0).toFixed(2)}
                                    </p>
                                </div>
                            </div>

                            {/* Orders in this session */}
                            {(selectedSession as any).orders && (selectedSession as any).orders.length > 0 && (
                                <div>
                                    <h4 className="font-bold mb-2">Orders</h4>
                                    <div className="space-y-2 max-h-40 overflow-y-auto">
                                        {(selectedSession as any).orders.map((order: any) => (
                                            <div key={order.id} className="flex justify-between text-sm p-2 bg-gray-50 rounded">
                                                <span>Order #{order.id.slice(-6)}</span>
                                                <span className="font-bold">${(order.total || 0).toFixed(2)}</span>
                                            </div>
                                        ))}
                                    </div>
                                </div>
                            )}

                            {/* Actions */}
                            <div className="flex gap-3 pt-4 border-t">
                                <Button
                                    variant="outline"
                                    className="flex-1"
                                    onClick={() => setSelectedSession(null)}
                                >
                                    Back
                                </Button>
                                <Button
                                    className="flex-1 bg-[#DC143C] hover:bg-[#DC143C]/90"
                                    onClick={() => closeSession(selectedSession.id)}
                                >
                                    <Check className="h-4 w-4 mr-2" />
                                    Close & Bill (${(selectedSession.totalAmount || 0).toFixed(2)})
                                </Button>
                            </div>
                        </CardContent>
                    </Card>
                </div>
            )}
        </div>
    );
};
