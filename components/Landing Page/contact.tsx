"use client";

import { motion } from "framer-motion";

export default function ContactSection() {
  return (
    <section id="contact" className="py-24 relative bg-gradient-to-b from-gray-50 to-white">
      <div className="absolute top-0 left-0 right-0 h-1 bg-gradient-to-r from-transparent via-accent to-transparent"></div>

      <div className="container mx-auto px-4">
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          whileInView={{ opacity: 1, y: 0 }}
          viewport={{ once: true }}
          transition={{ duration: 0.8 }}
          className="max-w-4xl mx-auto rounded-3xl p-10 md:p-12 border-2 border-gray-200 bg-white/80 backdrop-blur-xl shadow-2xl"
        >
          <div className="text-center mb-10">
            <motion.span
              initial={{ opacity: 0, scale: 0.8 }}
              whileInView={{ opacity: 1, scale: 1 }}
              viewport={{ once: true }}
              className="inline-block text-accent font-bold mb-3 px-5 py-2 rounded-full bg-accent/10 border-2 border-accent/30 uppercase tracking-wider text-sm"
            >
              Contact Us
            </motion.span>
            <h2 className="text-4xl sm:text-5xl md:text-6xl lg:text-7xl text-gray-900 font-black mb-6 text-center">
              Get in <span className="bg-gradient-to-r from-accent to-accent-light bg-clip-text text-transparent">Touch</span>
            </h2>
            <p className="text-gray-600 text-lg font-medium max-w-2xl mx-auto">
              Interested in implementing Fleet for your dealership? Have
              questions about our platform? We're here to help.
            </p>
          </div>

          <form className="space-y-6">
            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              <div>
                <label
                  htmlFor="name"
                  className="block text-sm font-bold text-gray-700 mb-2"
                >
                  Name
                </label>
                <input
                  type="text"
                  id="name"
                  className="w-full bg-white border-2 border-gray-200 rounded-xl px-5 py-4 text-gray-900 focus:outline-none focus:ring-2 focus:ring-accent focus:border-accent transition-all duration-300 font-medium"
                  placeholder="Your name"
                />
              </div>
              <div>
                <label
                  htmlFor="email"
                  className="block text-sm font-bold text-gray-700 mb-2"
                >
                  Email
                </label>
                <input
                  type="email"
                  id="email"
                  className="w-full bg-white border-2 border-gray-200 rounded-xl px-5 py-4 text-gray-900 focus:outline-none focus:ring-2 focus:ring-accent focus:border-accent transition-all duration-300 font-medium"
                  placeholder="your.email@example.com"
                />
              </div>
            </div>

            <div>
              <label
                htmlFor="subject"
                className="block text-sm font-bold text-gray-700 mb-2"
              >
                Subject
              </label>
              <input
                type="text"
                id="subject"
                className="w-full bg-white border-2 border-gray-200 rounded-xl px-5 py-4 text-gray-900 focus:outline-none focus:ring-2 focus:ring-accent focus:border-accent transition-all duration-300 font-medium"
                placeholder="How can we help you?"
              />
            </div>

            <div>
              <label
                htmlFor="message"
                className="block text-sm font-bold text-gray-700 mb-2"
              >
                Message
              </label>
              <textarea
                id="message"
                rows={5}
                className="w-full bg-white border-2 border-gray-200 rounded-xl px-5 py-4 text-gray-900 focus:outline-none focus:ring-2 focus:ring-accent focus:border-accent transition-all duration-300 font-medium resize-none"
                placeholder="Your message..."
              ></textarea>
            </div>

            <div className="text-center">
              <motion.button
                whileHover={{ scale: 1.05 }}
                whileTap={{ scale: 0.95 }}
                type="button"
                className="bg-gradient-to-r from-accent to-accent-light hover:from-accent-dark hover:to-accent text-white px-10 py-5 rounded-2xl font-bold transition-all duration-300 shadow-lg hover:shadow-xl hover:shadow-accent/50 uppercase tracking-wide"
              >
                Send Message
              </motion.button>
            </div>
          </form>

          <div className="mt-16 text-gray-900 grid grid-cols-1 md:grid-cols-3 gap-8 text-center">
            <div>
              <div className="w-16 h-16 rounded-2xl bg-gradient-to-br from-accent/20 to-accent-light/20 border-2 border-accent/30 flex items-center justify-center mx-auto mb-5 shadow-lg">
                <svg
                  className="w-6 h-6 text-accent"
                  fill="none"
                  stroke="currentColor"
                  viewBox="0 0 24 24"
                  xmlns="http://www.w3.org/2000/svg"
                >
                  <path
                    strokeLinecap="round"
                    strokeLinejoin="round"
                    strokeWidth={2}
                    d="M3 8l7.89 5.26a2 2 0 002.22 0L21 8M5 19h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v10a2 2 0 002 2z"
                  />
                </svg>
              </div>
              <h3 className="text-xl font-black mb-2">Email</h3>
              <p className="text-gray-600 font-semibold">info@fleetapp.com</p>
            </div>

            <div>
              <div className="w-16 h-16 rounded-2xl bg-gradient-to-br from-accent/20 to-accent-light/20 border-2 border-accent/30 flex items-center justify-center mx-auto mb-5 shadow-lg">
                <svg
                  className="w-7 h-7 text-accent"
                  fill="none"
                  stroke="currentColor"
                  viewBox="0 0 24 24"
                  xmlns="http://www.w3.org/2000/svg"
                >
                  <path
                    strokeLinecap="round"
                    strokeLinejoin="round"
                    strokeWidth={2}
                    d="M3 5a2 2 0 012-2h3.28a1 1 0 01.948.684l1.498 4.493a1 1 0 01-.502 1.21l-2.257 1.13a11.042 11.042 0 005.516 5.516l1.13-2.257a1 1 0 011.21-.502l4.493 1.498a1 1 0 01.684.949V19a2 2 0 01-2 2h-1C9.716 21 3 14.284 3 6V5z"
                  />
                </svg>
              </div>
              <h3 className="text-xl font-black mb-2">Phone</h3>
              <p className="text-gray-600 font-semibold">+961 76875575</p>
            </div>

            <div>
              <div className="w-16 h-16 rounded-2xl bg-gradient-to-br from-accent/20 to-accent-light/20 border-2 border-accent/30 flex items-center justify-center mx-auto mb-5 shadow-lg">
                <svg
                  className="w-7 h-7 text-accent"
                  fill="none"
                  stroke="currentColor"
                  viewBox="0 0 24 24"
                  xmlns="http://www.w3.org/2000/svg"
                >
                  <path
                    strokeLinecap="round"
                    strokeLinejoin="round"
                    strokeWidth={2}
                    d="M17.657 16.657L13.414 20.9a1.998 1.998 0 01-2.827 0l-4.244-4.243a8 8 0 1111.314 0z"
                  />
                  <path
                    strokeLinecap="round"
                    strokeLinejoin="round"
                    strokeWidth={2}
                    d="M15 11a3 3 0 11-6 0 3 3 0 016 0z"
                  />
                </svg>
              </div>
              <h3 className="text-xl font-black mb-2">Location</h3>
              <p className="text-gray-600 font-semibold">Beirut, Lebanon</p>
            </div>
          </div>
        </motion.div>
      </div>
    </section>
  );
}
