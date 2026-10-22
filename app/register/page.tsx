"use client";

import React, { useState } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { signIn } from "next-auth/react";

export default function RegisterPage() {
  const router = useRouter();

  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [confirmPassword, setConfirmPassword] = useState("");
  const [showPassword, setShowPassword] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [loading, setLoading] = useState(false);

  const handleSubmit = async (e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault();
    setError(null);

    if (password.length < 6) {
      setError("Password should be at least 6 characters long.");
      return;
    }

    if (password !== confirmPassword) {
      setError("Passwords do not match.");
      return;
    }

    setLoading(true);

    try {
      const response = await fetch("/api/auth/register", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({ email, password }),
      });

      const data = await response.json();

      if (!response.ok) {
        throw new Error(data.error || "Registration failed.");
      }

      // Automatically sign in upon registration
      const loginRes = await signIn("credentials", {
        email,
        password,
        redirect: false,
      });

      if (loginRes?.error) {
        router.push("/login");
      } else {
        router.push("/");
        router.refresh();
      }
    } catch (err: any) {
      console.error("Registration error:", err);
      setError(err.message || "An unexpected error occurred during registration.");
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="relative min-h-screen w-full flex flex-col justify-between bg-black text-white selection:bg-[#E50914] selection:text-white pb-safe">
      {/* Background Poster Collage with Netflix dark vignette */}
      <div
        className="absolute inset-0 bg-cover bg-center filter brightness-[0.4] opacity-50 hidden sm:block"
        style={{
          backgroundImage:
            "url('https://images.unsplash.com/photo-1574375927938-d5a98e8ffe85?w=1600&auto=format&fit=crop&q=80')",
        }}
      />
      <div className="absolute inset-0 bg-black sm:bg-gradient-to-t sm:from-black sm:via-black/50 sm:to-black/80" />

      {/* Top Navbar with StreamFlix Logo */}
      <header className="relative z-20 px-4 sm:px-12 py-4 sm:py-7 flex items-center justify-between">
        <Link href="/" className="group">
          <span className="text-2xl sm:text-4xl font-black tracking-wider text-[#E50914] drop-shadow-[0_2px_10px_rgba(229,9,20,0.6)] group-hover:scale-105 transition-transform duration-200">
            STREAMFLIX
          </span>
        </Link>
        <Link
          href="/login"
          className="bg-[#E50914] hover:bg-[#c11119] text-white font-semibold text-xs sm:text-sm px-3.5 sm:px-4 py-1.5 rounded transition-colors shadow"
        >
          Sign In
        </Link>
      </header>

      {/* Main Register Card */}
      <main className="relative z-20 flex-1 flex items-center justify-center px-4 py-6 sm:py-12">
        <div className="w-full max-w-[450px] bg-black/90 sm:bg-black/75 backdrop-blur-xl rounded-xl sm:rounded-lg p-6 sm:p-14 border border-zinc-800/80 shadow-2xl space-y-5 sm:space-y-6">
          <div className="space-y-1">
            <h1 className="text-2xl sm:text-3xl font-black text-white tracking-tight">Create Account</h1>
            <p className="text-xs text-zinc-400">
              Watch unlimited films, series, and upload videos to your catalog.
            </p>
          </div>

          {/* Error Banner */}
          {error && (
            <div className="p-3 bg-[#e87c03]/20 border border-[#e87c03] rounded-lg text-white text-xs leading-relaxed flex items-start gap-2.5">
              <svg
                className="w-4 h-4 text-[#e87c03] flex-shrink-0 mt-0.5"
                fill="none"
                viewBox="0 0 24 24"
                stroke="currentColor"
              >
                <path
                  strokeLinecap="round"
                  strokeLinejoin="round"
                  strokeWidth={2}
                  d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-3L13.732 4c-.77-1.333-2.694-1.333-3.464 0L3.34 16c-.77 1.333.192 3 1.732 3z"
                />
              </svg>
              <span>{error}</span>
            </div>
          )}

          <form onSubmit={handleSubmit} className="space-y-3.5 sm:space-y-4">
            {/* Email Field */}
            <div className="space-y-1">
              <input
                type="email"
                id="email"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                placeholder="Email address"
                required
                className="w-full bg-[#333333] hover:bg-[#3d3d3d] focus:bg-[#454545] text-white text-base rounded px-4 py-3 sm:py-3.5 outline-none focus:ring-2 focus:ring-zinc-400 placeholder-zinc-400 transition-colors"
              />
            </div>

            {/* Password Field */}
            <div className="space-y-1">
              <div className="relative">
                <input
                  type={showPassword ? "text" : "password"}
                  id="password"
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  placeholder="Create a password (min. 6 chars)"
                  required
                  className="w-full bg-[#333333] hover:bg-[#3d3d3d] focus:bg-[#454545] text-white text-base rounded px-4 py-3 sm:py-3.5 pr-12 outline-none focus:ring-2 focus:ring-zinc-400 placeholder-zinc-400 transition-colors"
                />
                <button
                  type="button"
                  onClick={() => setShowPassword((prev) => !prev)}
                  className="absolute right-3.5 top-3.5 text-zinc-400 hover:text-zinc-200 text-xs font-semibold select-none p-1"
                >
                  {showPassword ? "HIDE" : "SHOW"}
                </button>
              </div>
            </div>

            {/* Confirm Password Field */}
            <div className="space-y-1">
              <input
                type={showPassword ? "text" : "password"}
                id="confirmPassword"
                value={confirmPassword}
                onChange={(e) => setConfirmPassword(e.target.value)}
                placeholder="Confirm your password"
                required
                className="w-full bg-[#333333] hover:bg-[#3d3d3d] focus:bg-[#454545] text-white text-base rounded px-4 py-3 sm:py-3.5 outline-none focus:ring-2 focus:ring-zinc-400 placeholder-zinc-400 transition-colors"
              />
            </div>

            {/* Submit Button */}
            <button
              type="submit"
              disabled={loading}
              className="w-full min-h-[48px] bg-[#E50914] hover:bg-[#c11119] active:scale-[0.99] text-white font-bold py-3 sm:py-3.5 rounded text-sm sm:text-base transition-all duration-200 shadow-lg disabled:opacity-50 flex items-center justify-center gap-2 mt-2"
            >
              {loading ? (
                <>
                  <svg className="animate-spin w-4 h-4 text-white" fill="none" viewBox="0 0 24 24">
                    <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" />
                    <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8v8H4z" />
                  </svg>
                  <span>Creating Account...</span>
                </>
              ) : (
                "Sign Up"
              )}
            </button>
          </form>

          {/* Switch to Login */}
          <div className="pt-2 sm:pt-4 space-y-2.5 text-xs sm:text-sm">
            <p className="text-zinc-400">
              Already have an account?{" "}
              <Link
                href="/login"
                className="text-white font-bold hover:underline ml-1"
              >
                Sign in now.
              </Link>
            </p>

            <p className="text-[10px] sm:text-[11px] text-zinc-500 leading-relaxed">
              This page is protected by Google reCAPTCHA to ensure you&apos;re not a bot.{" "}
              <a href="#" className="text-blue-500 hover:underline">
                Learn more.
              </a>
            </p>
          </div>
        </div>
      </main>

      {/* Netflix Simple Footer */}
      <footer className="relative z-20 w-full bg-black/90 text-zinc-500 text-xs py-6 sm:py-8 px-4 sm:px-12 border-t border-zinc-900/60 select-none">
        <div className="max-w-4xl mx-auto space-y-3 sm:space-y-4">
          <p>
            Questions? Call{" "}
            <a href="tel:000-800-919-1694" className="hover:underline">
              000-800-919-1694
            </a>
          </p>
          <div className="grid grid-cols-2 sm:grid-cols-4 gap-2.5 text-[10px] sm:text-[11px]">
            <a href="#" className="hover:underline">FAQ</a>
            <a href="#" className="hover:underline">Help Centre</a>
            <a href="#" className="hover:underline">Terms of Use</a>
            <a href="#" className="hover:underline">Privacy</a>
            <a href="#" className="hover:underline">Cookie Preferences</a>
            <a href="#" className="hover:underline">Corporate Information</a>
          </div>
        </div>
      </footer>
    </div>
  );
}