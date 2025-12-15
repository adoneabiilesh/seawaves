import type { Metadata } from 'next';
import '../index.css';
import { AppProvider } from './providers';
import { ClientLayout } from '../components/ClientLayout';

export const metadata: Metadata = {
  title: 'CulinaryAI | Smart Restaurant OS',
  description: 'AI-powered restaurant management system',
};

export default function RootLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <html lang="en">
      <head>
        <script src="https://cdn.tailwindcss.com"></script>
        <script
          dangerouslySetInnerHTML={{
            __html: `
              tailwind.config = {
                theme: {
                  extend: {
                    fontFamily: {
                      sans: ['Favorit', 'sans-serif'],
                      heading: ['Favorit', 'sans-serif'],
                      subheading: ['Favorit', 'sans-serif'],
                    },
                    colors: {
                      brand: {
                        50: '#fff7ed',
                        100: '#ffedd5',
                        200: '#fed7aa',
                        300: '#fdba74',
                        400: '#fb923c',
                        500: '#f97316',
                        600: '#ea580c',
                        700: '#c2410c',
                        800: '#9a3412',
                        900: '#7c2d12',
                      }
                    }
                  }
                }
              }
            `,
          }}
        />
      </head>
      <body className="font-sans antialiased">
        <AppProvider>
          <ClientLayout>{children}</ClientLayout>
        </AppProvider>
      </body>
    </html>
  );
}


