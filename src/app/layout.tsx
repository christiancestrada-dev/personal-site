import type { Metadata } from "next";
import { Geist_Mono, Inter, Lora } from "next/font/google";
import { SidebarLayout } from "@/components/ui/sidebar-nav";
import "./globals.css";

const geistMono = Geist_Mono({
  variable: "--font-geist-mono",
  subsets: ["latin"],
});

const inter = Inter({
  variable: "--font-inter",
  subsets: ["latin"],
  weight: ["400", "500", "600", "700"],
});

const lora = Lora({
  variable: "--font-lora",
  subsets: ["latin"],
  weight: ["400", "700"],
});

export const metadata: Metadata = {
  title: "christian estrada",
  description: "student researcher — sleep, memory, neuroscience",
  metadataBase: new URL("https://christian-estrada.com"),
  icons: {
    icon: "/favicon.png",
    apple: "/apple-touch-icon.png",
  },
  openGraph: {
    title: "christian estrada",
    description: "student researcher — sleep, memory, neuroscience",
    url: "https://christian-estrada.com",
    siteName: "christian estrada",
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
      <body
        className={`${geistMono.variable} ${inter.variable} ${lora.variable} antialiased font-serif`}
        style={{ backgroundColor: "var(--site-bg)", margin: 0 }}
      >
        <SidebarLayout>{children}</SidebarLayout>
      </body>
    </html>
  );
}
