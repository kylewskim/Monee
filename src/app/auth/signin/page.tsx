"use client";

import { signIn } from "next-auth/react";

// Category chip colors (mirrors types.ts)
const CHIPS: Record<string, { color: string; textColor: string }> = {
  F: { color: "#AAE3CC", textColor: "#1c5e42" },
  S: { color: "#C5DBFB", textColor: "#1a3d8a" },
  C: { color: "#EFD0DD", textColor: "#7a2d4c" },
  P: { color: "#FFE4CA", textColor: "#7c3a08" },
  O: { color: "#EFEFEF", textColor: "#404040" },
};

// [letter, top, left, sizePx, duration, delay, opacity]
const FLOATING: [string, string, string, number, string, string, number][] = [
  ["F", "7%",  "9%",  52, "7s",   "0s",    0.55],
  ["S", "12%", "78%", 40, "8.5s", "-2s",   0.6 ],
  ["P", "68%", "6%",  44, "6.5s", "-1s",   0.5 ],
  ["O", "58%", "84%", 34, "9s",   "-3.5s", 0.55],
  ["C", "82%", "52%", 48, "7.5s", "-0.5s", 0.5 ],
  ["F", "32%", "90%", 30, "10s",  "-4s",   0.65],
  ["S", "48%", "3%",  38, "8s",   "-2.5s", 0.55],
  ["C", "76%", "22%", 42, "6s",   "-3s",   0.5 ],
  ["P", "18%", "42%", 26, "9.5s", "-1.5s", 0.45],
  ["O", "4%",  "58%", 36, "7s",   "-0.8s", 0.6 ],
  ["S", "90%", "72%", 28, "8s",   "-1.2s", 0.5 ],
  ["F", "40%", "70%", 22, "11s",  "-5s",   0.4 ],
];

function chipFontSize(size: number): string {
  if (size >= 44) return "18px";
  if (size >= 34) return "14px";
  return "11px";
}

export default function SignInPage() {
  return (
    <main className="min-h-screen bg-gray-50 flex flex-col items-center justify-center px-6 overflow-hidden relative">

      {/* Floating chips */}
      {FLOATING.map(([letter, top, left, size, dur, delay, opacity], i) => {
        const cat = CHIPS[letter];
        return (
          <div
            key={i}
            className="absolute rounded-full flex items-center justify-center font-bold select-none pointer-events-none"
            style={{
              top, left,
              width: size, height: size,
              backgroundColor: cat.color,
              color: cat.textColor,
              fontSize: chipFontSize(size),
              opacity,
              animation: `float ${dur} ease-in-out infinite`,
              animationDelay: delay,
            }}
          >
            {letter}
          </div>
        );
      })}

      {/* Center content */}
      <div className="flex flex-col items-center gap-8 z-10 w-full max-w-xs animate-signin-fade-in">

        {/* Logo + title */}
        <div className="flex flex-col items-center gap-3">
          <div className="w-16 h-16 bg-gray-900 rounded-2xl flex items-center justify-center shadow-sm">
            <span className="text-2xl font-bold text-white tracking-tight">M</span>
          </div>
          <div className="text-center">
            <h1 className="text-3xl font-bold text-gray-900 tracking-tight">Monee</h1>
            <p className="text-gray-400 text-sm mt-1">Your budget, simplified.</p>
          </div>
        </div>

        {/* Sign in button */}
        <button
          onClick={() => signIn("google", { callbackUrl: "/dashboard" })}
          className="flex items-center gap-3 bg-gray-900 text-white font-semibold rounded-full px-8 py-4 text-sm active:scale-95 transition-transform w-full justify-center shadow-sm"
        >
          <GoogleIcon />
          Sign in with Google
        </button>

        <p className="text-gray-400 text-xs text-center leading-relaxed">
          We only access your Google Sheets to read and write budget entries.
        </p>
      </div>
    </main>
  );
}

function GoogleIcon() {
  return (
    <svg width="18" height="18" viewBox="0 0 18 18" fill="none">
      <path d="M17.64 9.2c0-.637-.057-1.251-.164-1.84H9v3.481h4.844a4.14 4.14 0 01-1.796 2.716v2.259h2.908c1.702-1.567 2.684-3.875 2.684-6.615z" fill="#4285F4"/>
      <path d="M9 18c2.43 0 4.467-.806 5.956-2.18l-2.908-2.259c-.806.54-1.837.86-3.048.86-2.344 0-4.328-1.584-5.036-3.711H.957v2.332A8.997 8.997 0 009 18z" fill="#34A853"/>
      <path d="M3.964 10.71A5.41 5.41 0 013.682 9c0-.593.102-1.17.282-1.71V4.958H.957A8.996 8.996 0 000 9c0 1.452.348 2.827.957 4.042l3.007-2.332z" fill="#FBBC05"/>
      <path d="M9 3.58c1.321 0 2.508.454 3.44 1.345l2.582-2.58C13.463.891 11.426 0 9 0A8.997 8.997 0 00.957 4.958L3.964 7.29C4.672 5.163 6.656 3.58 9 3.58z" fill="#EA4335"/>
    </svg>
  );
}
