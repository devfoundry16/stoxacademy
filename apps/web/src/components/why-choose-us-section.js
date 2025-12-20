const reasons = [
    {
      title: "Professional Team",
      desc: "Expert instructors who live the market daily and transfer knowledge from reality",
    },
    {
      title: "Highest Professionalism",
      desc: "Complete training content combining modern digital materials and fully equipped classroom lessons",
    },
    {
      title: "Practical Experience",
      desc: "Start practical application from day one and experience real market situations",
    },
    {
      title: "Real Value",
      desc: "We provide comprehensive professional content that prepares you to trade independently and confidently",
    },
  ]
  
  export function WhyChooseUsSection() {
    return (
      <section className="py-16 px-4 sm:px-6 lg:px-8 bg-gray-50">
        <div className="max-w-7xl mx-auto">
          <h2 className="text-3xl sm:text-4xl font-bold text-center mb-12 text-gray-900">
            We Learn the Right Way with Full Support Until You Succeed!
          </h2>
          <div className="grid sm:grid-cols-2 lg:grid-cols-4 gap-8">
            {reasons.map((item, idx) => (
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
    )
  }
  