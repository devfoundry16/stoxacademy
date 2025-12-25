"use client";

import { Header } from "./header";

export function PageLayout({ children, className = "" }) {
  return (
    <div className={`min-h-screen bg-gray-50 ${className}`}>
      <Header />
      <div className="pt-20">{children}</div>
    </div>
  );
}

