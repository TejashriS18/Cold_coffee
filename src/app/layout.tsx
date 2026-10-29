import type { Metadata } from "next";
import { Playfair_Display, Plus_Jakarta_Sans } from "next/font/google";
import "./globals.css";
import { Header } from "@/components/layout/Header";
import { Footer } from "@/components/layout/Footer";
import { CartProvider } from "@/context/CartContext";
import { CartDrawer } from "@/components/cart/CartDrawer";

const playfair = Playfair_Display({
  variable: "--font-playfair",
  subsets: ["latin"],
  display: "swap",
});

const jakarta = Plus_Jakarta_Sans({
  variable: "--font-jakarta",
  subsets: ["latin"],
  display: "swap",
});

export const metadata: Metadata = {
  title: "FROST & BEAN | Premium Modern Cold Coffee",
  description:
    "Artisanal cold extraction, single-origin micro-steeping, and velvety nitro cold coffee crafted for refined palates.",
  keywords: [
    "cold brew",
    "specialty coffee",
    "frost and bean",
    "single origin coffee",
    "modern coffee shop",
  ],
};

export default function RootLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <html
      lang="en"
      className={`${playfair.variable} ${jakarta.variable} h-full antialiased`}
    >
      <body className="min-h-full flex flex-col bg-[#F6F0E7] text-[#3B241A] selection:bg-[#C58A4A]/20 selection:text-[#3B241A] font-sans">
        <CartProvider>
          <div id="top" />
          <Header />
          <main className="flex-1">{children}</main>
          <Footer />
          <CartDrawer />
        </CartProvider>
      </body>
    </html>
  );
}
