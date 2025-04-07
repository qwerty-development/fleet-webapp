'use client';

import React from 'react';
import { motion } from 'framer-motion';
import Link from 'next/link';
import { ArrowLeftIcon } from '@heroicons/react/24/outline';

export default function PrivacyPolicyPage() {
  // Animation variants
  const containerVariants = {
    hidden: { opacity: 0 },
    visible: {
      opacity: 1,
      transition: {
        delayChildren: 0.3,
        staggerChildren: 0.1
      }
    }
  };

  const itemVariants = {
    hidden: { y: 20, opacity: 0 },
    visible: {
      y: 0,
      opacity: 1,
      transition: { duration: 0.5 }
    }
  };

  // Last updated date - using the date from the Terms document for consistency
  const lastUpdated = "April 7th, 2025";

  return (
    <div className="min-h-screen bg-gradient-to-b from-background to-black-light pt-8 pb-16">
      <div className="container mx-auto px-4 max-w-3xl">
        <div className="mb-8">
          <Link
            href="/"
            className="inline-flex items-center text-gray-400 hover:text-white transition-colors"
          >
            <ArrowLeftIcon className="h-4 w-4 mr-1" />
            Back to Home
          </Link>
        </div>

        <motion.div
          variants={containerVariants}
          initial="hidden"
          animate="visible"
          className="bg-background/50 backdrop-blur-sm border border-gray-700 rounded-xl p-6 md:p-8 shadow-lg"
        >
          <motion.h1
            variants={itemVariants}
            className="text-3xl md:text-4xl font-bold mb-6 text-accent"
          >
            Privacy Policy
          </motion.h1>

          <motion.p
            variants={itemVariants}
            className="text-gray-400 mb-8"
          >
            Last Updated: {lastUpdated}
          </motion.p>

          <div className="space-y-6 text-gray-200">
            <motion.div variants={itemVariants}>
              <h2 className="text-xl font-semibold mb-3 text-white">1. Introduction</h2>
              <p className="mb-3">
                Fleet SARL ("we", "our", "us", or "Fleetapp.me") respects your privacy and is committed to protecting your personal data. This Privacy Policy explains how we collect, use, disclose, and safeguard your information when you use our website and mobile application (collectively, the "Service").
              </p>
              <p className="mb-3">
                We are located in Lebanon (Baabdat, rue 20B) and are responsible for your information under this Privacy Policy.
              </p>
              <p>
                Please read this Privacy Policy carefully. By accessing or using the Service, you acknowledge that you have read, understood, and agree to be bound by all the terms of this Privacy Policy. If you do not agree with our policies and practices, please do not use our Service.
              </p>
            </motion.div>

            <motion.div variants={itemVariants}>
              <h2 className="text-xl font-semibold mb-3 text-white">2. Information We Collect</h2>

              <h3 className="text-lg font-medium mb-2 text-white">Personal Information</h3>
              <p className="mb-3">
                We may collect the following types of personal information:
              </p>
              <ul className="list-disc pl-6 space-y-2 mb-4">
                <li><strong>Account Information:</strong> When you register for an account, we collect your name, email address, and password.</li>
                <li><strong>Profile Information:</strong> Any additional information you provide in your profile such as contact details.</li>
                <li><strong>Transaction Information:</strong> Details about purchases or transactions made through our Service.</li>
                <li><strong>Payment Information:</strong> Credit card numbers and billing information when you subscribe to our premium services.</li>
                <li><strong>Communications:</strong> Information you provide when you contact us for support or communicate with other users.</li>
                <li><strong>User Content:</strong> Information and content you post to the Service, including comments, reviews, and feedback.</li>
              </ul>

              <h3 className="text-lg font-medium mb-2 text-white">Usage and Device Information</h3>
              <p className="mb-3">
                We automatically collect certain information when you use our Service:
              </p>
              <ul className="list-disc pl-6 space-y-2">
                <li><strong>Device Information:</strong> Information about your device, including IP address, device type, operating system, and browser type.</li>
                <li><strong>Usage Data:</strong> Information about how you use our Service, including the pages you visit, the time and duration of your visits, and the actions you take.</li>
                <li><strong>Location Information:</strong> With your consent, we may collect precise location information from your device.</li>
                <li><strong>Cookies and Similar Technologies:</strong> We use cookies and similar tracking technologies to track activity on our Service and hold certain information. See our Cookies section below for more details.</li>
              </ul>
            </motion.div>

            <motion.div variants={itemVariants}>
              <h2 className="text-xl font-semibold mb-3 text-white">3. How We Use Your Information</h2>
              <p className="mb-3">
                We use the information we collect for various purposes, including:
              </p>
              <ul className="list-disc pl-6 space-y-2">
                <li>To provide, maintain, and improve our Service</li>
                <li>To process transactions and send related information</li>
                <li>To create and maintain your account</li>
                <li>To provide customer support and respond to your inquiries</li>
                <li>To personalize your experience and deliver content and product offerings relevant to your interests</li>
                <li>To send you technical notices, updates, security alerts, and administrative messages</li>
                <li>To communicate with you about products, services, offers, promotions, and events, and provide other news or information about Fleetapp.me and our partners</li>
                <li>To monitor and analyze trends, usage, and activities in connection with our Service</li>
                <li>To detect, prevent, and address technical issues, fraud, and illegal activities</li>
                <li>To comply with legal obligations</li>
                <li>To enforce our Terms & Conditions and other agreements</li>
              </ul>
            </motion.div>

            <motion.div variants={itemVariants}>
              <h2 className="text-xl font-semibold mb-3 text-white">4. Cookies</h2>
              <p className="mb-3">
                Fleetapp.me uses "Cookies" to identify the areas of our website/app that you have visited. A Cookie is a
                small piece of data stored on your computer or mobile device by your web browser. We use Cookies to
                enhance the performance and functionality of our website/app but are non-essential to their use. However,
                without these cookies, certain functionality like videos may become unavailable or you would be required to
                enter your login details every time you visit the website/app as we would not be able to remember that you
                had logged in previously.
              </p>
              <p className="mb-3">
                Most web browsers can be set to disable the use of Cookies. However, if you disable Cookies, you may not be able to access functionality on our website/app correctly or at all. We never place Personally Identifiable Information in Cookies.
              </p>
              <p className="mb-3">
                The types of cookies we use include:
              </p>
              <ul className="list-disc pl-6 space-y-2">
                <li><strong>Session Cookies:</strong> These are temporary cookies that expire when you close your browser.</li>
                <li><strong>Persistent Cookies:</strong> These remain on your device until you delete them or they expire.</li>
                <li><strong>Essential Cookies:</strong> Necessary for the operation of our Service.</li>
                <li><strong>Analytical/Performance Cookies:</strong> Allow us to recognize and count the number of visitors and see how visitors move around our Service.</li>
                <li><strong>Functionality Cookies:</strong> Enable us to personalize our content for you.</li>
                <li><strong>Targeting Cookies:</strong> Record your visit to our Service, the pages you have visited, and the links you have followed.</li>
              </ul>
            </motion.div>

            <motion.div variants={itemVariants}>
              <h2 className="text-xl font-semibold mb-3 text-white">5. Disclosure of Your Information</h2>
              <p className="mb-3">
                We may share your information in the following situations:
              </p>
              <ul className="list-disc pl-6 space-y-2">
                <li><strong>With Service Providers:</strong> We may share your information with third-party vendors, service providers, contractors, or agents who perform services for us or on our behalf.</li>
                <li><strong>With Business Partners:</strong> We may share your information with our business partners to offer you certain products, services, or promotions.</li>
                <li><strong>With Other Users:</strong> When you share personal information or otherwise interact in public areas with other users, such information may be viewed by all users and may be publicly distributed.</li>
                <li><strong>For Business Transfers:</strong> We may share or transfer your information in connection with, or during negotiations of, any merger, sale of company assets, financing, or acquisition of all or a portion of our business to another company.</li>
                <li><strong>With Affiliates:</strong> We may share your information with our affiliates, in which case we will require those affiliates to honor this Privacy Policy.</li>
                <li><strong>With Your Consent:</strong> We may disclose your personal information for any other purpose with your consent.</li>
                <li><strong>To Comply with Legal Obligations:</strong> We may disclose your information where we are legally required to do so in order to comply with applicable law, governmental requests, a judicial proceeding, court order, or legal process.</li>
                <li><strong>To Protect Rights:</strong> We may disclose your information to protect the rights, property, or safety of Fleetapp.me, our customers, or others.</li>
              </ul>
            </motion.div>

            <motion.div variants={itemVariants}>
              <h2 className="text-xl font-semibold mb-3 text-white">6. Third-Party Services</h2>
              <p className="mb-3">
                Our Service may contain links to other websites or services that are not operated by us. If you click on a third-party link, you will be directed to that third party's site. We strongly advise you to review the Privacy Policy of every site you visit.
              </p>
              <p className="mb-3">
                We have no control over and assume no responsibility for the content, privacy policies, or practices of any third-party sites or services. The inclusion of links to such sites does not imply an endorsement by Fleetapp.me of the linked sites or their content.
              </p>
              <p>
                This Privacy Policy does not apply to third-party websites, applications, or services linked to from our Service, or recommended or referred by our Service or by our staff.
              </p>
            </motion.div>

            <motion.div variants={itemVariants}>
              <h2 className="text-xl font-semibold mb-3 text-white">7. Data Security</h2>
              <p className="mb-3">
                We have implemented appropriate technical and organizational security measures designed to protect the security of any personal information we process. However, please also remember that we cannot guarantee that the internet itself is 100% secure. Although we will do our best to protect your personal information, transmission of personal information to and from our Service is at your own risk. You should only access the Service within a secure environment.
              </p>
            </motion.div>

            <motion.div variants={itemVariants}>
              <h2 className="text-xl font-semibold mb-3 text-white">8. Data Retention</h2>
              <p className="mb-3">
                We will only retain your personal information for as long as necessary to fulfill the purposes we collected it for, including for the purposes of satisfying any legal, accounting, or reporting requirements.
              </p>
              <p>
                To determine the appropriate retention period for personal information, we consider the amount, nature, and sensitivity of the personal information, the potential risk of harm from unauthorized use or disclosure of your personal information, the purposes for which we process your personal information and whether we can achieve those purposes through other means, and the applicable legal requirements.
              </p>
            </motion.div>

            <motion.div variants={itemVariants}>
              <h2 className="text-xl font-semibold mb-3 text-white">9. Children's Privacy</h2>
              <p className="mb-3">
                Our Service is not directed to anyone under the age of 18 ("Children"). We do not knowingly collect personally identifiable information from anyone under the age of 18. If you are a parent or guardian and you are aware that your Child has provided us with personal information, please contact us. If we become aware that we have collected personal information from children without verification of parental consent, we take steps to remove that information from our servers.
              </p>
            </motion.div>

            <motion.div variants={itemVariants}>
              <h2 className="text-xl font-semibold mb-3 text-white">10. Your Privacy Rights</h2>
              <p className="mb-3">
                Depending on your location and applicable laws, you may have certain rights regarding your personal information, such as:
              </p>
              <ul className="list-disc pl-6 space-y-2">
                <li><strong>Right to Access:</strong> You may have the right to request access to your personal information we hold about you.</li>
                <li><strong>Right to Rectification:</strong> You may have the right to request that we correct any personal information you believe is inaccurate or complete any information you believe is incomplete.</li>
                <li><strong>Right to Erasure:</strong> You may have the right to request that we erase your personal information under certain conditions.</li>
                <li><strong>Right to Restrict Processing:</strong> You may have the right to request that we restrict the processing of your personal information under certain conditions.</li>
                <li><strong>Right to Data Portability:</strong> You may have the right to request that we transfer the data we have collected to another organization, or directly to you, under certain conditions.</li>
                <li><strong>Right to Object:</strong> You may have the right to object to our processing of your personal information under certain conditions.</li>
              </ul>
              <p className="mt-3">
                If you wish to exercise any of these rights, please contact us using the contact information provided at the end of this Privacy Policy.
              </p>
            </motion.div>

            <motion.div variants={itemVariants}>
              <h2 className="text-xl font-semibold mb-3 text-white">11. Submissions and Content</h2>
              <p className="mb-3">
                In the event that you submit or post any ideas, creative suggestions, designs, photographs, information, advertisements, data or proposals, including ideas for new or improved products, services, features, technologies or promotions, you expressly agree that such submissions will automatically be treated as non-confidential and non-proprietary and will become the sole property of Fleetapp.me without any compensation or credit to you whatsoever.
              </p>
              <p>
                Fleetapp.me and its affiliates shall have no obligations with respect to such submissions or posts and may use the ideas contained in such submissions or posts for any purposes in any medium in perpetuity, including, but not limited to, developing, manufacturing, and marketing products and services using such ideas.
              </p>
            </motion.div>

            <motion.div variants={itemVariants}>
              <h2 className="text-xl font-semibold mb-3 text-white">12. Changes to This Privacy Policy</h2>
              <p className="mb-3">
                We may update our Privacy Policy from time to time. We will notify you of any changes by posting the new Privacy Policy on this page and updating the "Last Updated" date at the top of this Privacy Policy.
              </p>
              <p className="mb-3">
                You are advised to review this Privacy Policy periodically for any changes. Changes to this Privacy Policy are effective when they are posted on this page.
              </p>
              <p>
                If we make material changes to this Privacy Policy, we will notify you either through the email address you have provided us, or by placing a prominent notice on our website.
              </p>
            </motion.div>

            <motion.div variants={itemVariants}>
              <h2 className="text-xl font-semibold mb-3 text-white">13. International Transfers</h2>
              <p className="mb-3">
                Our Service is based in Lebanon. If you are accessing our Service from outside Lebanon, please be aware that your information may be transferred to, stored, and processed by us in our facilities and by those third parties with whom we may share your personal information, in Lebanon and other countries.
              </p>
              <p>
                If you are located in a jurisdiction with different data protection laws than Lebanon, please note that we will take necessary measures to ensure that your personal information is treated securely and in accordance with this Privacy Policy.
              </p>
            </motion.div>

            <motion.div variants={itemVariants}>
              <h2 className="text-xl font-semibold mb-3 text-white">14. Contact Us</h2>
              <p className="mb-3">
                If you have any questions about this Privacy Policy, please contact us:
              </p>
              <div className="mt-2 p-3 bg-gray-800/50 rounded-lg">
                <p>Via Email: <a href="mailto:support@fleetapp.me" className="text-accent hover:underline">support@fleetapp.me</a></p>
                <p>Via Phone Number: <a href="tel:+96176875775" className="text-accent hover:underline">+96176875775</a></p>
                <p>Via Website: <a href="https://fleetapp.me" target="_blank" rel="noopener noreferrer" className="text-accent hover:underline">fleetapp.me</a></p>
              </div>
            </motion.div>
          </div>
        </motion.div>
      </div>
    </div>
  );
}