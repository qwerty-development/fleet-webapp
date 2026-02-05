"use client";
import React from "react";
import { motion } from "framer-motion";
import Link from "next/link";

const DealerDetails: React.FC = () => {
  return (
    <div className="">
      <div className="rounded-3xl shadow-2xl overflow-hidden relative bg-[url('/landing%20page/dealer.jpg')] bg-cover bg-center after:content-[''] after:absolute after:inset-0 after:bg-gradient-to-b after:from-[#151515] after:via-black/60 after:to-black/30">
        {/* Main content container */}
        <div className="px-6 md:px-12 lg:px-20 py-16 md:py-24 flex flex-col md:flex-row items-center gap-12 md:gap-16 relative z-10">
          {/* Text content */}
          <motion.div
            initial={{ opacity: 0, x: -40 }}
            whileInView={{ opacity: 1, x: 0 }}
            viewport={{ once: true }}
            transition={{ duration: 0.8 }}
            className="flex flex-col space-y-6 md:w-1/2"
          >
            <motion.span
              className="inline-block text-accent font-bold mb-3 px-5 py-2 rounded-full bg-accent/20 border-2 border-accent/40 w-fit uppercase tracking-wider text-sm backdrop-blur-sm"
              initial={{ opacity: 0, scale: 0.8 }}
              whileInView={{ opacity: 1, scale: 1 }}
              viewport={{ once: true }}
              transition={{ duration: 0.5 }}
            >
              For Dealerships
            </motion.span>

            <h2 className="text-4xl md:text-5xl lg:text-6xl xl:text-7xl text-white font-black leading-tight">
              Dealer's{" "}
              <span className="bg-gradient-to-r from-accent to-accent-light bg-clip-text text-transparent">
                Haven
              </span>
            </h2>

            <h3 className="text-xl md:text-2xl lg:text-3xl text-white/90 leading-relaxed font-semibold mt-4">
              Streamline your inventory management and connect with potential
              buyers through our comprehensive dealership platform.
            </h3>

            <p className="text-white/80 text-lg md:text-xl font-medium mt-4">
              Our platform offers powerful tools for dealerships to showcase
              their inventory, manage listings, and track analytics - all in one
              place.
            </p>

            <div className="pt-4 flex flex-wrap gap-4">
              <motion.div
                whileHover={{ scale: 1.05 }}
                whileTap={{ scale: 0.95 }}
                className="cursor-pointer"
              >
                <Link
                  href="/dealerships"
                  className="bg-gradient-to-r from-accent to-accent-light hover:from-accent-dark hover:to-accent text-white font-bold py-4 px-8 rounded-2xl transition-all duration-300 inline-flex items-center shadow-xl hover:shadow-2xl transform hover:scale-105 uppercase tracking-wide text-sm"
                >
                  Join Our Network
                  <svg
                    xmlns="http://www.w3.org/2000/svg"
                    className="h-5 w-5 ml-2"
                    viewBox="0 0 20 20"
                    fill="currentColor"
                  >
                    <path
                      fillRule="evenodd"
                      d="M10.293 5.293a1 1 0 011.414 0l4 4a1 1 0 010 1.414l-4 4a1 1 0 01-1.414-1.414L12.586 11H5a1 1 0 110-2h7.586l-2.293-2.293a1 1 0 010-1.414z"
                      clipRule="evenodd"
                    />
                  </svg>
                </Link>
              </motion.div>

              <motion.div
                whileHover={{ scale: 1.05 }}
                whileTap={{ scale: 0.95 }}
                className="cursor-pointer"
              >
                <Link
                  href="/features"
                  className="border-2 border-white/30 hover:border-accent/60 text-white hover:text-accent font-bold py-4 px-8 rounded-2xl transition-all duration-300 inline-flex items-center backdrop-blur-sm bg-white/10 hover:bg-white/20 uppercase tracking-wide text-sm"
                >
                  Learn More
                </Link>
              </motion.div>
            </div>
          </motion.div>

          {/* Image gallery */}
          <motion.div
            initial={{ opacity: 0, x: 40 }}
            whileInView={{ opacity: 1, x: 0 }}
            viewport={{ once: true }}
            transition={{ duration: 0.8, delay: 0.2 }}
            className="flex md:w-1/2 relative h-[400px] sm:h-[450px] md:h-[600px] w-full overflow-hidden"
          >
            <div className="relative flex items-center justify-center w-full">
              {/* First image - slightly behind */}
              <motion.div
                initial={{ y: 20 }}
                animate={{ y: [20, 0, 20] }}
                transition={{
                  repeat: Infinity,
                  duration: 5,
                  ease: "easeInOut",
                }}
                className="absolute left-0 sm:left-2 md:left-4 z-10 transform -rotate-6 shadow-xl"
              >
                <img
                  src="showcase/browsing.png"
                  alt="Vehicle browsing interface"
                  className="h-[280px] sm:h-[320px] md:h-[400px] lg:h-[500px] rounded-3xl border-4 border-black/80 object-contain"
                />
              </motion.div>

              {/* Second image - in front */}
              <motion.div
                initial={{ y: 0 }}
                animate={{ y: [0, -20, 0] }}
                transition={{
                  repeat: Infinity,
                  duration: 5,
                  ease: "easeInOut",
                  delay: 0.5,
                }}
                className="absolute z-30 transform translate-x-0 sm:translate-x-2 md:translate-x-0 shadow-2xl"
              >
                <img
                  src="showcase/dealership.png"
                  alt="Dealership management interface"
                  className="h-[320px] sm:h-[360px] md:h-[450px] lg:h-[550px] rounded-3xl border-4 border-black/80 object-contain"
                />
              </motion.div>

              {/* Third image - slightly behind */}
              <motion.div
                initial={{ y: 10 }}
                animate={{ y: [10, -10, 10] }}
                transition={{
                  repeat: Infinity,
                  duration: 5,
                  ease: "easeInOut",
                  delay: 1,
                }}
                className="absolute right-0 sm:right-2 md:right-4 z-20 transform rotate-6 shadow-xl"
              >
                <img
                  src="showcase/authentication.png"
                  alt="Authentication interface"
                  className="h-[280px] sm:h-[320px] md:h-[400px] lg:h-[500px] rounded-3xl border-4 border-black/80 object-contain"
                />
              </motion.div>
            </div>
          </motion.div>
        </div>

        {/* Feature highlights */}
        <div className="relative z-[999]">
          {/* Decorative connector element */}
          <div className="absolute left-1/2 transform -translate-x-1/2 -top-5 w-1 h-10 bg-accent/30"></div>

          <div className="bg-gradient-to-b from-black/50 to-black/30 backdrop-blur-sm px-6 md:px-12 lg:px-20 py-12 grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 gap-6 md:gap-8 border-t border-accent/20">
            <motion.div
              initial={{ opacity: 0, y: 20 }}
              whileInView={{ opacity: 1, y: 0 }}
              viewport={{ once: true }}
              transition={{ duration: 0.5 }}
              className="flex flex-col items-center text-center p-8 rounded-2xl bg-white/10 backdrop-blur-xl border-2 border-white/20 hover:border-accent/50 hover:bg-white/15 transition-all duration-300 shadow-xl hover:shadow-2xl hover:shadow-accent/20 z-[9999] transform hover:-translate-y-1"
            >
              <div className="bg-gradient-to-br from-accent/30 to-accent-light/30 p-5 rounded-2xl mb-5 border-2 border-accent/40 shadow-lg">
                <svg
                  xmlns="http://www.w3.org/2000/svg"
                  className="h-10 w-10 text-accent"
                  viewBox="0 0 20 20"
                  fill="currentColor"
                >
                  <path d="M9 6a3 3 0 11-6 0 3 3 0 016 0zM17 6a3 3 0 11-6 0 3 3 0 016 0zM12.93 17c.046-.327.07-.66.07-1a6.97 6.97 0 00-1.5-4.33A5 5 0 0119 16v1h-6.07zM6 11a5 5 0 015 5v1H1v-1a5 5 0 015-5z" />
                </svg>
              </div>
              <h3 className="text-2xl font-black text-white mb-3">
                Expanded Reach
              </h3>
              <p className="text-white/80 font-medium">
                Connect with thousands of potential buyers actively searching
                for vehicles in your area.
              </p>
            </motion.div>

            <motion.div
              initial={{ opacity: 0, y: 20 }}
              whileInView={{ opacity: 1, y: 0 }}
              viewport={{ once: true }}
              transition={{ duration: 0.5, delay: 0.2 }}
              className="flex flex-col items-center text-center p-8 rounded-2xl bg-white/10 backdrop-blur-xl border-2 border-white/20 hover:border-accent/50 hover:bg-white/15 transition-all duration-300 shadow-xl hover:shadow-2xl hover:shadow-accent/20 z-[9999] transform hover:-translate-y-1"
            >
              <div className="bg-gradient-to-br from-accent/30 to-accent-light/30 p-5 rounded-2xl mb-5 border-2 border-accent/40 shadow-lg">
                <svg
                  xmlns="http://www.w3.org/2000/svg"
                  className="h-10 w-10 text-accent"
                  viewBox="0 0 20 20"
                  fill="currentColor"
                >
                  <path
                    fillRule="evenodd"
                    d="M3 3a1 1 0 000 2v8a2 2 0 002 2h2.586l-1.293 1.293a1 1 0 101.414 1.414L10 15.414l2.293 2.293a1 1 0 001.414-1.414L12.414 15H15a2 2 0 002-2V5a1 1 0 100-2H3zm11.707 4.707a1 1 0 00-1.414-1.414L10 9.586 8.707 8.293a1 1 0 00-1.414 0l-2 2a1 1 0 101.414 1.414L8 10.414l1.293 1.293a1 1 0 001.414 0l4-4z"
                    clipRule="evenodd"
                  />
                </svg>
              </div>
              <h3 className="text-2xl font-black text-white mb-3">
                Powerful Analytics
              </h3>
              <p className="text-white/80 font-medium">
                Gain insights into customer behavior and optimize your inventory
                with our detailed analytics.
              </p>
            </motion.div>

            <motion.div
              initial={{ opacity: 0, y: 20 }}
              whileInView={{ opacity: 1, y: 0 }}
              viewport={{ once: true }}
              transition={{ duration: 0.5, delay: 0.4 }}
              className="flex flex-col items-center text-center p-8 rounded-2xl bg-white/10 backdrop-blur-xl border-2 border-white/20 hover:border-accent/50 hover:bg-white/15 transition-all duration-300 shadow-xl hover:shadow-2xl hover:shadow-accent/20 z-[9999] transform hover:-translate-y-1"
            >
              <div className="bg-gradient-to-br from-accent/30 to-accent-light/30 p-5 rounded-2xl mb-5 border-2 border-accent/40 shadow-lg">
                <svg
                  xmlns="http://www.w3.org/2000/svg"
                  className="h-10 w-10 text-accent"
                  viewBox="0 0 20 20"
                  fill="currentColor"
                >
                  <path
                    fillRule="evenodd"
                    d="M10 18a8 8 0 100-16 8 8 0 000 16zm1-12a1 1 0 10-2 0v4a1 1 0 00.293.707l2.828 2.829a1 1 0 101.415-1.415L11 9.586V6z"
                    clipRule="evenodd"
                  />
                </svg>
              </div>
              <h3 className="text-2xl font-black text-white mb-3">
                Streamlined Management
              </h3>
              <p className="text-white/80 font-medium">
                Easily manage your inventory, update listings, and respond to
                inquiries all in one place.
              </p>
            </motion.div>
          </div>
        </div>
      </div>
    </div>
  );
};

export default DealerDetails;
