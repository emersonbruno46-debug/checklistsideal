import type { Metadata } from 'next';
import { Inter } from 'next/font/google';
import './globals.css';

const inter = Inter({ subsets: ['latin'] });

export const metadata: Metadata = {
  title: "Ideal Checklist's - Teste. Valide. Entregue.",
  description: 'Sistema completo para auditoria e teste de sites, landing pages e sistemas web.',
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="pt-BR" className="h-full bg-slate-50">
      <body className={`${inter.className} h-full antialiased text-slate-900 bg-slate-50 selection:bg-indigo-500 selection:text-white`}>
        {children}
      </body>
    </html>
  );
}
