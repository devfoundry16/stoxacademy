"use client"
import { useState } from "react"
import { countries } from "@/lib/countries"
import { checklistService } from "@/lib/checklistService"
import { Loader2 } from "lucide-react"

export function RegistrationFormSection({ checklistAnswers = [] }) {
  const [formData, setFormData] = useState({
    fullName: "",
    email: "",
    phoneNumber: "",
    age: "",
    country: "",
  })
  const [status, setStatus] = useState("idle") // idle, loading, success, error
  const [errorMessage, setErrorMessage] = useState("")

  const handleChange = (e) => {
    const { name, value } = e.target
    setFormData((prev) => ({ ...prev, [name]: value }))
  }

  const handleSubmit = async (e) => {
    e.preventDefault()
    setStatus("loading")
    setErrorMessage("")

    try {
      await checklistService.submitChecklistResponse(checklistAnswers, {
        full_name: formData.fullName,
        email: formData.email,
        phone_number: formData.phoneNumber,
        age: formData.age,
        country: formData.country,
      })
      setStatus("success")
    } catch (error) {
      console.error("Submission error:", error)
      setStatus("error")

      // Check if it's a duplicate email error
      if (error.response?.status === 409) {
        setErrorMessage("This email has already been submitted. Each user can only submit once.")
      } else {
        setErrorMessage("Something went wrong. Please try again.")
      }
    }
  }

  if (status === "success") {
    return (
      <section className="py-16 px-4 sm:px-6 lg:px-8 bg-white rounded-2xl shadow-xl">
        <div className="max-w-4xl mx-auto text-center">
          <div className="w-20 h-20 bg-green-100 rounded-full flex items-center justify-center mx-auto mb-6">
            <svg
              className="w-10 h-10 text-green-600"
              fill="none"
              stroke="currentColor"
              viewBox="0 0 24 24"
            >
              <path
                strokeLinecap="round"
                strokeLinejoin="round"
                strokeWidth={2}
                d="M5 13l4 4L19 7"
              />
            </svg>
          </div>
          <h2 className="text-3xl font-bold text-gray-900 mb-4">
            Thank You!
          </h2>
          <p className="text-xl text-gray-600">
            Your application has been received successfully. We will be in touch shortly.
          </p>
        </div>
      </section>
    )
  }

  return (
    <section className="py-16 px-4 sm:px-6 lg:px-8 bg-white rounded-2xl shadow-xl">
      <div className="max-w-4xl mx-auto">
        <h2 className="text-3xl sm:text-4xl font-bold text-center mb-12 text-gray-900">
          Seize the Opportunity Now and Join Us - Register Your Details
        </h2>
        <form onSubmit={handleSubmit} className="grid sm:grid-cols-2 gap-6">
          <input
            name="fullName"
            value={formData.fullName}
            onChange={handleChange}
            required
            type="text"
            placeholder="Full Name"
            className="px-6 py-4 border-2 border-gray-200 rounded-xl focus:border-blue-600 focus:outline-none transition-colors"
          />
          <input
            name="email"
            value={formData.email}
            onChange={handleChange}
            required
            type="email"
            placeholder="Email"
            className="px-6 py-4 border-2 border-gray-200 rounded-xl focus:border-blue-600 focus:outline-none transition-colors"
          />
          <input
            name="phoneNumber"
            value={formData.phoneNumber}
            onChange={handleChange}
            required
            type="tel"
            placeholder="Phone Number"
            className="px-6 py-4 border-2 border-gray-200 rounded-xl focus:border-blue-600 focus:outline-none transition-colors"
          />
          <input
            name="age"
            value={formData.age}
            onChange={handleChange}
            required
            type="text"
            placeholder="Age"
            className="px-6 py-4 border-2 border-gray-200 rounded-xl focus:border-blue-600 focus:outline-none transition-colors"
          />
          <select
            name="country"
            value={formData.country}
            onChange={handleChange}
            required
            className="px-6 py-4 border-2 border-gray-200 rounded-xl focus:border-blue-600 focus:outline-none transition-colors sm:col-span-2"
          >
            <option value="">Select Country</option>
            {countries.map((country) => (
              <option key={country} value={country}>
                {country}
              </option>
            ))}
          </select>

          {errorMessage && (
            <div className="sm:col-span-2 text-red-600 text-center text-sm">
              {errorMessage}
            </div>
          )}

          <button
            type="submit"
            disabled={status === "loading"}
            className="sm:col-span-2 px-8 py-4 bg-blue-600 text-white text-lg font-semibold rounded-xl hover:bg-blue-700 transition-colors disabled:opacity-70 disabled:cursor-not-allowed flex justify-center items-center gap-2"
          >
            {status === "loading" && <Loader2 className="w-5 h-5 animate-spin" />}
            {status === "loading" ? "Submitting..." : "Submit"}
          </button>
        </form>
      </div>
    </section>
  )
}
