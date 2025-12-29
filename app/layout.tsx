'use client';

import React, { useEffect } from 'react';
import { AppProvider } from './providers';
import { ClientLayout } from '../components/ClientLayout';
import { ErrorBoundary } from '../components/ErrorBoundary';
import { Toaster } from 'sonner';
import '../index.css';

export default function RootLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  // Register service worker for PWA
  useEffect(() => {
    if ('serviceWorker' in navigator && process.env.NODE_ENV === 'production') {
      navigator.serviceWorker.register('/sw.js').catch(console.error);
    }
  }, []);

  return (
    <html lang="en">
      <head>
        <title>CulinaryAI - Smart Restaurant Management</title>
        <meta name="description" content="AI-powered restaurant management system with real-time order tracking, menu digitization, and multi-payment support" />
        <meta name="viewport" content="width=device-width, initial-scale=1" />
        {/* PWA Meta Tags */}
        <link rel="manifest" href="/manifest.json" />
        <meta name="theme-color" content="#DC143C" />
        <meta name="apple-mobile-web-app-capable" content="yes" />
        <meta name="apple-mobile-web-app-status-bar-style" content="black-translucent" />
        <meta name="apple-mobile-web-app-title" content="CulinaryAI" />
        <link rel="apple-touch-icon" href="/icon-192.png" />
      </head>
      <body>
        <ErrorBoundary>
          <AppProvider>
            <ClientLayout>
              {children}
            </ClientLayout>
            <Toaster
              position="top-center"
              richColors
              closeButton
              toastOptions={{
                style: {
                  borderRadius: '12px',
                  fontFamily: 'inherit',
                },
              }}
            />
          </AppProvider>
        </ErrorBoundary>
      </body>
    </html>
  );
}
