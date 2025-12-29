'use client';

import React, { useState, useEffect } from 'react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Card, CardContent } from '@/components/ui/card';
import { User, Users, Sparkles } from 'lucide-react';

interface GuestNameEntryProps {
    tableNumber: number;
    onComplete: (guestName: string) => void;
    existingGuests?: { name: string; color: string }[];
}

const SUGGESTED_NAMES = [
    'Guest 1', 'Guest 2', 'Guest 3', 'Guest 4',
    'Marco', 'Sofia', 'Alessandro', 'Giulia',
    'Luca', 'Francesca', 'Giovanni', 'Isabella'
];

export const GuestNameEntry: React.FC<GuestNameEntryProps> = ({
    tableNumber,
    onComplete,
    existingGuests = []
}) => {
    const [guestName, setGuestName] = useState('');

    // Filter out names already in use
    const availableSuggestions = SUGGESTED_NAMES.filter(
        name => !existingGuests.some(g => g.name.toLowerCase() === name.toLowerCase())
    );

    const handleSubmit = (e: React.FormEvent) => {
        e.preventDefault();
        if (guestName.trim()) {
            onComplete(guestName.trim());
        }
    };

    const handleQuickSelect = (name: string) => {
        onComplete(name);
    };

    return (
        <div className="min-h-screen bg-[#FFFFF0] flex items-center justify-center p-4">
            <Card className="w-full max-w-md border-2 border-black shadow-[8px_8px_0px_0px_rgba(0,0,0,1)]">
                <CardContent className="p-8">
                    <div className="text-center mb-8">
                        <div className="w-20 h-20 bg-[#DC143C] rounded-full flex items-center justify-center mx-auto mb-4">
                            <Users className="w-10 h-10 text-white" />
                        </div>
                        <h1 className="text-3xl font-black uppercase tracking-tight">Table {tableNumber}</h1>
                        <p className="text-gray-600 mt-2">
                            Enter your name so others can see who ordered what
                        </p>
                    </div>

                    <form onSubmit={handleSubmit} className="space-y-4">
                        <div>
                            <label className="block text-sm font-bold mb-2">Your Name</label>
                            <div className="relative">
                                <User className="absolute left-3 top-1/2 -translate-y-1/2 w-5 h-5 text-gray-400" />
                                <Input
                                    type="text"
                                    placeholder="Enter your name"
                                    value={guestName}
                                    onChange={(e) => setGuestName(e.target.value)}
                                    className="pl-10 border-2 border-black py-6 text-lg"
                                    autoFocus
                                />
                            </div>
                        </div>

                        <Button
                            type="submit"
                            disabled={!guestName.trim()}
                            className="w-full py-6 bg-black text-white font-bold text-lg shadow-[4px_4px_0px_0px_#DC143C] hover:translate-x-[2px] hover:translate-y-[2px] hover:shadow-none transition-all"
                        >
                            <Sparkles className="mr-2 h-5 w-5" />
                            Start Ordering
                        </Button>
                    </form>

                    {/* Quick select names */}
                    <div className="mt-6">
                        <p className="text-sm text-gray-500 mb-3">Or quick select:</p>
                        <div className="flex flex-wrap gap-2">
                            {availableSuggestions.slice(0, 8).map(name => (
                                <button
                                    key={name}
                                    onClick={() => handleQuickSelect(name)}
                                    className="px-3 py-1.5 bg-white border-2 border-black rounded-full text-sm font-bold hover:bg-gray-100 transition-colors"
                                >
                                    {name}
                                </button>
                            ))}
                        </div>
                    </div>

                    {/* Show existing guests */}
                    {existingGuests.length > 0 && (
                        <div className="mt-6 pt-6 border-t">
                            <p className="text-sm text-gray-500 mb-3">Already at this table:</p>
                            <div className="flex flex-wrap gap-2">
                                {existingGuests.map((guest, i) => (
                                    <span
                                        key={i}
                                        className="px-3 py-1.5 rounded-full text-sm font-bold text-white"
                                        style={{ backgroundColor: guest.color }}
                                    >
                                        {guest.name}
                                    </span>
                                ))}
                            </div>
                        </div>
                    )}
                </CardContent>
            </Card>
        </div>
    );
};
