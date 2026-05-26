import type { Metadata } from "next";
import { Geist, Geist_Mono, Lora } from "next/font/google";
import { SidebarLayout } from "@/components/ui/sidebar-nav";
import "./globals.css";

const geist = Geist({
  variable: "--font-geist-sans",
  subsets: ["latin"],
});

const geistMono = Geist_Mono({
  variable: "--font-geist-mono",
  subsets: ["latin"],
});

const lora = Lora({
  variable: "--font-lora",
  subsets: ["latin"],
  weight: ["400", "700"],
});

export const metadata: Metadata = {
  title: "christian's website",
  description: "putting the personal in personal website",
  metadataBase: new URL("https://christian-estrada.com"),
  icons: {
    icon: "/favicon.png",
    apple: "/apple-touch-icon.png",
  },
  openGraph: {
    title: "christian's website",
    description: "putting the personal in personal website",
    url: "https://christian-estrada.com",
    siteName: "christian's website",
    type: "website",
  },
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="en">
      {/* Runs before any paint — sets data-theme so there's no flash of wrong theme */}
      <head>
        <script dangerouslySetInnerHTML={{ __html: `(function(){try{var t=localStorage.getItem('theme')||'dark';var r=t==='light'?'light':t==='auto'?(window.matchMedia('(prefers-color-scheme:light)').matches?'light':'dark'):'dark';document.documentElement.setAttribute('data-theme',r);}catch(e){}})();` }} />
      </head>
      <body
        className={`${geist.variable} ${geistMono.variable} ${lora.variable} antialiased`}
        style={{ backgroundColor: "var(--site-bg)", margin: 0 }}
      >
        <SidebarLayout>{children}</SidebarLayout>
      </body>
    </html>
  );
}
