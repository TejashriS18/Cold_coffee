"use client";

import React, { useState, useEffect } from "react";
import Link from "next/link";
import { ShoppingBag, Menu, X, ArrowUpRight } from "lucide-react";
import { Button } from "@/components/common/Button";
import { Container } from "@/components/common/Container";
import { useCart } from "@/context/CartContext";

export interface NavbarProps {
  className?: string;
}

export interface NavItem {
  label: string;
  href: string;
  badge?: string;
}

const NAV_ITEMS: NavItem[] = [
  { label: "Home", href: "#top" },
  { label: "Our Menu", href: "#menu" },
  { label: "About Us", href: "#about" },
  { label: "Special Offers", href: "#offers", badge: "New" },
  { label: "Reviews", href: "#reviews" },
  { label: "Contact", href: "#contact" },
];

export function Navbar() {
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false);
  const [isScrolled, setIsScrolled] = useState(false);
  const { totalCount, openCart } = useCart();

  // Detect scroll to enhance sticky header styling
  useEffect(() => {
    const handleScroll = () => {
      setIsScrolled(window.scrollY > 20);
    };
    window.addEventListener("scroll", handleScroll, { passive: true });
    return () => window.removeEventListener("scroll", handleScroll);
  }, []);

  // Keyboard accessibility: Close mobile menu on Escape key
  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.key === "Escape" && mobileMenuOpen) {
        setMobileMenuOpen(false);
      }
    };
    window.addEventListener("keydown", handleKeyDown);
    return () => window.removeEventListener("keydown", handleKeyDown);
  }, [mobileMenuOpen]);

  const handleLinkClick = (href: string) => {
    setMobileMenuOpen(false);
    if (href.startsWith("#")) {
      const element = document.getElementById(href.replace("#", ""));
      if (element) {
        element.scrollIntoView({ behavior: "smooth" });
      }
    }
  };

  const handleOrderNowClick = () => {
    setMobileMenuOpen(false);
    const element = document.getElementById("menu");
    if (element) {
      element.scrollIntoView({ behavior: "smooth" });
    }
  };

  return (
    <header
      className={`sticky top-0 z-40 w-full transition-all duration-300 ${
        isScrolled
          ? "bg-[#F6F0E7]/95 shadow-warm-sm backdrop-blur-md border-b border-[#3B241A]/10"
          : "bg-[#F6F0E7]/85 backdrop-blur-xs border-b border-[#3B241A]/5"
      }`}
    >
      <Container size="lg" className="flex items-center justify-between h-20">
        {/* Brand Logo */}
        <Link
          href="/"
          className="group flex items-center gap-3 transition-opacity hover:opacity-90 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[#C58A4A] rounded-lg p-1"
          aria-label="FROST & BEAN Homepage"
        >
          <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-[#3B241A] text-[#F6F0E7] shadow-sm transition-transform group-hover:scale-105 duration-200">
            <span className="font-serif text-lg font-bold">F</span>
          </div>
          <div className="flex flex-col">
            <span className="font-serif text-lg font-bold tracking-wider text-[#3B241A] uppercase">
              Frost <span className="text-[#C58A4A]">&</span> Bean
            </span>
            <span className="text-[10px] uppercase tracking-[0.2em] text-[#6F4935] font-medium">
              Cold Coffee Co.
            </span>
          </div>
        </Link>

        {/* Desktop Navigation Links */}
        <nav
          className="hidden lg:flex items-center gap-8"
          aria-label="Main Navigation"
        >
          {NAV_ITEMS.map((item) => (
            <a
              key={item.label}
              href={item.href}
              onClick={(e) => {
                if (item.href.startsWith("#")) {
                  e.preventDefault();
                  handleLinkClick(item.href);
                }
              }}
              className="relative py-1.5 text-sm font-medium text-[#6F4935] hover:text-[#3B241A] transition-colors focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[#C58A4A] rounded-md px-1 group"
            >
              <span className="flex items-center gap-1.5">
                {item.label}
                {item.badge && (
                  <span className="rounded-full bg-[#C58A4A]/15 px-1.5 py-0.2 text-[9px] font-semibold text-[#8F5A23] border border-[#C58A4A]/30">
                    {item.badge}
                  </span>
                )}
              </span>
              <span className="absolute bottom-0 left-1 right-1 h-0.5 bg-[#C58A4A] scale-x-0 transition-transform duration-200 origin-left group-hover:scale-x-100" />
            </a>
          ))}
        </nav>

        {/* Action Controls */}
        <div className="flex items-center gap-3">
          {/* Shopping Cart Button with Live Badge */}
          <button
            type="button"
            onClick={openCart}
            className="relative flex h-10 w-10 items-center justify-center rounded-full border border-[#3B241A]/15 bg-white text-[#3B241A] hover:border-[#3B241A]/35 hover:bg-[#FBF8F3] transition-colors shadow-xs focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[#C58A4A]"
            aria-label={`View shopping cart with ${totalCount} items`}
          >
            <ShoppingBag className="h-4 w-4" />
            {totalCount > 0 && (
              <span
                key={totalCount}
                className="absolute -top-1 -right-1 flex h-4 w-4 items-center justify-center rounded-full bg-[#C58A4A] text-[10px] font-bold text-white shadow-xs animate-in zoom-in-75 duration-200"
              >
                {totalCount}
              </span>
            )}
          </button>

          {/* Order Now Button */}
          <Button
            variant="primary"
            size="sm"
            className="hidden sm:inline-flex"
            rightIcon={<ArrowUpRight className="h-3.5 w-3.5" />}
            onClick={handleOrderNowClick}
          >
            Order Now
          </Button>

          {/* Mobile Hamburger Toggle Button */}
          <button
            type="button"
            onClick={() => setMobileMenuOpen(!mobileMenuOpen)}
            className="lg:hidden flex h-10 w-10 items-center justify-center rounded-lg border border-[#3B241A]/15 bg-white text-[#3B241A] hover:bg-[#FBF8F3] transition-colors focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[#C58A4A]"
            aria-expanded={mobileMenuOpen}
            aria-label={mobileMenuOpen ? "Close navigation menu" : "Open navigation menu"}
          >
            {mobileMenuOpen ? (
              <X className="h-5 w-5 text-[#3B241A]" />
            ) : (
              <Menu className="h-5 w-5 text-[#3B241A]" />
            )}
          </button>
        </div>
      </Container>

      {/* Mobile Drawer Menu */}
      {mobileMenuOpen && (
        <div
          className="lg:hidden border-t border-[#3B241A]/10 bg-[#F6F0E7] px-6 py-6 space-y-4 animate-in slide-in-from-top-2 duration-200 shadow-xl"
          role="navigation"
          aria-label="Mobile Navigation"
        >
          <div className="flex flex-col space-y-2">
            {NAV_ITEMS.map((item) => (
              <a
                key={item.label}
                href={item.href}
                onClick={(e) => {
                  if (item.href.startsWith("#")) {
                    e.preventDefault();
                    handleLinkClick(item.href);
                  }
                }}
                className="flex items-center justify-between rounded-xl px-4 py-3 text-base font-medium text-[#3B241A] hover:bg-white/80 transition-colors focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[#C58A4A]"
              >
                <span className="flex items-center gap-2">
                  {item.label}
                  {item.badge && (
                    <span className="rounded-full bg-[#C58A4A]/15 px-2 py-0.5 text-xs font-semibold text-[#8F5A23] border border-[#C58A4A]/30">
                      {item.badge}
                    </span>
                  )}
                </span>
                <ArrowUpRight className="h-4 w-4 text-[#6F4935]" />
              </a>
            ))}
          </div>

          <div className="pt-4 border-t border-[#3B241A]/10 flex flex-col gap-3">
            <Button
              variant="primary"
              size="md"
              className="w-full justify-center shadow-xs"
              rightIcon={<ArrowUpRight className="h-4 w-4" />}
              onClick={handleOrderNowClick}
            >
              Order Now
            </Button>
          </div>
        </div>
      )}
    </header>
  );
}
