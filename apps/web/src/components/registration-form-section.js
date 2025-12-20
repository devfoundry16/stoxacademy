"use client"
import { countries } from "@/lib/countries"

export function RegistrationFormSection() {
  return (
    <section className="py-16 px-4 sm:px-6 lg:px-8 bg-white">
      <div className="max-w-4xl mx-auto">
        <h2 className="text-3xl sm:text-4xl font-bold text-center mb-12 text-gray-900">
          Seize the Opportunity Now and Join Us - Register Your Details
        </h2>
        <form className="grid sm:grid-cols-2 gap-6">
          <input
            type="text"
            placeholder="Full Name"
            className="px-6 py-4 border-2 border-gray-200 rounded-xl focus:border-blue-600 focus:outline-none transition-colors"
          />
          <input
            type="email"
            placeholder="Email"
            className="px-6 py-4 border-2 border-gray-200 rounded-xl focus:border-blue-600 focus:outline-none transition-colors"
          />
          <input
            type="tel"
            placeholder="Phone Number"
            className="px-6 py-4 border-2 border-gray-200 rounded-xl focus:border-blue-600 focus:outline-none transition-colors"
          />
          <input
            type="text"
            placeholder="Age"
            className="px-6 py-4 border-2 border-gray-200 rounded-xl focus:border-blue-600 focus:outline-none transition-colors"
          />
          <select className="px-6 py-4 border-2 border-gray-200 rounded-xl focus:border-blue-600 focus:outline-none transition-colors sm:col-span-2">
            <option value="">Select Country</option>
            {countries.map((country) => (
              <option key={country} value={country}>
                {country}
              </option>
            ))}
          </select>
          <button
            type="submit"
            className="sm:col-span-2 px-8 py-4 bg-blue-600 text-white text-lg font-semibold rounded-xl hover:bg-blue-700 transition-colors"
          >
            Submit
          </button>
        </form>
      </div>
    </section>
  )
}
