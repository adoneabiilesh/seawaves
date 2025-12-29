'use client';

import React, { useState } from 'react';
import { Table, QrCode, Trash2, Plus, Clock, Save, Download, RefreshCw } from 'lucide-react';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '../ui/card';
import { Button } from '../ui/button';
import { Input } from '../ui/input';
import { TableOrdersManager, TableOrder } from '../TableOrdersManager';

interface TableManagerProps {
    tables: number[];
    tableOrders: TableOrder[];
    onAddTable: (num: number) => void;
    onRemoveTable: (num: number) => void;
    onCloseTable: (num: number) => void;
}

export const TableManager: React.FC<TableManagerProps> = ({
    tables,
    tableOrders,
    onAddTable,
    onRemoveTable,
    onCloseTable,
}) => {
    const [newTableNum, setNewTableNum] = useState('');
    const [selectedTable, setSelectedTable] = useState<number | null>(null);

    const getTableStatus = (num: number) => {
        const order = tableOrders.find(o => o.tableNumber === num && o.isActive);
        if (!order) return 'available';
        return order.orders.some(o => o.status === 'ready' || o.status === 'served') ? 'occupied' : 'ordering';
    };

    const activeOrder = selectedTable ? tableOrders.find(o => o.tableNumber === selectedTable && o.isActive) : null;

    return (
        <div className="space-y-6">
            {/* Table Grid & Creation */}
            <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
                <div className="lg:col-span-2 space-y-6">
                    <Card className="border border-[#111111]">
                        <CardHeader className="flex flex-row items-center justify-between">
                            <div>
                                <CardTitle>Restaurant Tables</CardTitle>
                                <CardDescription>Monitor status and manage QR codes</CardDescription>
                            </div>
                            <div className="flex gap-2">
                                <Input
                                    type="number"
                                    className="w-24"
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
                        </CardHeader>
                        <CardContent>
                            <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 gap-4">
                                {tables.map(num => {
                                    const status = getTableStatus(num);
                                    const statusColor = status === 'available' ? 'bg-green-100 text-green-800' : 'bg-red-100 text-red-800';

                                    return (
                                        <Card
                                            key={num}
                                            className={`cursor-pointer transition-all border-2 ${selectedTable === num ? 'border-[#111111]' : 'border-transparent'} hover:border-[#111111]/50`}
                                            onClick={() => setSelectedTable(num)}
                                        >
                                            <CardContent className="p-4 flex flex-col items-center gap-3">
                                                <div className="flex justify-between w-full">
                                                    <span className={`text-[10px] uppercase font-bold px-2 py-0.5 rounded ${statusColor}`}>
                                                        {status}
                                                    </span>
                                                    <Trash2
                                                        className="h-4 w-4 text-red-500 opacity-20 hover:opacity-100 transition-opacity"
                                                        onClick={(e) => { e.stopPropagation(); onRemoveTable(num); }}
                                                    />
                                                </div>
                                                <div className="w-16 h-16 bg-[#111111]/5 rounded-full flex items-center justify-center">
                                                    <span className="text-2xl font-bold">T{num}</span>
                                                </div>
                                                {getTableStatus(num) !== 'available' && (
                                                    <div className="text-xs font-medium flex items-center gap-1">
                                                        <Clock className="h-3 w-3" /> Active
                                                    </div>
                                                )}
                                            </CardContent>
                                        </Card>
                                    );
                                })}
                            </div>
                        </CardContent>
                    </Card>
                </div>

                {/* Selected Table Detail */}
                <div className="lg:col-span-1">
                    {selectedTable ? (
                        <Card className="border border-[#111111] h-full">
                            <CardHeader>
                                <CardTitle>Table {selectedTable}</CardTitle>
                            </CardHeader>
                            <CardContent className="space-y-6">
                                {/* QR Code Section */}
                                <div className="flex flex-col items-center p-4 bg-[#111111]/5 rounded-lg">
                                    <img
                                        src={`https://api.qrserver.com/v1/create-qr-code/?size=150x150&data=${encodeURIComponent(`${window.location.origin}/dine-in?table=${selectedTable}`)}`}
                                        className="w-32 h-32 mix-blend-multiply"
                                        alt={`QR Code for Table ${selectedTable}`}
                                        id={`qr-code-${selectedTable}`}
                                    />
                                    <div className="flex gap-2 mt-4">
                                        <Button variant="outline" size="sm" onClick={async () => {
                                            try {
                                                const url = `https://api.qrserver.com/v1/create-qr-code/?size=500x500&data=${encodeURIComponent(`${window.location.origin}/dine-in?table=${selectedTable}`)}`;
                                                const response = await fetch(url);
                                                const blob = await response.blob();
                                                const link = document.createElement('a');
                                                link.href = window.URL.createObjectURL(blob);
                                                link.download = `table-${selectedTable}-qr.png`;
                                                document.body.appendChild(link);
                                                link.click();
                                                document.body.removeChild(link);
                                            } catch (e) {
                                                console.error("Failed to download QR", e);
                                            }
                                        }}>
                                            <Download className="h-4 w-4 mr-2" /> Save QR
                                        </Button>
                                        <Button variant="outline" size="sm">
                                            <RefreshCw className="h-4 w-4 mr-2" /> Reset
                                        </Button>
                                    </div>
                                </div>

                                {/* Current Order Summary */}
                                <div>
                                    <h3 className="font-bold mb-2">Live Status</h3>
                                    {activeOrder ? (
                                        <div className="space-y-2">
                                            <div className="flex justify-between text-sm">
                                                <span>Current Bill</span>
                                                <span className="font-bold">${activeOrder.totalAmount.toFixed(2)}</span>
                                            </div>
                                            <div className="flex justify-between text-sm">
                                                <span>Paid</span>
                                                <span className="text-green-600 font-bold">${activeOrder.paidAmount.toFixed(2)}</span>
                                            </div>
                                            <Button className="w-full mt-2" variant="destructive" onClick={() => onCloseTable(selectedTable)}>
                                                Close Table Session
                                            </Button>
                                        </div>
                                    ) : (
                                        <p className="text-sm text-[#111111]/50 italic">No active session</p>
                                    )}
                                </div>
                            </CardContent>
                        </Card>
                    ) : (
                        <div className="h-full flex items-center justify-center border border-dashed border-[#111111]/20 rounded-lg p-6">
                            <p className="text-[#111111]/40">Select a table to view details</p>
                        </div>
                    )}
                </div>
            </div>

            {/* Embedded Order Manager for Detail View */}
            {selectedTable && (
                <div className="mt-8">
                    <h3 className="text-xl font-bold mb-4">Detailed Order History</h3>
                    <TableOrdersManager
                        tableOrders={tableOrders.filter(o => o.tableNumber === selectedTable)}
                        onCloseTable={onCloseTable}
                        onViewOrder={() => { }}
                    />
                </div>
            )}
        </div>
    );
};
