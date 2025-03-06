'use client'

import { motion } from 'framer-motion';
import { UserIcon, BuildingStorefrontIcon, CogIcon } from '@heroicons/react/24/outline';

export default function AboutSection() {
  return (
    <section id="about" className="py-20 ">
      <div className="container mx-auto px-4">
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          whileInView={{ opacity: 1, y: 0 }}
          viewport={{ once: true }}
          transition={{ duration: 0.8 }}
          className="mb-12 text-center"
        >
          <h2 className="text-4xl text-white md:text-5xl font-bold mb-4">Revolutionizing <span className="text-accent">Car Shopping</span></h2>
          <p className="text-xl text-gray-400 max-w-3xl mx-auto">
            Fleet connects car buyers with trusted dealerships through an intuitive platform designed to make vehicle shopping seamless and enjoyable.
          </p>
        </motion.div>

        <div className="grid grid-cols-1 text-white md:grid-cols-2 lg:grid-cols-3 gap-8">
          {[
            {
              title: "For Car Buyers",
              description: "Browse, filter, and find your perfect vehicle. Save favorites, watch video content, and connect directly with dealerships.",
              icon: <UserIcon className="w-12 h-12 mb-4 text-accent" />
            },
            {
              title: "For Dealerships",
              description: "Manage inventory, track analytics, create engaging video content, and connect with potential buyers through a powerful dashboard.",
              icon: <BuildingStorefrontIcon className="w-12 h-12 mb-4 text-accent" />
            },
            {
              title: "Platform Features",
              description: "Advanced search, real-time updates, interactive video content, and robust analytics all in one place.",
              icon: <CogIcon className="w-12 h-12 mb-4 text-accent" />
            }
          ].map((card, index) => (
            <motion.div
              key={index}
              initial={{ opacity: 0, y: 20 }}
              whileInView={{ opacity: 1, y: 0 }}
              viewport={{ once: true }}
              transition={{ duration: 0.8, delay: index * 0.2 }}
              className="bg-black p-8 rounded-xl border border-gray-800 hover:border-accent transition-colors duration-300"
            >
              <div className="text-center">
                {card.icon}
                <h3 className="text-2xl font-bold mb-4">{card.title}</h3>
                <p className="text-gray-400">{card.description}</p>
              </div>
            </motion.div>
          ))}
        </div>
      </div>
    </section>
  );
}