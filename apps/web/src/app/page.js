'use client';
import React from 'react';
import { Menu, X } from 'lucide-react';

export default function StoxAcademy() {
  const [mobileMenuOpen, setMobileMenuOpen] = React.useState(false);

  return (
    <div className="min-h-screen bg-white font-sans">
      {/* Header */}
      <header className="fixed top-0 left-0 right-0 bg-white/95 backdrop-blur-sm z-50 border-b border-gray-100">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex items-center justify-between h-16">
            <div className="flex items-center">
              <div className="text-2xl font-bold text-blue-600">Stox</div>
            </div>
            <nav className="hidden md:flex items-center gap-8">
              <a href="#" className="text-gray-700 hover:text-blue-600 transition-colors">Courses</a>
              <a href="#" className="text-gray-700 hover:text-blue-600 transition-colors">About</a>
              <a href="#" className="px-6 py-2 bg-blue-600 text-white rounded-full hover:bg-blue-700 transition-colors">Register Now</a>
            </nav>
            <button className="md:hidden" onClick={() => setMobileMenuOpen(!mobileMenuOpen)}>
              {mobileMenuOpen ? <X className="w-6 h-6" /> : <Menu className="w-6 h-6" />}
            </button>
          </div>
        </div>
      </header>

      {/* Mobile Menu */}
      {mobileMenuOpen && (
        <div className="fixed inset-0 top-16 bg-white z-40 md:hidden">
          <nav className="flex flex-col p-6 gap-4">
            <a href="#" className="text-gray-700 text-lg">Courses</a>
            <a href="#" className="text-gray-700 text-lg">About</a>
            <a href="#" className="px-6 py-3 bg-blue-600 text-white rounded-full text-center">Register Now</a>
          </nav>
        </div>
      )}

      {/* Hero Section */}
      <section className="pt-24 pb-16 px-4 sm:px-6 lg:px-8 bg-gradient-to-br from-blue-50 via-white to-purple-50">
        <div className="max-w-7xl mx-auto">
          <div className="grid lg:grid-cols-2 gap-12 items-center">
            <div className="space-y-6">
              <div className="inline-block px-4 py-2 bg-yellow-400 text-sm font-semibold rounded-full">
                Register for the Stock Course and Get the Crypto Course for Free!
              </div>
              <h1 className="text-4xl sm:text-5xl lg:text-6xl font-bold text-gray-900 leading-tight">
                Take Control of Your Financial Future in Just Two Months!
              </h1>
              <p className="text-xl text-gray-600 leading-relaxed">
                Learn how to become an independent trader and investor in the stock market, with all the tools and skills you need to succeed.
              </p>
              <button className="px-8 py-4 bg-blue-600 text-white text-lg font-semibold rounded-full hover:bg-blue-700 transition-all transform hover:scale-105">
                Register Now and Learn to Trade Independently
              </button>
            </div>
            <div className="relative">
              <div className="aspect-square rounded-3xl bg-gradient-to-br from-blue-500 to-purple-600 p-8 shadow-2xl">
                <div className="w-full h-full rounded-2xl bg-white/10 backdrop-blur-sm flex items-center justify-center">
                  <div className="text-center text-white">
                    <div className="text-6xl font-bold mb-2">$50</div>
                    <div className="text-xl">Trading Chart</div>
                  </div>
                </div>
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* Registration Form Section */}
      <section className="py-16 px-4 sm:px-6 lg:px-8 bg-white">
        <div className="max-w-4xl mx-auto">
          <h2 className="text-3xl sm:text-4xl font-bold text-center mb-12 text-gray-900">
            Seize the Opportunity Now and Join Us - Register Your Details
          </h2>
          <form className="grid sm:grid-cols-2 gap-6">
            <input type="text" placeholder="Full Name" className="px-6 py-4 border-2 border-gray-200 rounded-xl focus:border-blue-600 focus:outline-none transition-colors" />
            <input type="email" placeholder="Email" className="px-6 py-4 border-2 border-gray-200 rounded-xl focus:border-blue-600 focus:outline-none transition-colors" />
            <input type="tel" placeholder="Phone Number" className="px-6 py-4 border-2 border-gray-200 rounded-xl focus:border-blue-600 focus:outline-none transition-colors" />
            <input type="text" placeholder="Age" className="px-6 py-4 border-2 border-gray-200 rounded-xl focus:border-blue-600 focus:outline-none transition-colors" />
            <select className="px-6 py-4 border-2 border-gray-200 rounded-xl focus:border-blue-600 focus:outline-none transition-colors sm:col-span-2">
              <option>Country</option>
              <option>United States</option>
              <option>United Kingdom</option>
              <option>Canada</option>
            </select>
            <button type="submit" className="sm:col-span-2 px-8 py-4 bg-blue-600 text-white text-lg font-semibold rounded-xl hover:bg-blue-700 transition-colors">
              Submit
            </button>
          </form>
        </div>
      </section>

      {/* Why Us Section */}
      <section className="py-16 px-4 sm:px-6 lg:px-8 bg-gray-50">
        <div className="max-w-7xl mx-auto">
          <div className="text-center mb-12">
            <h2 className="text-3xl sm:text-4xl font-bold text-gray-900 mb-4">
              At Stox, We Believe Success Starts with Combining Theory and Practice
            </h2>
            <p className="text-xl text-gray-600 max-w-3xl mx-auto">
              That&apos;s why we designed a comprehensive and balanced training program that provides you with the necessary theoretical foundation and gives you real practical experience during the learning period.
            </p>
          </div>
          <div className="grid sm:grid-cols-2 lg:grid-cols-3 gap-8">
            {[
              'Tours in Real Trading Rooms',
              'Practical Training from Day One',
              'Free Monthly Trading Sessions',
              'Meetings with Industry Experts',
              'Market News via Our Platforms',
              'Exclusive Discord Community'
            ].map((feature, idx) => (
              <div key={idx} className="p-6 bg-white rounded-2xl shadow-sm hover:shadow-md transition-shadow">
                <div className="w-12 h-12 bg-blue-100 rounded-full flex items-center justify-center mb-4">
                  <span className="text-blue-600 text-2xl font-bold">✓</span>
                </div>
                <h3 className="text-lg font-semibold text-gray-900">{feature}</h3>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* Courses Section */}
      <section className="py-16 px-4 sm:px-6 lg:px-8 bg-white">
        <div className="max-w-7xl mx-auto">
          <div className="text-center mb-12">
            <h2 className="text-3xl sm:text-4xl font-bold text-gray-900 mb-4">
              🎯 Choose the Right Course and Start Your Journey to Become an Independent Trader
            </h2>
            <p className="text-xl text-gray-600">📌 In our course, you don&apos;t just learn – you trade</p>
          </div>
          <div className="grid lg:grid-cols-3 gap-8">
            {/* Course 1 */}
            <div className="bg-gradient-to-br from-blue-50 to-purple-50 rounded-3xl p-8 shadow-lg hover:shadow-xl transition-shadow">
              <div className="mb-6">
                <span className="inline-block px-4 py-2 bg-yellow-400 text-sm font-semibold rounded-full mb-4">
                  In-Person
                </span>
                <h3 className="text-2xl font-bold text-gray-900 mb-2">
                  Comprehensive Course in Stock and Crypto Investment and Trading
                </h3>
                <p className="text-gray-600">Haifa | 7 Sessions | 19 Hours | 17:00-20:00</p>
              </div>
              <ul className="space-y-3 mb-8">
                {[
                  'Comprehensive understanding of stock and crypto market basics',
                  'Trading strategies based on real experiences',
                  'Company data analysis and chart reading',
                  'Using technical indicators to identify opportunities',
                  'Smart and wise risk management',
                  'Opening a real trading account and practicing real trades'
                ].map((item, idx) => (
                  <li key={idx} className="flex items-start gap-2">
                    <span className="text-green-600 font-bold mt-1">✔</span>
                    <span className="text-gray-700">{item}</span>
                  </li>
                ))}
              </ul>
              <button className="w-full px-6 py-4 bg-blue-600 text-white font-semibold rounded-xl hover:bg-blue-700 transition-colors">
                Register Now
              </button>
            </div>

            {/* Course 2 */}
            <div className="bg-gradient-to-br from-purple-50 to-pink-50 rounded-3xl p-8 shadow-lg hover:shadow-xl transition-shadow">
              <div className="mb-6">
                <span className="inline-block px-4 py-2 bg-purple-400 text-white text-sm font-semibold rounded-full mb-4">
                  Online
                </span>
                <h3 className="text-2xl font-bold text-gray-900 mb-2">
                  Crypto Investment and Trading Course - Online
                </h3>
                <p className="text-gray-600">💻 Fully online - Complete flexibility, tangible results</p>
              </div>
              <ul className="space-y-3 mb-8">
                {[
                  'Comprehensive understanding of crypto market basics',
                  'Proven trading strategies',
                  'Professional data and chart analysis',
                  'Using technical indicators to discover opportunities',
                  'Risk management and financial balance',
                  'Opening a real trading account and live trading experience'
                ].map((item, idx) => (
                  <li key={idx} className="flex items-start gap-2">
                    <span className="text-green-600 font-bold mt-1">✔</span>
                    <span className="text-gray-700">{item}</span>
                  </li>
                ))}
              </ul>
              <button className="w-full px-6 py-4 bg-purple-600 text-white font-semibold rounded-xl hover:bg-purple-700 transition-colors">
                Register Now
              </button>
            </div>

            {/* Course 3 */}
            <div className="bg-gradient-to-br from-green-50 to-blue-50 rounded-3xl p-8 shadow-lg hover:shadow-xl transition-shadow">
              <div className="mb-6">
                <span className="inline-block px-4 py-2 bg-green-400 text-white text-sm font-semibold rounded-full mb-4">
                  Online
                </span>
                <h3 className="text-2xl font-bold text-gray-900 mb-2">
                  Stock Market and Technical Analysis Course - Online
                </h3>
                <p className="text-gray-600">🎁 Get a free mini crypto course upon registration!</p>
              </div>
              <ul className="space-y-3 mb-8">
                {[
                  'Stock market basics',
                  'Successful trading strategies',
                  'Company and chart analysis',
                  'Using technical indicators',
                  'Smart risk management',
                  'Additional lesson on financial skills'
                ].map((item, idx) => (
                  <li key={idx} className="flex items-start gap-2">
                    <span className="text-green-600 font-bold mt-1">✔</span>
                    <span className="text-gray-700">{item}</span>
                  </li>
                ))}
              </ul>
              <button className="w-full px-6 py-4 bg-green-600 text-white font-semibold rounded-xl hover:bg-green-700 transition-colors">
                Register Now
              </button>
            </div>
          </div>
        </div>
      </section>

      {/* Why Choose Us */}
      <section className="py-16 px-4 sm:px-6 lg:px-8 bg-gray-50">
        <div className="max-w-7xl mx-auto">
          <h2 className="text-3xl sm:text-4xl font-bold text-center mb-12 text-gray-900">
            We Learn the Right Way with Full Support Until You Succeed!
          </h2>
          <div className="grid sm:grid-cols-2 lg:grid-cols-4 gap-8">
            {[
              { title: 'Professional Team', desc: 'Expert instructors who live the market daily and transfer knowledge from reality' },
              { title: 'Highest Professionalism', desc: 'Complete training content combining modern digital materials and fully equipped classroom lessons' },
              { title: 'Practical Experience', desc: 'Start practical application from day one and experience real market situations' },
              { title: 'Real Value', desc: 'We provide comprehensive professional content that prepares you to trade independently and confidently' }
            ].map((item, idx) => (
              <div key={idx} className="text-center">
                <div className="w-16 h-16 bg-blue-600 rounded-full flex items-center justify-center mx-auto mb-4">
                  <span className="text-white text-2xl font-bold">{idx + 1}</span>
                </div>
                <h3 className="text-xl font-bold text-gray-900 mb-2">{item.title}</h3>
                <p className="text-gray-600">{item.desc}</p>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* Testimonials */}
      <section className="py-16 px-4 sm:px-6 lg:px-8 bg-white">
        <div className="max-w-7xl mx-auto">
          <h2 className="text-3xl sm:text-4xl font-bold text-center mb-12 text-gray-900">
            Graduate Reviews
          </h2>
          <div className="grid md:grid-cols-2 gap-8 max-w-4xl mx-auto">
            <div className="p-8 bg-blue-50 rounded-2xl">
              <div className="flex gap-1 mb-4">
                {[...Array(5)].map((_, i) => (
                  <span key={i} className="text-yellow-400 text-xl">★</span>
                ))}
              </div>
              <p className="text-gray-700 mb-4 text-lg">&quot;I&apos;ll go home and start buying stocks&quot;</p>
              <p className="text-gray-900 font-semibold">Hana Khoury</p>
            </div>
            <div className="p-8 bg-purple-50 rounded-2xl">
              <div className="flex gap-1 mb-4">
                {[...Array(5)].map((_, i) => (
                  <span key={i} className="text-yellow-400 text-xl">★</span>
                ))}
              </div>
              <p className="text-gray-700 mb-4 text-lg">&quot;I felt the course covered all topics&quot;</p>
              <p className="text-gray-900 font-semibold">Saleh Shaheen</p>
            </div>
          </div>
        </div>
      </section>

      {/* Skills Section */}
      <section className="py-16 px-4 sm:px-6 lg:px-8 bg-gradient-to-br from-blue-600 to-purple-600 text-white">
        <div className="max-w-7xl mx-auto text-center">
          <h2 className="text-3xl sm:text-4xl font-bold mb-6">
            Acquire Smart Financial Skills
          </h2>
          <p className="text-2xl mb-12 font-semibold">Either develop your skills or shrink your dreams</p>
          <div className="grid sm:grid-cols-2 lg:grid-cols-4 gap-6">
            {[
              'Understanding the financial market and its opportunities',
              'Risk management and building a successful investment portfolio',
              'Market analysis in a practical way',
              'Acquiring effective trading strategies and techniques'
            ].map((skill, idx) => (
              <div key={idx} className="p-6 bg-white/10 backdrop-blur-sm rounded-xl">
                <p className="text-lg font-medium">{skill}</p>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* Final CTA */}
      <section className="py-16 px-4 sm:px-6 lg:px-8 bg-gray-50">
        <div className="max-w-4xl mx-auto text-center">
          <h2 className="text-3xl sm:text-4xl font-bold mb-6 text-gray-900">
            Ready to Join More Than 6,500 Students?
          </h2>
          <p className="text-xl text-gray-600 mb-8">
            Register now and learn how to trade independently in just two months! Your opportunity to launch towards financial freedom starts here.
          </p>
          <button className="px-8 py-4 bg-blue-600 text-white text-lg font-semibold rounded-full hover:bg-blue-700 transition-all transform hover:scale-105">
            Register Now
          </button>
        </div>
      </section>

      {/* Footer */}
      <footer className="py-8 px-4 sm:px-6 lg:px-8 bg-gray-900 text-white">
        <div className="max-w-7xl mx-auto">
          <div className="flex flex-col md:flex-row justify-between items-center gap-4">
            <p className="text-gray-400">© {new Date().getFullYear()}. All rights reserved | Terms of use</p>
            <p className="text-gray-400">Designed by Rashional Design</p>
          </div>
        </div>
      </footer>
    </div>
  );
}