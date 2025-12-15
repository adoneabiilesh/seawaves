'use client';

import React, { useState, useEffect } from 'react';
import { Bell, X, CheckCircle2, ShoppingCart, CreditCard, Star, User, Clock } from 'lucide-react';
import { Card, CardContent, CardHeader, CardTitle } from './ui/card';
import { Button } from './ui/button';
import { cn } from '@/lib/utils';

export interface Notification {
  id: string;
  type: 'order' | 'payment' | 'review' | 'rating' | 'table' | 'customer';
  title: string;
  message: string;
  timestamp: Date;
  read: boolean;
  orderId?: string;
  tableNumber?: number;
  metadata?: any;
}

interface NotificationCenterProps {
  notifications: Notification[];
  onMarkAsRead: (id: string) => void;
  onMarkAllAsRead: () => void;
  onClear: () => void;
}

export const NotificationCenter: React.FC<NotificationCenterProps> = ({
  notifications,
  onMarkAsRead,
  onMarkAllAsRead,
  onClear,
}) => {
  const [isOpen, setIsOpen] = useState(false);
  const unreadCount = notifications.filter(n => !n.read).length;

  const getIcon = (type: Notification['type']) => {
    switch (type) {
      case 'order':
        return <ShoppingCart className="h-4 w-4" />;
      case 'payment':
        return <CreditCard className="h-4 w-4" />;
      case 'review':
      case 'rating':
        return <Star className="h-4 w-4" />;
      case 'table':
        return <User className="h-4 w-4" />;
      default:
        return <Bell className="h-4 w-4" />;
    }
  };

  const formatTime = (date: Date) => {
    const now = new Date();
    const diff = now.getTime() - date.getTime();
    const minutes = Math.floor(diff / 60000);
    const hours = Math.floor(minutes / 60);
    const days = Math.floor(hours / 24);

    if (minutes < 1) return 'Just now';
    if (minutes < 60) return `${minutes}m ago`;
    if (hours < 24) return `${hours}h ago`;
    return `${days}d ago`;
  };

  return (
    <div className="relative">
      <Button
        variant="outline"
        size="icon"
        onClick={() => setIsOpen(!isOpen)}
        className="relative"
      >
        <Bell className="h-5 w-5" />
        {unreadCount > 0 && (
          <span className="absolute -top-1 -right-1 h-5 w-5 rounded-full bg-[#111111] text-[#FFFFFE] text-xs flex items-center justify-center">
            {unreadCount > 9 ? '9+' : unreadCount}
          </span>
        )}
      </Button>

      {isOpen && (
        <>
          <div
            className="fixed inset-0 z-40"
            onClick={() => setIsOpen(false)}
          />
          <Card className="absolute right-0 top-12 z-50 w-96 max-h-[600px] overflow-hidden flex flex-col border border-[#111111] shadow-lg">
            <CardHeader className="flex flex-row items-center justify-between border-b border-[#111111] pb-3">
              <CardTitle className="text-lg font-bold">Notifications</CardTitle>
              <div className="flex gap-2">
                {unreadCount > 0 && (
                  <Button
                    variant="ghost"
                    size="sm"
                    onClick={onMarkAllAsRead}
                    className="text-xs"
                  >
                    Mark all read
                  </Button>
                )}
                <Button
                  variant="ghost"
                  size="icon"
                  onClick={() => setIsOpen(false)}
                >
                  <X className="h-4 w-4" />
                </Button>
              </div>
            </CardHeader>
            <CardContent className="p-0 overflow-y-auto flex-1">
              {notifications.length === 0 ? (
                <div className="p-8 text-center text-[#111111]/50">
                  <Bell className="h-12 w-12 mx-auto mb-2 opacity-30" />
                  <p>No notifications</p>
                </div>
              ) : (
                <div className="divide-y divide-[#111111]/10">
                  {notifications.map((notification) => (
                    <div
                      key={notification.id}
                      className={cn(
                        "p-4 hover:bg-[#111111]/5 transition-colors cursor-pointer",
                        !notification.read && "bg-[#111111]/5"
                      )}
                      onClick={() => {
                        if (!notification.read) {
                          onMarkAsRead(notification.id);
                        }
                      }}
                    >
                      <div className="flex gap-3">
                        <div className={cn(
                          "flex-shrink-0 w-8 h-8 rounded-full flex items-center justify-center",
                          notification.read ? "bg-[#111111]/10" : "bg-[#111111] text-[#FFFFFE]"
                        )}>
                          {getIcon(notification.type)}
                        </div>
                        <div className="flex-1 min-w-0">
                          <div className="flex items-start justify-between gap-2">
                            <div className="flex-1">
                              <p className={cn(
                                "font-semibold text-sm",
                                !notification.read && "font-bold"
                              )}>
                                {notification.title}
                              </p>
                              <p className="text-xs text-[#111111]/70 mt-1">
                                {notification.message}
                              </p>
                              {notification.tableNumber && (
                                <span className="inline-block mt-1 text-xs bg-[#111111]/10 text-[#111111] px-2 py-0.5 rounded">
                                  Table {notification.tableNumber}
                                </span>
                              )}
                            </div>
                            {!notification.read && (
                              <div className="w-2 h-2 rounded-full bg-[#111111] flex-shrink-0 mt-1" />
                            )}
                          </div>
                          <div className="flex items-center gap-1 mt-2 text-xs text-[#111111]/50">
                            <Clock className="h-3 w-3" />
                            {formatTime(notification.timestamp)}
                          </div>
                        </div>
                      </div>
                    </div>
                  ))}
                </div>
              )}
            </CardContent>
            {notifications.length > 0 && (
              <div className="border-t border-[#111111] p-3">
                <Button
                  variant="outline"
                  size="sm"
                  onClick={onClear}
                  className="w-full"
                >
                  Clear all
                </Button>
              </div>
            )}
          </Card>
        </>
      )}
    </div>
  );
};





