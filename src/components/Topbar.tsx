"use client";

import Link from "next/link";
import { useState } from "react";

interface TopbarProps {
  title: string;
  role: "seller" | "retailer" | "admin";
  userName?: string;
}

export default function Topbar({ title, role, userName = "Demo User" }: TopbarProps) {
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false);

  const sellerLinks = [
    { label: "Dashboard", href: "/seller/dashboard" },
    { label: "Products", href: "/seller/products" },
    { label: "Add Product", href: "/seller/add-product" },
    { label: "Orders", href: "/seller/orders" },
  ];

  const retailerLinks = [
    { label: "Dashboard", href: "/retailer/dashboard" },
    { label: "Browse Products", href: "/retailer/products" },
    { label: "My Orders", href: "/retailer/orders" },
  ];

  const adminLinks = [
    { label: "Disputes", href: "/admin/disputes" },
  ];

  const links = role === "seller" ? sellerLinks : role === "admin" ? adminLinks : retailerLinks;
  const accentColor = role === "seller" ? "indigo" : role === "admin" ? "violet" : "emerald";
  const roleLabel = role === "seller" ? "Wholesaler" : role === "admin" ? "Admin" : "Retailer";

  return (
    <header className="bg-white border-b border-slate-200 px-4 sm:px-6 h-16 flex items-center justify-between sticky top-0 z-30">
      <h1 className="text-lg font-semibold text-slate-800">{title}</h1>

      <div className="flex items-center gap-3">
        {/* User badge */}
        <div className="hidden sm:flex items-center gap-2">
          <div className={`w-8 h-8 rounded-full bg-${accentColor}-100 flex items-center justify-center`}>
            <span className={`text-xs font-bold text-${accentColor}-600`}>
              {userName.charAt(0).toUpperCase()}
            </span>
          </div>
          <div className="hidden md:block">
            <p className="text-sm font-medium text-slate-700">{userName}</p>
            <p className={`text-xs text-${accentColor}-500 font-medium capitalize`}>{roleLabel}</p>
          </div>
        </div>

        {/* Mobile menu toggle */}
        <button
          id="mobile-menu-toggle"
          className="md:hidden p-2 rounded-lg text-slate-500 hover:bg-slate-100"
          onClick={() => setMobileMenuOpen(!mobileMenuOpen)}
          aria-label="Toggle menu"
        >
          <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
            {mobileMenuOpen ? (
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
            ) : (
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 6h16M4 12h16M4 18h16" />
            )}
          </svg>
        </button>
      </div>

      {/* Mobile nav drawer */}
      {mobileMenuOpen && (
        <div className="absolute top-16 left-0 right-0 bg-white border-b border-slate-200 shadow-lg z-40 md:hidden">
          <nav className="px-4 py-3 space-y-1">
            {links.map((link) => (
              <Link
                key={link.href}
                href={link.href}
                onClick={() => setMobileMenuOpen(false)}
                className="block px-3 py-2.5 rounded-lg text-sm font-medium text-slate-600 hover:bg-slate-50"
              >
                {link.label}
              </Link>
            ))}
            <Link
              href="/login"
              onClick={() => setMobileMenuOpen(false)}
              className="block px-3 py-2.5 rounded-lg text-sm font-medium text-red-500 hover:bg-red-50"
            >
              Sign Out
            </Link>
          </nav>
        </div>
      )}
    </header>
  );
}
