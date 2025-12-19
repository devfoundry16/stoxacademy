"use client"

import React from "react"
import { Menu, X } from "lucide-react"

export function Header() {
  const [mobileMenuOpen, setMobileMenuOpen] = React.useState(false)

  return (
    <>
      <header className="fixed top-0 left-0 right-0 bg-white/95 backdrop-blur-sm z-50 border-b border-gray-100">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex items-center justify-between h-16">
            <div className="flex items-center">
              <div className="text-2xl font-bold text-blue-600">Stox</div>
            </div>
            <nav className="hidden md:flex items-center gap-8">
              <a href="#" className="text-gray-700 hover:text-blue-600 transition-colors">
                Courses
              </a>
              <a href="#" className="text-gray-700 hover:text-blue-600 transition-colors">
                About
              </a>
              <a href="#" className="px-6 py-2 bg-blue-600 text-white rounded-full hover:bg-blue-700 transition-colors">
                Register Now
              </a>
            </nav>
            <button className="md:hidden" onClick={() => setMobileMenuOpen(!mobileMenuOpen)}>
              {mobileMenuOpen ? <X className="w-6 h-6" /> : <Menu className="w-6 h-6" />}
            </button>
          </div>
        </div>
      </header>

      {mobileMenuOpen && (
        <div className="fixed inset-0 top-16 bg-white z-40 md:hidden">
          <nav className="flex flex-col p-6 gap-4">
            <a href="#" className="text-gray-700 text-lg">
              Courses
            </a>
            <a href="#" className="text-gray-700 text-lg">
              About
            </a>
            <a href="#" className="px-6 py-3 bg-blue-600 text-white rounded-full text-center">
              Register Now
            </a>
          </nav>
        </div>
      )}
    </>
  )
}
