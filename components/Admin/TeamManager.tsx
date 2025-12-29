'use client';

import React, { useState, useEffect } from 'react';
import { User, Users, UserPlus, Shield, X, Mail, Trash2, RefreshCw, Copy, Check } from 'lucide-react';
import { Button } from '../ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '../ui/card';
import { Input } from '../ui/input';
import { useApp } from '@/app/providers';
import { toast } from 'sonner';

interface StaffMember {
    id: string;
    userId?: string;
    invitedEmail?: string;
    role: 'owner' | 'manager' | 'waiter' | 'kitchen';
    status: 'accepted' | 'pending' | 'inactive';
    User?: {
        firstName: string;
        lastName: string;
        email: string;
    };
}

export const TeamManager = () => {
    const { restaurantId, user } = useApp();
    const [staff, setStaff] = useState<StaffMember[]>([]);
    const [isLoading, setIsLoading] = useState(true);
    const [isInviting, setIsInviting] = useState(false);
    const [inviteData, setInviteData] = useState({ name: '', email: '', role: 'waiter' as any });
    const [isSending, setIsSending] = useState(false);
    const [copiedUrl, setCopiedUrl] = useState<string | null>(null);

    // Fetch team members
    const fetchTeam = async () => {
        if (!restaurantId) return;
        setIsLoading(true);

        try {
            const res = await fetch(`/api/team?restaurantId=${restaurantId}`);
            const data = await res.json();

            if (data.members) {
                setStaff(data.members);
            }
        } catch (err) {
            console.error('Error fetching team:', err);
        }

        setIsLoading(false);
    };

    useEffect(() => {
        fetchTeam();
    }, [restaurantId]);

    const handleInvite = async () => {
        if (!inviteData.email || !inviteData.role || !restaurantId) {
            toast.error('Please fill all fields');
            return;
        }

        setIsSending(true);

        try {
            const res = await fetch('/api/team/invite', {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({
                    email: inviteData.email,
                    name: inviteData.name,
                    role: inviteData.role,
                    restaurantId
                })
            });

            const data = await res.json();

            if (res.ok) {
                if (data.emailSent) {
                    toast.success(`Invitation sent to ${inviteData.email}`);
                } else {
                    // Email not configured - show link to copy
                    toast.info('Email service not configured. Copy the invite link below.');
                    setCopiedUrl(data.invitation.inviteUrl);
                }
                setIsInviting(false);
                setInviteData({ name: '', email: '', role: 'waiter' });
                fetchTeam();
            } else {
                toast.error(data.error || 'Failed to send invitation');
            }
        } catch (err) {
            toast.error('Something went wrong');
        }

        setIsSending(false);
    };

    const removeStaff = async (roleId: string) => {
        try {
            const res = await fetch(`/api/team/${roleId}`, {
                method: 'DELETE',
            });

            if (res.ok) {
                toast.success('Team member removed');
                fetchTeam();
            }
        } catch (err) {
            toast.error('Failed to remove member');
        }
    };

    const getRoleColor = (role: string) => {
        switch (role) {
            case 'owner': return 'bg-purple-100 text-purple-700 border-purple-200';
            case 'manager': return 'bg-blue-100 text-blue-700 border-blue-200';
            case 'waiter': return 'bg-green-100 text-green-700 border-green-200';
            case 'kitchen': return 'bg-orange-100 text-orange-700 border-orange-200';
            default: return 'bg-gray-100 text-gray-700 border-gray-200';
        }
    };

    const getStatusColor = (status: string) => {
        switch (status) {
            case 'accepted': return 'text-green-600';
            case 'pending': return 'text-yellow-600 animate-pulse';
            case 'inactive': return 'text-gray-400';
            default: return 'text-gray-600';
        }
    };

    const copyInviteUrl = (url: string) => {
        navigator.clipboard.writeText(url);
        setCopiedUrl(url);
        toast.success('Invite link copied!');
        setTimeout(() => setCopiedUrl(null), 3000);
    };

    return (
        <div className="space-y-6">
            <div className="flex justify-between items-center">
                <div>
                    <h2 className="text-2xl font-bold text-[#111111]">Team Management</h2>
                    <p className="text-[#111111]/70">Invite and manage your restaurant staff</p>
                </div>
                <div className="flex gap-2">
                    <Button variant="outline" onClick={fetchTeam} disabled={isLoading}>
                        <RefreshCw className={`h-4 w-4 ${isLoading ? 'animate-spin' : ''}`} />
                    </Button>
                    <Button onClick={() => setIsInviting(true)}>
                        <UserPlus className="h-4 w-4 mr-2" /> Invite Member
                    </Button>
                </div>
            </div>

            {isLoading ? (
                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
                    {[1, 2, 3].map(i => (
                        <div key={i} className="h-32 bg-gray-100 rounded-xl animate-pulse" />
                    ))}
                </div>
            ) : staff.length === 0 ? (
                <div className="text-center py-12 bg-gray-50 rounded-xl border-2 border-dashed">
                    <Users className="h-12 w-12 text-gray-300 mx-auto mb-3" />
                    <p className="text-gray-500">No team members yet</p>
                    <Button className="mt-4" onClick={() => setIsInviting(true)}>
                        <UserPlus className="h-4 w-4 mr-2" /> Invite Your First Member
                    </Button>
                </div>
            ) : (
                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
                    {staff.map((member) => (
                        <Card key={member.id} className="border border-[#111111] hover:shadow-md transition-shadow">
                            <CardContent className="p-4">
                                <div className="flex justify-between items-start mb-4">
                                    <div className="flex items-center gap-3">
                                        <div className="w-10 h-10 rounded-full bg-[#111111]/5 flex items-center justify-center border border-[#111111]/10">
                                            <User className="h-5 w-5 text-[#111111]" />
                                        </div>
                                        <div>
                                            <h3 className="font-bold text-[#111111]">
                                                {member.User
                                                    ? `${member.User.firstName} ${member.User.lastName}`
                                                    : member.invitedEmail?.split('@')[0] || 'Pending'
                                                }
                                            </h3>
                                            <p className="text-xs text-[#111111]/50">
                                                {member.User?.email || member.invitedEmail}
                                            </p>
                                        </div>
                                    </div>
                                    <div className={`text-[10px] uppercase font-black px-2 py-0.5 rounded border ${getRoleColor(member.role)}`}>
                                        {member.role}
                                    </div>
                                </div>

                                <div className="flex items-center justify-between pt-4 border-t border-[#111111]/5">
                                    <span className={`text-xs font-bold ${getStatusColor(member.status)}`}>
                                        ● {member.status.toUpperCase()}
                                    </span>
                                    {member.role !== 'owner' && (
                                        <Button
                                            variant="ghost"
                                            size="icon"
                                            className="h-8 w-8 text-red-500 hover:text-red-700 hover:bg-red-50"
                                            onClick={() => removeStaff(member.id)}
                                        >
                                            <Trash2 className="h-4 w-4" />
                                        </Button>
                                    )}
                                </div>
                            </CardContent>
                        </Card>
                    ))}
                </div>
            )}

            {/* Invite Modal */}
            {isInviting && (
                <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/50 backdrop-blur-sm">
                    <Card className="w-full max-w-md">
                        <CardHeader className="flex flex-row justify-between items-center">
                            <CardTitle>Invite Team Member</CardTitle>
                            <Button variant="ghost" size="icon" onClick={() => setIsInviting(false)}>
                                <X className="h-4 w-4" />
                            </Button>
                        </CardHeader>
                        <CardContent className="space-y-4 pt-0">
                            <div>
                                <label className="text-sm font-bold block mb-1">Full Name</label>
                                <Input
                                    placeholder="e.g. John Doe"
                                    value={inviteData.name}
                                    onChange={e => setInviteData({ ...inviteData, name: e.target.value })}
                                />
                            </div>
                            <div>
                                <label className="text-sm font-bold block mb-1">Email Address</label>
                                <Input
                                    type="email"
                                    placeholder="john@example.com"
                                    value={inviteData.email}
                                    onChange={e => setInviteData({ ...inviteData, email: e.target.value })}
                                />
                            </div>
                            <div>
                                <label className="text-sm font-bold block mb-1">Role</label>
                                <select
                                    className="flex h-10 w-full rounded-md border border-input bg-background px-3 py-2 text-sm"
                                    value={inviteData.role}
                                    onChange={e => setInviteData({ ...inviteData, role: e.target.value })}
                                >
                                    <option value="manager">Manager (Full Operations)</option>
                                    <option value="waiter">Waiter (Table Service)</option>
                                    <option value="kitchen">Kitchen (Prep Only)</option>
                                </select>
                                <p className="text-[10px] text-gray-500 mt-2 font-medium bg-gray-50 p-2 border rounded italic">
                                    {inviteData.role === 'manager' && "Full operations access: Inventory, Orders, Reports."}
                                    {inviteData.role === 'waiter' && "Table service: Active orders, add items, mark served."}
                                    {inviteData.role === 'kitchen' && "Kitchen display: Prep items, update status."}
                                </p>
                            </div>

                            {/* Show warning if email not configured */}
                            <div className="bg-yellow-50 border border-yellow-200 rounded-lg p-3 text-sm">
                                <p className="text-yellow-800">
                                    <strong>Note:</strong> Email sending requires SENDGRID_API_KEY in .env.local.
                                    Without it, you'll get an invite link to share manually.
                                </p>
                            </div>

                            <Button
                                className="w-full mt-4"
                                onClick={handleInvite}
                                disabled={isSending}
                            >
                                {isSending ? 'Sending...' : 'Send Invitation'}
                            </Button>
                        </CardContent>
                    </Card>
                </div>
            )}

            {/* Copy URL Modal */}
            {copiedUrl && (
                <div className="fixed bottom-4 left-1/2 -translate-x-1/2 bg-black text-white px-4 py-3 rounded-xl shadow-lg flex items-center gap-3 z-50">
                    <span className="text-sm">Invite link copied!</span>
                    <Button size="sm" variant="secondary" onClick={() => setCopiedUrl(null)}>
                        <Check className="h-4 w-4" />
                    </Button>
                </div>
            )}
        </div>
    );
};
