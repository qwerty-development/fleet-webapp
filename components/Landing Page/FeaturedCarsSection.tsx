'use client'
import React from "react";
import { motion } from "framer-motion";
import Link from "next/link";
import RandomCarCards from "./RandomCarCards";

export default function RandomCarCardsSection() {
  return (
    <section className="bg-gradient-to-b from-black  py-20">
      <div className="container mx-auto px-4">
        {/* Section header */}
        <motion.div 
          className="text-center mb-12"
          initial={{ opacity: 0, y: 20 }}
          whileInView={{ opacity: 1, y: 0 }}
          viewport={{ once: true }}
          transition={{ duration: 0.6 }}
        >
          <h2 className="text-3xl md:text-4xl font-bold text-white mb-4">
            Trending Vehicles
          </h2>
          <div className="w-20 h-1 bg-accent mx-auto mb-6 rounded-full"></div>
          <p className="text-lg text-white/70 max-w-2xl mx-auto">
            Browse through our latest selection of the most popular vehicles on FLEET
          </p>
        </motion.div>

        {/* RandomCarCards centered with improved styling */}
        <motion.div
          className="max-w-5xl mx-auto mb-12"
          initial={{ opacity: 0, y: 30 }}
          whileInView={{ opacity: 1, y: 0 }}
          viewport={{ once: true }}
          transition={{ duration: 0.8, delay: 0.2 }}
        >
          <div className="bg-gray-800/50 backdrop-blur-sm rounded-2xl p-6 border border-gray-700">
            <RandomCarCards />
          </div>
        </motion.div>

        {/* CTA button centered */}
        <motion.div 
          className="flex justify-center"
          initial={{ opacity: 0, y: 20 }}
          whileInView={{ opacity: 1, y: 0 }}
          viewport={{ once: true }}
          transition={{ duration: 0.6, delay: 0.4 }}
        >
          <Link href="/home" passHref>
            <motion.span
              className="inline-block bg-accent hover:bg-accent-dark transition-colors duration-300 text-white font-bold rounded-xl px-10 py-5 cursor-pointer text-center shadow-lg shadow-accent/20"
              whileHover={{ scale: 1.05 }}
              whileTap={{ scale: 0.98 }}
            >
              Start Browsing All Vehicles
            </motion.span>
          </Link>
        </motion.div>
      </div>
    </section>
  );
}