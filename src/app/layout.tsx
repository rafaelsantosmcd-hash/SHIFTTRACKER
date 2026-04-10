import type { Metadata, Viewport } from "next";
import { Inter } from "next/font/google";

const inter = Inter({ subsets: ["latin"] });

// Configurações do título e descrição (SEO básico)
export const metadata: Metadata = {
  title: "Manager Rounds",
  description: "Sistema de Rondas NFC para Restaurante",
};

// IMPORTANTE: Isto impede que o telemóvel faça zoom automático 
// quando o gestor clica em botões ou inputs
export const viewport: Viewport = {
  width: "device-width",
  initialScale: 1,
  maximumScale: 1,
  userScalable: false,
};

export default function RootLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <html lang="pt">
      <body className={inter.className} style={{ margin: 0, padding: 0, backgroundColor: '#fafafa' }}>
        {/* Aqui você poderia colocar um Header fixo se quisesse que aparecesse em todas as páginas */}
        <main>
          {children}
        </main>
      </body>
    </html>
  );
}