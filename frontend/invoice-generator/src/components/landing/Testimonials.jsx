import React from 'react'
import { Quote } from 'lucide-react'
import { TESTIMONIALS } from '../../utils/data'

const Testimonials = () => {
  return (
    <section id="testimonials" className="py-20 lg:py-28 bg-gray-50">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="text-center mb-16">
          <h2 className="text-3xl sm:text-4xl lg:text-5xl font-bold text-gray-900 mb-4">
            What Our Customers Say
          </h2>
          <p className="text-xl text-gray-600 max-w-2xl mx-auto">
            We are trusted by thousands of small businesses.
          </p>
        </div>
        
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-8">
          {TESTIMONIALS.map((testimonial, index) => (
            <div key={index} className="bg-white rounded-2xl p-8 shadow-md hover:shadow-xl transition-all duration-300 relative">
              {/* Rating Badge */}
              <div className="absolute -top-4 left-8 bg-[#1e3a8a] text-white rounded-full w-12 h-12 flex items-center justify-center font-bold text-lg">
                <Quote className="w-5 h-5"/>
              </div>
              
              <div className="mt-6">
                <p className="text-gray-700 mb-6 leading-relaxed italic text-lg">
                  "{testimonial.quote}"
                </p>
                <div className="flex items-center space-x-4 border-t pt-4">
                  <img 
                    src={testimonial.avatar} 
                    alt={testimonial.author} 
                    className="w-12 h-12 rounded-full object-cover" 
                  />
                  <div className="flex flex-col">
                    <p className="font-semibold text-gray-900">{testimonial.author}</p>
                    <p className="text-gray-600 text-sm">{testimonial.title}</p>
                  </div>
                </div>
              </div>
            </div>
          ))}
        </div>
      </div>
    </section>
  )
}

export default Testimonials
