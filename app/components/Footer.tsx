"use client";

import React, { useState } from "react";

export default function Footer() {
  const [serviceCode, setServiceCode] = useState<string | null>(null);

  const footerLinks = [
    ["FAQ", "Investor Relations", "Privacy", "Speed Test"],
    ["Help Centre", "Jobs", "Cookie Preferences", "Legal Notices"],
    ["Account", "Ways to Watch", "Corporate Information", "Only on StreamFlix"],
    ["Media Centre", "Terms of Use", "Contact Us"],
  ];

  return (
    <footer className="w-full bg-[#141414] text-zinc-500 text-xs px-4 sm:px-6 md:px-12 py-10 md:py-16 mt-10 md:mt-16 border-t border-zinc-900 select-none mb-16 md:mb-0">
      <div className="max-w-5xl mx-auto space-y-5 sm:space-y-6">
        {/* Social Icons with touch targets */}
        <div className="flex items-center gap-5 sm:gap-6 text-zinc-300">
          {/* Facebook */}
          <a href="#" className="p-2 -m-2 hover:text-white transition-colors" aria-label="Facebook">
            <svg className="w-5 h-5 fill-current" viewBox="0 0 24 24">
              <path d="M22 12c0-5.523-4.477-10-10-10S2 6.477 2 12c0 4.991 3.657 9.128 8.438 9.878v-6.987h-2.54V12h2.54V9.797c0-2.506 1.492-3.89 3.777-3.89 1.094 0 2.238.195 2.238.195v2.46h-1.26c-1.243 0-1.63.771-1.63 1.562V12h2.773l-.443 2.89h-2.33v6.988C18.343 21.128 22 16.991 22 12z" />
            </svg>
          </a>
          {/* Instagram */}
          <a href="#" className="p-2 -m-2 hover:text-white transition-colors" aria-label="Instagram">
            <svg className="w-5 h-5 fill-current" viewBox="0 0 24 24">
              <path d="M12 2.163c3.204 0 3.584.012 4.85.07 3.252.148 4.771 1.691 4.919 4.919.058 1.265.069 1.645.069 4.849 0 3.205-.012 3.584-.069 4.849-.149 3.225-1.664 4.771-4.919 4.919-1.266.058-1.644.07-4.85.07-3.204 0-3.584-.012-4.849-.07-3.26-.149-4.771-1.699-4.919-4.92-.058-1.265-.07-1.644-.07-4.849 0-3.204.013-3.583.07-4.849.149-3.227 1.664-4.771 4.919-4.919 1.266-.057 1.645-.069 4.849-.069zm0-2.163c-3.259 0-3.667.014-4.947.072-4.358.2-6.78 2.618-6.98 6.98-.059 1.281-.073 1.689-.073 4.948 0 3.259.014 3.668.072 4.948.2 4.358 2.618 6.78 6.98 6.98 1.281.058 1.689.072 4.948.072 3.259 0 3.668-.014 4.948-.072 4.354-.2 6.782-2.618 6.979-6.98.059-1.28.073-1.689.073-4.948 0-3.259-.014-3.667-.072-4.947-.196-4.354-2.617-6.78-6.979-6.98-1.281-.059-1.69-.073-4.949-.073zm0 5.838c-3.403 0-6.162 2.759-6.162 6.162s2.759 6.163 6.162 6.163 6.162-2.759 6.162-6.163c0-3.403-2.759-6.162-6.162-6.162zm0 10.162c-2.209 0-4-1.79-4-4 0-2.209 1.791-4 4-4s4 1.791 4 4c0 2.21-1.791 4-4 4zm6.406-11.845c-.796 0-1.441.645-1.441 1.44s.645 1.44 1.441 1.44c.795 0 1.439-.645 1.439-1.44s-.644-1.44-1.439-1.44z" />
            </svg>
          </a>
          {/* Twitter / X */}
          <a href="#" className="p-2 -m-2 hover:text-white transition-colors" aria-label="Twitter">
            <svg className="w-5 h-5 fill-current" viewBox="0 0 24 24">
              <path d="M18.244 2.25h3.308l-7.227 8.26 8.502 11.24H16.17l-5.214-6.817L4.99 21.75H1.68l7.73-8.835L1.254 2.25H8.08l4.713 6.231zm-1.161 17.52h1.833L7.084 4.126H5.117z" />
            </svg>
          </a>
          {/* YouTube */}
          <a href="#" className="p-2 -m-2 hover:text-white transition-colors" aria-label="YouTube">
            <svg className="w-5 h-5 fill-current" viewBox="0 0 24 24">
              <path d="M23.498 6.186a3.016 3.016 0 0 0-2.122-2.136C19.505 3.545 12 3.545 12 3.545s-7.505 0-9.377.505A3.017 3.017 0 0 0 .502 6.186C0 8.07 0 12 0 12s0 3.93.502 5.814a3.016 3.016 0 0 0 2.122 2.136c1.871.505 9.376.505 9.376.505s7.505 0 9.377-.505a3.015 3.015 0 0 0 2.122-2.136C24 15.93 24 12 24 12s0-3.93-.502-5.814zM9.545 15.568V8.432L15.818 12l-6.273 3.568z" />
            </svg>
          </a>
        </div>

        {/* Links Grid */}
        <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 gap-3 sm:gap-4 text-[11px] sm:text-xs">
          {footerLinks.map((column, colIdx) => (
            <ul key={colIdx} className="space-y-2">
              {column.map((link) => (
                <li key={link}>
                  <a href="#" className="hover:underline hover:text-zinc-400 transition-colors py-0.5 block">
                    {link}
                  </a>
                </li>
              ))}
            </ul>
          ))}
        </div>

        {/* Service Code Button */}
        <div className="pt-1">
          <button
            onClick={() => setServiceCode("684-219")}
            className="border border-zinc-700 hover:border-zinc-500 text-zinc-400 hover:text-white px-3 py-1.5 transition-colors text-[11px] sm:text-xs font-mono rounded"
          >
            {serviceCode ? `Service Code: ${serviceCode}` : "Service Code"}
          </button>
        </div>

        {/* Copyright */}
        <div className="text-[10px] sm:text-[11px] text-zinc-600">
          © 2026 StreamFlix, Inc. Powered by Next.js & ImageKit
        </div>
      </div>
    </footer>
  );
}
