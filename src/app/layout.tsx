import type { Metadata } from 'next';
import './globals.css';
import { Toaster } from '@/components/ui/toaster';
import { FirebaseClientProvider } from '@/firebase';
import { ThemeProvider } from '@/components/ThemeProvider';
import { Navigation } from '@/components/Navigation';
import { ThemePatternWrapper } from '@/components/ThemePatternWrapper';

export const metadata: Metadata = {
  title: 'TodoFlow - Streamline Your Tasks',
  description: 'A modern, AI-powered todo app with Teddy Bear vibes.',
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="en" suppressHydrationWarning>
      <head>
        <script
          dangerouslySetInnerHTML={{
            __html: `(function(){try{var t=localStorage.getItem('todoflow-theme');if(t==='dark')document.documentElement.classList.add('dark');}catch(e){}})();`,
          }}
        />
        <link rel="preconnect" href="https://fonts.googleapis.com" />
        <link rel="preconnect" href="https://fonts.gstatic.com" crossOrigin="anonymous" />
        <link href="https://fonts.googleapis.com/css2?family=Inter:wght@400;500;600;700;900&display=swap" rel="stylesheet" />
      </head>
      <body className="font-body antialiased" suppressHydrationWarning>
        <ThemeProvider>
          <FirebaseClientProvider>
            <ThemePatternWrapper>
              <Navigation />
              <div className="flex flex-col min-h-screen">
                <main className="flex-1 pt-20 md:ml-20 mb-20 md:mb-0 transition-all duration-300">
                  <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
                    {children}
                  </div>
                </main>
              </div>
              <Toaster />
            </ThemePatternWrapper>
          </FirebaseClientProvider>
        </ThemeProvider>
      </body>
    </html>
  );
}