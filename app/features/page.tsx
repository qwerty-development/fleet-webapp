'use client'

import { AwaitedReactNode, JSXElementConstructor, Key, ReactElement, ReactNode, ReactPortal, useState } from 'react';
import { motion } from 'framer-motion';
import Link from 'next/link';
import { 
  UserIcon, 
  BuildingStorefrontIcon, 
  ShieldCheckIcon,
  MagnifyingGlassIcon,
  FilmIcon,
  HeartIcon,
  ChatBubbleLeftRightIcon,
  ArrowPathIcon,
  MapPinIcon,
  BellAlertIcon,
  ChartBarIcon,
  TagIcon,
  PresentationChartLineIcon,
  PhotoIcon,
  CogIcon,
  UsersIcon,
  DocumentTextIcon,
  QueueListIcon,
  CurrencyDollarIcon,
  ArrowLeftIcon
} from '@heroicons/react/24/outline';

export default function FeaturesPage() {
  const [activeTab, setActiveTab] = useState('users');
  
  // Animation variants
  const containerVariants = {
    hidden: { opacity: 0 },
    visible: { 
      opacity: 1,
      transition: { 
        staggerChildren: 0.1
      }
    }
  };
  
  const itemVariants = {
    hidden: { y: 20, opacity: 0 },
    visible: { 
      y: 0, 
      opacity: 1,
      transition: { duration: 0.6, ease: "easeOut" }
    }
  };

  // Feature data by user roles
  const features : any = {
    users: [
      {
        icon: <MagnifyingGlassIcon className="w-6 h-6" />,
        title: "Advanced Search & Filtering",
        description: "Find your ideal vehicle with powerful search filters including make, model, year, price range, mileage, and more. Save your search criteria for future use."
      },
      {
        icon: <HeartIcon className="w-6 h-6" />,
        title: "Favorites Management",
        description: "Save vehicles to your favorites list for easy access. Compare multiple vehicles side by side to make the best choice."
      },
      {
        icon: <FilmIcon className="w-6 h-6" />,
        title: "AutoClips Video Content",
        description: "Watch engaging video walkthroughs of vehicles to get a better understanding of features and condition before contacting dealerships."
      },
      {
        icon: <ChatBubbleLeftRightIcon className="w-6 h-6" />,
        title: "Instant Messaging",
        description: "Connect directly with dealerships through our secure messaging system. Ask questions and negotiate without leaving the app."
      },
      {
        icon: <BellAlertIcon className="w-6 h-6" />,
        title: "Personalized Notifications",
        description: "Receive alerts for price drops on favorite vehicles, new listings matching your criteria, and dealership responses."
      },
      {
        icon: <MapPinIcon className="w-6 h-6" />,
        title: "Location-Based Search",
        description: "Find vehicles and dealerships near you with integrated mapping. Get directions directly to the dealership for test drives."
      },
      {
        icon: <ArrowPathIcon className="w-6 h-6" />,
        title: "Recently Viewed",
        description: "Keep track of vehicles you've viewed with a history feature that lets you quickly return to listings that caught your interest."
      },
      {
        icon: <DocumentTextIcon className="w-6 h-6" />,
        title: "Vehicle History Reports",
        description: "Access detailed vehicle history reports including accident history, service records, and ownership history."
      },
    ],
    
    dealerships: [
      {
        icon: <QueueListIcon className="w-6 h-6" />,
        title: "Inventory Management",
        description: "Upload and manage your entire inventory with our easy-to-use dashboard. Add detailed specifications, pricing, and multiple high-quality images per listing."
      },
      {
        icon: <FilmIcon className="w-6 h-6" />,
        title: "AutoClips Creation",
        description: "Create engaging video content showcasing your vehicles. Highlight special features, document condition, and give virtual tours to attract more buyers."
      },
      {
        icon: <ChartBarIcon className="w-6 h-6" />,
        title: "Performance Analytics",
        description: "Track listing performance with detailed metrics including views, inquiries, and comparison rates. Identify trends and optimize your inventory strategy."
      },
      {
        icon: <ChatBubbleLeftRightIcon className="w-6 h-6" />,
        title: "Lead Management",
        description: "Manage customer inquiries efficiently with our organized communication system. Never miss a potential sale with notifications and detailed customer information."
      },
      {
        icon: <TagIcon className="w-6 h-6" />,
        title: "Promotional Tools",
        description: "Create special offers, highlight featured vehicles, and run time-limited promotions to attract more customers and move inventory faster."
      },
      {
        icon: <PresentationChartLineIcon className="w-6 h-6" />,
        title: "Sales Reporting",
        description: "Generate comprehensive sales reports with detailed analytics. Export data for your records or integrate with your existing systems."
      },
      {
        icon: <PhotoIcon className="w-6 h-6" />,
        title: "Multi-media Showcase",
        description: "Upload high-resolution photos, 360° views, and detailed closeups of vehicle features to showcase your inventory in the best possible light."
      },
      {
        icon: <CurrencyDollarIcon className="w-6 h-6" />,
        title: "Subscription Management",
        description: "Manage your Fleet subscription, billing history, and upgrade options directly through your dealership dashboard."
      }
    ],
    
    administrators: [
      {
        icon: <UsersIcon className="w-6 h-6" />,
        title: "User Management",
        description: "Comprehensive tools for managing both buyers and dealerships. Handle account verification, support requests, and account actions like suspension if needed."
      },
      {
        icon: <PresentationChartLineIcon className="w-6 h-6" />,
        title: "Platform Analytics",
        description: "Access detailed platform metrics including user growth, engagement rates, inventory statistics, and revenue tracking across the entire ecosystem."
      },
      {
        icon: <DocumentTextIcon className="w-6 h-6" />,
        title: "Content Moderation",
        description: "Review and approve dealership listings and AutoClips to maintain quality standards. Flag inappropriate content and manage the review process."
      },
      {
        icon: <CogIcon className="w-6 h-6" />,
        title: "System Configuration",
        description: "Manage platform settings, feature toggles, and system-wide notifications. Control app behavior and tailor the experience for all users."
      },
      {
        icon: <BuildingStorefrontIcon className="w-6 h-6" />,
        title: "Dealership Verification",
        description: "Verify the legitimacy of dealerships joining the platform with document review tools and background check capabilities."
      },
      {
        icon: <CurrencyDollarIcon className="w-6 h-6" />,
        title: "Billing & Subscription",
        description: "Manage subscription plans, process payments, and handle billing inquiries. Generate revenue reports and monitor subscription metrics."
      },
      {
        icon: <ShieldCheckIcon className="w-6 h-6" />,
        title: "Security Monitoring",
        description: "Monitor platform security, detect suspicious activities, and implement security measures to protect user data and prevent fraud."
      },
      {
        icon: <ChartBarIcon className="w-6 h-6" />,
        title: "Performance Optimization",
        description: "Tools for monitoring app performance, optimizing database queries, and ensuring smooth operation even during peak usage periods."
      }
    ]
  };

  return (
    <div className="min-h-screen bg-background text-foreground">
      {/* Header */}
      <header className="bg-black-medium py-8">
        <div className="container mx-auto px-4">
          <div className="flex items-center justify-between">
            <Link href="/" passHref>
              <div className="flex items-center gap-2 text-accent hover:text-accent-light transition-colors duration-300 cursor-pointer">
                <ArrowLeftIcon className="w-5 h-5" />
                <span>Back to Home</span>
              </div>
            </Link>
            <img src="/logo.png" alt="Fleet Logo" className="h-10" />
          </div>
          <div className="mt-12 text-center">
            <motion.h1 
              initial={{ opacity: 0, y: -20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.8 }}
              className="text-4xl md:text-6xl font-bold mb-4"
            >
              Fleet <span className="text-accent">Features</span>
            </motion.h1>
            <motion.p 
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.8, delay: 0.2 }}
              className="text-xl text-gray-400 max-w-3xl mx-auto"
            >
              Explore the comprehensive set of tools and capabilities available on the Fleet platform
            </motion.p>
          </div>
        </div>
      </header>

      {/* Tab Navigation */}
      <div className="bg-black-light py-8 sticky top-0 z-30">
        <div className="container mx-auto px-4">
          <div className="flex flex-wrap justify-center gap-3">
            <button
              onClick={() => setActiveTab('users')}
              className={`px-6 py-3 rounded-full flex items-center gap-2 transition-colors duration-300 ${
                activeTab === 'users' 
                  ? 'bg-accent text-white' 
                  : 'bg-black-medium text-gray-400 hover:bg-black-dark'
              }`}
            >
              <UserIcon className="w-5 h-5" />
              <span>For Car Buyers</span>
            </button>
            <button
              onClick={() => setActiveTab('dealerships')}
              className={`px-6 py-3 rounded-full flex items-center gap-2 transition-colors duration-300 ${
                activeTab === 'dealerships' 
                  ? 'bg-accent text-white' 
                  : 'bg-black-medium text-gray-400 hover:bg-black-dark'
              }`}
            >
              <BuildingStorefrontIcon className="w-5 h-5" />
              <span>For Dealerships</span>
            </button>
            <button
              onClick={() => setActiveTab('administrators')}
              className={`px-6 py-3 rounded-full flex items-center gap-2 transition-colors duration-300 ${
                activeTab === 'administrators' 
                  ? 'bg-accent text-white' 
                  : 'bg-black-medium text-gray-400 hover:bg-black-dark'
              }`}
            >
              <ShieldCheckIcon className="w-5 h-5" />
              <span>For Administrators</span>
            </button>
          </div>
        </div>
      </div>

      {/* Features Grid */}
      <section className="py-20">
        <div className="container mx-auto px-4">
          <motion.div 
            variants={containerVariants}
            initial="hidden"
            animate="visible"
            key={activeTab}
            className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-8"
          >
            {features[activeTab].map((feature: { icon: string | number | bigint | boolean | ReactElement<any, string | JSXElementConstructor<any>> | Iterable<ReactNode> | ReactPortal | Promise<AwaitedReactNode> | null | undefined; title: string | number | bigint | boolean | ReactElement<any, string | JSXElementConstructor<any>> | Iterable<ReactNode> | ReactPortal | Promise<AwaitedReactNode> | null | undefined; description: string | number | bigint | boolean | ReactElement<any, string | JSXElementConstructor<any>> | Iterable<ReactNode> | ReactPortal | Promise<AwaitedReactNode> | null | undefined; }, index: Key | null | undefined) => (
              <motion.div
                key={index}
                variants={itemVariants}
                className="bg-black-light rounded-xl p-8 border border-gray-800 hover:border-accent transition-all duration-300 hover:shadow-lg hover:shadow-accent/10"
              >
                <div className="bg-accent p-4 rounded-lg inline-block text-white mb-6">
                  {feature.icon}
                </div>
                <h3 className="text-xl font-bold mb-3">{feature.title}</h3>
                <p className="text-gray-400">{feature.description}</p>
              </motion.div>
            ))}
          </motion.div>
        </div>
      </section>

      {/* CTA Section */}
      {/* <section className="py-20 bg-black-medium">
        <div className="container mx-auto px-4 text-center">
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            whileInView={{ opacity: 1, y: 0 }}
            viewport={{ once: true }}
            transition={{ duration: 0.8 }}
          >
            <h2 className="text-3xl md:text-4xl font-bold mb-6">Ready to experience Fleet?</h2>
            <p className="text-xl text-gray-400 max-w-2xl mx-auto mb-10">
              Join the growing community of car buyers and dealerships using Fleet to revolutionize the car shopping experience.
            </p>
            <div className="flex flex-col sm:flex-row items-center justify-center gap-6">
              <a 
                href="#" 
                className="px-8 py-4 bg-accent hover:bg-accent-dark text-white font-bold rounded-lg transition-colors duration-300 w-full sm:w-auto"
              >
                Download App
              </a>
              <a 
                href="#" 
                className="px-8 py-4 bg-transparent border-2 border-accent hover:bg-accent/10 text-white font-bold rounded-lg transition-colors duration-300 w-full sm:w-auto"
              >
                Request Demo
              </a>
            </div>
          </motion.div>
        </div>
      </section> */}

      {/* Footer */}
      <footer className="bg-black-dark py-10">
        <div className="container mx-auto px-4 text-center">
          <img src="/logo.png" alt="Fleet Logo" className="h-8 mx-auto mb-6" />
          <p className="text-gray-500">
            © {new Date().getFullYear()} Fleet. All rights reserved.
          </p>
          <div className="flex justify-center gap-6 mt-6">
            <a href="#" className="text-gray-500 hover:text-accent transition-colors duration-300">
              Terms
            </a>
            <a href="#" className="text-gray-500 hover:text-accent transition-colors duration-300">
              Privacy
            </a>
            <a href="#" className="text-gray-500 hover:text-accent transition-colors duration-300">
              Contact
            </a>
          </div>
        </div>
      </footer>
    </div>
  );
}