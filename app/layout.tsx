import './globals.css';
import { Inter } from 'next/font/google';
import type { Metadata } from 'next';

const inter = Inter({ subsets: ['latin'] });

export const metadata: Metadata = {
  title: 'AI Daily Briefing',
  description: 'Your daily curated insights into the world of Artificial Intelligence.',
};

export default function RootLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <html lang="en">
      <body className={inter.className}>
        <div className="app-container">
          <header className="header">
            <h1 className="logo">AI<span>Daily</span></h1>
            <nav className="nav-links">
              <a href="/">Archive</a>
              <a href="https://github.com/ojeda/ai-newsletter" target="_blank" rel="noopener noreferrer">Source</a>
            </nav>
          </header>
          <main className="main-content">
            {children}
          </main>
          <footer className="footer">
            <p>&copy; {new Date().getFullYear()} AI Daily Briefing. Automatically generated.</p>
          </footer>
        </div>
      </body>
    </html>
  );
}
