'use client';

import React from 'react';
import { motion } from 'framer-motion';
import Link from 'next/link';
import { ArrowLeftIcon } from '@heroicons/react/24/outline';

export default function TermsOfServicePage() {
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

  // Last updated date - using the date from the document
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
            TERMS & CONDITIONS
          </motion.h1>

          <motion.p
            variants={itemVariants}
            className="text-gray-400 mb-8"
          >
            Updated at {lastUpdated}
          </motion.p>

          <div className="space-y-6 text-gray-200">
            <motion.div variants={itemVariants}>
              <h2 className="text-xl font-semibold mb-3 text-white">General Terms</h2>
              <p className="mb-3">
                By accessing and placing an order with Fleetapp.me, you confirm that you are in agreement with and bound
                by the terms of service contained in the Terms & Conditions outlined below. These terms apply to the entire
                website and any email or other type of communication between you and Fleetapp.me.
              </p>
              <p className="mb-3">
                Under no circumstances shall Fleetapp.me team be liable for any direct, indirect, special, incidental or
                consequential damages, including, but not limited to, loss of data or profit, arising out of the use, or the
                inability to use, the materials on this site, even if Fleetapp.me team or an authorized representative has been
                advised of the possibility of such damages. If your use of materials from this site results in the need for
                servicing, repair or correction of equipment or data, you assume any costs thereof.
              </p>
              <p>
                Fleetapp.me will not be responsible for any outcome that may occur during the course of usage of our
                resources. We reserve the rights to change prices and revise the resources usage policy in any moment.
              </p>
            </motion.div>

            <motion.div variants={itemVariants}>
              <h2 className="text-xl font-semibold mb-3 text-white">License</h2>
              <p className="mb-3">
                Fleetapp.me grants you a revocable, non-exclusive, non-transferable, limited license to download, install and
                use the website/app strictly in accordance with the terms of this Agreement.
              </p>
              <p className="mb-3">
                These Terms & Conditions are a contract between you and Fleetapp.me (referred to in these Terms &
                Conditions as "Fleetapp.me", "us", "we" or "our"), the provider of the Fleetapp.me website and the services
                accessible from the Fleetapp.me website (which are collectively referred to in these Terms & Conditions as
                the "Fleetapp.me Service").
              </p>
              <p>
                You are agreeing to be bound by these Terms & Conditions. If you do not agree to these Terms &
                Conditions, please do not use the Fleetapp.me Service. In these Terms & Conditions, "you" refers both to
                you as an individual and to the entity you represent. If you violate any of these Terms & Conditions, we
                reserve the right to cancel your account or block access to your account without notice.
              </p>
            </motion.div>

            <motion.div variants={itemVariants}>
              <h2 className="text-xl font-semibold mb-3 text-white">Definitions and key terms</h2>
              <p className="mb-3">
                To help explain things as clearly as possible in this Terms & Conditions, every time any of these terms are
                referenced, are strictly defined as:
              </p>
              <ul className="list-disc pl-6 space-y-2">
                <li><strong>Cookie:</strong> small amount of data generated by a website and saved by your web browser. It is used to
                identify your browser, provide analytics, remember information about you such as your language
                preference or login information.</li>
                <li><strong>Company:</strong> when this terms mention "Company," "we," "us," or "our," it refers to Fleet SARL, (Baabdat,
                rue 20B), that is responsible for your information under this Terms & Conditions.</li>
                <li><strong>Country:</strong> where Fleetapp.me or the owners/founders of Fleetapp.me are based, in this case is Lebanon.</li>
                <li><strong>Device:</strong> any internet connected device such as a phone, tablet, computer or any other device that can
                be used to visit Fleetapp.me and use the services.</li>
                <li><strong>Service:</strong> refers to the service provided by Fleetapp.me as described in the relative terms (if available)
                and on this platform.</li>
                <li><strong>Third-party service:</strong> refers to advertisers, contest sponsors, promotional and marketing partners, and
                others who provide our content or whose products or services we think may interest you.</li>
                <li><strong>You:</strong> a person or entity that is registered with Fleetapp.me to use the Services.</li>
              </ul>
            </motion.div>

            <motion.div variants={itemVariants}>
              <h2 className="text-xl font-semibold mb-3 text-white">Restrictions</h2>
              <p className="mb-3">
                You agree not to, and you will not permit others to:
              </p>
              <ul className="list-disc pl-6 space-y-2">
                <li>License, sell, rent, lease, assign, distribute, transmit, host, outsource, disclose or otherwise
                commercially exploit the website/app or make the platform available to any third party.</li>
                <li>Modify, make derivative works of, disassemble, decrypt, reverse compile or reverse engineer any part
                of the website/app.</li>
                <li>Remove, alter or obscure any proprietary notice (including any notice of copyright or trademark) of
                Fleetapp.me or its affiliates, partners, suppliers or the licensors of the website/app.</li>
              </ul>
            </motion.div>

            <motion.div variants={itemVariants}>
              <h2 className="text-xl font-semibold mb-3 text-white">Payment</h2>
              <p className="mb-3">
                If you register to any of our recurring payment plans, you agree to pay all fees or charges to your account for
                the Service in accordance with the fees, charges and billing terms in effect at the time that each fee or
                charge is due and payable. Unless otherwise indicated in an order form, you must provide Fleetapp.me with
                a valid credit card (Visa, MasterCard, or any other issuer accepted by us) ("Payment Provider") as a
                condition to signing up for the Premium plan. Your Payment Provider agreement governs your use of the
                designated credit card account, and you must refer to that agreement and not these Terms to determine your
                rights and liabilities with respect to your Payment Provider.
              </p>
              <p className="mb-3">
                By providing Fleetapp.me with your credit card
                number and associated payment information, you agree that Fleetapp.me is authorized to verify information
                immediately, and subsequently invoice your account for all fees and charges due and payable to
                Fleetapp.me hereunder and that no additional notice or consent is required. You agree to immediately notify
                Fleetapp.me of any change in your billing address or the credit card used for payment hereunder.
                Fleetapp.me reserves the right at any time to change its prices and billing methods, either immediately upon
                posting on our Site or by e-mail delivery to your organization's administrator(s).
              </p>
              <p className="mb-3">
                Any attorney fees, court costs, or other costs incurred in collection of delinquent undisputed amounts shall
                be the responsibility of and paid for by you.
              </p>
              <p className="mb-3">
                No contract will exist between you and Fleetapp.me for the Service until Fleetapp.me accepts your order by
                a confirmatory e-mail, SMS/MMS message, or other appropriate means of communication.
              </p>
              <p>
                You are responsible for any third-party fees that you may incur when using the Service.
              </p>
            </motion.div>

            <motion.div variants={itemVariants}>
              <h2 className="text-xl font-semibold mb-3 text-white">Return and Refund Policy</h2>
              <p className="mb-3">
                Thanks for shopping at Fleetapp.me. We appreciate the fact that you like to buy the stuff we build. We also
                want to make sure you have a rewarding experience while you're exploring, evaluating, and purchasing our
                products.
              </p>
              <p className="mb-3">
                As with any shopping experience, there are terms and conditions that apply to transactions at Fleetapp.me.
                We'll be as brief as our attorneys will allow. The main thing to remember is that by placing an order or
                making a purchase at Fleetapp.me, you agree to the terms along with Fleetapp.me's Privacy Policy.
              </p>
              <p>
                If, for any reason, You are not completely satisfied with any good or service that we provide, don't hesitate to
                contact us and we will discuss any of the issues you are going through with our product.
              </p>
            </motion.div>

            <motion.div variants={itemVariants}>
              <h2 className="text-xl font-semibold mb-3 text-white">Your Suggestions</h2>
              <p className="mb-3">
                Any feedback, comments, ideas, improvements or suggestions (collectively, "Suggestions") provided by you
                to Fleetapp.me with respect to the website/app shall remain the sole and exclusive property of Fleetapp.me.
                Fleetapp.me shall be free to use, copy, modify, publish, or redistribute the Suggestions for any purpose and
                in any way without any credit or any compensation to you.
              </p>
            </motion.div>

            <motion.div variants={itemVariants}>
              <h2 className="text-xl font-semibold mb-3 text-white">Your Consent</h2>
              <p className="mb-3">
                We've updated our Terms & Conditions to provide you with complete transparency into what is being set
                when you visit our site and how it's being used. By using our website/app, registering an account, or making
                a purchase, you hereby consent to our Terms & Conditions.
              </p>
            </motion.div>

            <motion.div variants={itemVariants}>
              <h2 className="text-xl font-semibold mb-3 text-white">Links to Other Websites</h2>
              <p className="mb-3">
                This Terms & Conditions applies only to the Services. The Services may contain links to other websites not
                operated or controlled by Fleetapp.me. We are not responsible for the content, accuracy or opinions
                expressed in such websites, and such websites are not investigated, monitored or checked for accuracy or
                completeness by us. Please remember that when you use a link to go from the Services to another website,
                our Terms & Conditions are no longer in effect. Your browsing and interaction on any other website,
                including those that have a link on our platform, is subject to that website's own rules and policies. Such third
                parties may use their own cookies or other methods to collect information about you.
              </p>
            </motion.div>

            <motion.div variants={itemVariants}>
              <h2 className="text-xl font-semibold mb-3 text-white">Cookies</h2>
              <p className="mb-3">
                Fleetapp.me uses "Cookies" to identify the areas of our website/app that you have visited. A Cookie is a
                small piece of data stored on your computer or mobile device by your web browser. We use Cookies to
                enhance the performance and functionality of our website/app but are non-essential to their use. However,
                without these cookies, certain functionality like videos may become unavailable or you would be required to
                enter your login details every time you visit the website/app as we would not be able to remember that you
                had logged in previously. Most web browsers can be set to disable the use of Cookies. However, if you
                disable Cookies, you may not be able to access functionality on our website/app correctly or at all. We never
                place Personally Identifiable Information in Cookies.
              </p>
            </motion.div>

            <motion.div variants={itemVariants}>
              <h2 className="text-xl font-semibold mb-3 text-white">Changes To Our Terms & Conditions</h2>
              <p className="mb-3">
                You acknowledge and agree that Fleetapp.me may stop (permanently or temporarily) providing the Service
                (or any features within the Service) to you or to users generally at Fleetapp.me's sole discretion, without prior
                notice to you. You may stop using the Service at any time. You do not need to specifically inform
                Fleetapp.me when you stop using the Service. You acknowledge and agree that if Fleetapp.me disables
                access to your account, you may be prevented from accessing the Service, your account details or any files
                or other materials which is contained in your account.
              </p>
              <p>
                If we decide to change our Terms & Conditions, we will post those changes on this page, and/or update the
                Terms & Conditions modification date below.
              </p>
            </motion.div>

            <motion.div variants={itemVariants}>
              <h2 className="text-xl font-semibold mb-3 text-white">Modifications to Our website/app</h2>
              <p className="mb-3">
                Fleetapp.me reserves the right to modify, suspend or discontinue, temporarily or permanently, the
                website/app or any service to which it connects, with or without notice and without liability to you.
              </p>
            </motion.div>

            <motion.div variants={itemVariants}>
              <h2 className="text-xl font-semibold mb-3 text-white">Updates to Our website/app</h2>
              <p className="mb-3">
                Fleetapp.me may from time to time provide enhancements or improvements to the features/functionality of
                the website/app, which may include patches, bug fixes, updates, upgrades and other modifications
                ("Updates").
              </p>
              <p className="mb-3">
                Updates may modify or delete certain features and/or functionalities of the website/app. You agree that
                Fleetapp.me has no obligation to (i) provide any Updates, or (ii) continue to provide or enable any particular
                features and/or functionalities of the website/app to you.
              </p>
              <p>
                You further agree that all Updates will be (i) deemed to constitute an integral part of the website/app, and (ii)
                subject to the terms and conditions of this Agreement.
              </p>
            </motion.div>

            <motion.div variants={itemVariants}>
              <h2 className="text-xl font-semibold mb-3 text-white">Third-Party Services</h2>
              <p className="mb-3">
                We may display, include or make available third-party content (including data, information, applications and
                other products services) or provide links to third-party websites or services ("Third-Party Services").
              </p>
              <p className="mb-3">
                You acknowledge and agree that Fleetapp.me shall not be responsible for any Third-Party Services,
                including their accuracy, completeness, timeliness, validity, copyright compliance, legality, decency, quality
                or any other aspect thereof. Fleetapp.me does not assume and shall not have any liability or responsibility to
                you or any other person or entity for any Third-Party Services.
              </p>
              <p>
                Third-Party Services and links thereto are provided solely as a convenience to you and you access and use
                them entirely at your own risk and subject to such third parties' terms and conditions.
              </p>
            </motion.div>

            <motion.div variants={itemVariants}>
              <h2 className="text-xl font-semibold mb-3 text-white">Term and Termination</h2>
              <p className="mb-3">
                This Agreement shall remain in effect until terminated by you or Fleetapp.me.
              </p>
              <p className="mb-3">
                Fleetapp.me may, in its sole discretion, at any time and for any or no reason, suspend or terminate this
                Agreement with or without prior notice.
              </p>
              <p className="mb-3">
                This Agreement will terminate immediately, without prior notice from Fleetapp.me, in the event that you fail to
                comply with any provision of this Agreement. You may also terminate this Agreement by deleting the
                website/app and all copies thereof from your computer.
              </p>
              <p className="mb-3">
                Upon termination of this Agreement, you shall cease all use of the website/app and delete all copies of the
                website/app from your computer.
              </p>
              <p>
                Termination of this Agreement will not limit any of Fleetapp.me's rights or remedies at law or in equity in case
                of breach by you (during the term of this Agreement) of any of your obligations under the present Agreement.
              </p>
            </motion.div>

            <motion.div variants={itemVariants}>
              <h2 className="text-xl font-semibold mb-3 text-white">Copyright Infringement Notice</h2>
              <p className="mb-3">
                If you are a copyright owner or such owner's agent and believe any material on our website/app constitutes
                an infringement on your copyright, please contact us setting forth the following information:
              </p>
              <p>
                (a) a physical or electronic signature of the copyright owner or a person authorized to act on his behalf;
                (b) identification of the material that is claimed to be infringing;
                (c) your contact information, including your address, telephone number, and an email;
                (d) a statement by you that you have a good faith belief that use of the material is not authorized by the copyright owners; and
                (e) the a statement that the information in the notification is accurate, and, under penalty of perjury you are authorized to act on behalf of the owner.
              </p>
            </motion.div>

            <motion.div variants={itemVariants}>
              <h2 className="text-xl font-semibold mb-3 text-white">Indemnification</h2>
              <p className="mb-3">
                You agree to indemnify and hold Fleetapp.me and its parents, subsidiaries, affiliates, officers, employees,
                agents, partners and licensors (if any) harmless from any claim or demand, including reasonable attorneys'
                fees, due to or arising out of your: (a) use of the website/app; (b) violation of this Agreement or any law or
                regulation; or (c) violation of any right of a third party.
              </p>
            </motion.div>

            <motion.div variants={itemVariants}>
              <h2 className="text-xl font-semibold mb-3 text-white">No Warranties</h2>
              <p className="mb-3">
                The website/app is provided to you "AS IS" and "AS AVAILABLE" and with all faults and defects without
                warranty of any kind. To the maximum extent permitted under applicable law, Fleetapp.me, on its own behalf
                and on behalf of its affiliates and its and their respective licensors and service providers, expressly disclaims
                all warranties, whether express, implied, statutory or otherwise, with respect to the website/app, including all
                implied warranties of merchantability, fitness for a particular purpose, title and non-infringement, and
                warranties that may arise out of course of dealing, course of performance, usage or trade practice. Without
                limitation to the foregoing, Fleetapp.me provides no warranty or undertaking, and makes no representation of
                any kind that the website/app will meet your requirements, achieve any intended results, be compatible or
                work with any other software, website/apps, systems or services, operate without interruption, meet any
                performance or reliability standards or be error free or that any errors or defects can or will be corrected.
              </p>
              <p>
                Without limiting the foregoing, neither Fleetapp.me nor any Fleetapp.me's provider makes any representation
                or warranty of any kind, express or implied: (i) as to the operation or availability of the website/app, or the
                information, content, and materials or products included thereon; (ii) that the website/app will be
                uninterrupted or error-free; (iii) as to the accuracy, reliability, or currency of any information or content
                provided through the website/app; or (iv) that the website/app, its servers, the content, or e-mails sent from
                or on behalf of Fleetapp.me are free of viruses, scripts, trojan horses, worms, malware, timebombs or other
                harmful components.
              </p>
              <p>
                Some jurisdictions do not allow the exclusion of or limitations on implied warranties or the limitations on the
                applicable statutory rights of a consumer, so some or all of the above exclusions and limitations may not
                apply to you.
              </p>
            </motion.div>

            <motion.div variants={itemVariants}>
              <h2 className="text-xl font-semibold mb-3 text-white">Limitation of Liability</h2>
              <p className="mb-3">
                Notwithstanding any damages that you might incur, the entire liability of Fleetapp.me and any of its suppliers
                under any provision of this Agreement and your exclusive remedy for all of the foregoing shall be limited to
                the amount actually paid by you for the website/app.
              </p>
              <p>
                To the maximum extent permitted by applicable law, in no event shall Fleetapp.me or its suppliers be liable
                for any special, incidental, indirect, or consequential damages whatsoever (including, but not limited to,
                damages for loss of profits, for loss of data or other information, for business interruption, for personal injury,
                for loss of privacy arising out of or in any way related to the use of or inability to use the website/app,
                third-party software and/or third-party hardware used with the website/app, or otherwise in connection with
                any provision of this Agreement), even if Fleetapp.me or any supplier has been advised of the possibility of
                such damages and even if the remedy fails of its essential purpose.
              </p>
              <p>
                Some states/jurisdictions do not allow the exclusion or limitation of incidental or consequential damages, so
                the above limitation or exclusion may not apply to you.
              </p>
            </motion.div>

            <motion.div variants={itemVariants}>
              <h2 className="text-xl font-semibold mb-3 text-white">Severability</h2>
              <p className="mb-3">
                If any provision of this Agreement is held to be unenforceable or invalid, such provision will be changed and
                interpreted to accomplish the objectives of such provision to the greatest extent possible under applicable
                law and the remaining provisions will continue in full force and effect.
              </p>
              <p>
                This Agreement, together with the Privacy Policy and any other legal notices published by Fleetapp.me on
                the Services, shall constitute the entire agreement between you and Fleetapp.me concerning the Services. If
                any provision of this Agreement is deemed invalid by a court of competent jurisdiction, the invalidity of such
                provision shall not affect the validity of the remaining provisions of this Agreement, which shall remain in full
                force and effect. No waiver of any term of this Agreement shall be deemed a further or continuing waiver of
                such term or any other term, and Fleetapp.me's failure to assert any right or provision under this Agreement
                shall not constitute a waiver of such right or provision. YOU AND Fleetapp.me AGREE THAT ANY CAUSE
                OF ACTION ARISING OUT OF OR RELATED TO THE SERVICES MUST COMMENCE WITHIN ONE (1)
                YEAR AFTER THE CAUSE OF ACTION ACCRUES. OTHERWISE, SUCH CAUSE OF ACTION IS
                PERMANENTLY BARRED.
              </p>
            </motion.div>

            <motion.div variants={itemVariants}>
              <h2 className="text-xl font-semibold mb-3 text-white">Waiver</h2>
              <p className="mb-3">
                Except as provided herein, the failure to exercise a right or to require performance of an obligation under this
                Agreement shall not effect a party's ability to exercise such right or require such performance at any time
                thereafter nor shall be the waiver of a breach constitute waiver of any subsequent breach.
              </p>
              <p>
                No failure to exercise, and no delay in exercising, on the part of either party, any right or any power under
                this Agreement shall operate as a waiver of that right or power. Nor shall any single or partial exercise of any
                right or power under this Agreement preclude further exercise of that or any other right granted herein. In the
                event of a conflict between this Agreement and any applicable purchase or other terms, the terms of this
                Agreement shall govern.
              </p>
            </motion.div>

            <motion.div variants={itemVariants}>
              <h2 className="text-xl font-semibold mb-3 text-white">Amendments to this Agreement</h2>
              <p className="mb-3">
                Fleetapp.me reserves the right, at its sole discretion, to modify or replace this Agreement at any time. If a
                revision is material we will provide at least 30 days' notice prior to any new terms taking effect. What
                constitutes a material change will be determined at our sole discretion.
              </p>
              <p>
                By continuing to access or use our website/app after any revisions become effective, you agree to be bound
                by the revised terms. If you do not agree to the new terms, you are no longer authorized to use Fleetapp.me.
              </p>
            </motion.div>

            <motion.div variants={itemVariants}>
              <h2 className="text-xl font-semibold mb-3 text-white">Entire Agreement</h2>
              <p className="mb-3">
                The Agreement constitutes the entire agreement between you and Fleetapp.me regarding your use of the
                website/app and supersedes all prior and contemporaneous written or oral agreements between you and
                Fleetapp.me.
              </p>
              <p>
                You may be subject to additional terms and conditions that apply when you use or purchase other
                Fleetapp.me's services, which Fleetapp.me will provide to you at the time of such use or purchase.
              </p>
            </motion.div>

            <motion.div variants={itemVariants}>
              <h2 className="text-xl font-semibold mb-3 text-white">Updates to Our Terms</h2>
              <p className="mb-3">
                We may change our Service and policies, and we may need to make changes to these Terms so that they
                accurately reflect our Service and policies. Unless otherwise required by law, we will notify you (for example,
                through our Service) before we make changes to these Terms and give you an opportunity to review them
                before they go into effect. Then, if you continue to use the Service, you will be bound by the updated Terms.
                If you do not want to agree to these or any updated Terms, you can delete your account.
              </p>
            </motion.div>

            <motion.div variants={itemVariants}>
              <h2 className="text-xl font-semibold mb-3 text-white">Intellectual Property</h2>
              <p className="mb-3">
                The website/app and its entire contents, features and functionality (including but not limited to all information,
                software, text, displays, images, video and audio, and the design, selection and arrangement thereof), are
                owned by Fleetapp.me, its licensors or other providers of such material and are protected by Lebanon and
                international copyright, trademark, patent, trade secret and other intellectual property or proprietary rights
                laws. The material may not be copied, modified, reproduced, downloaded or distributed in any way, in whole
                or in part, without the express prior written permission of Fleetapp.me, unless and except as is expressly
                provided in these Terms & Conditions. Any unauthorized use of the material is prohibited.
              </p>
            </motion.div>

            <motion.div variants={itemVariants}>
              <h2 className="text-xl font-semibold mb-3 text-white">Agreement to Arbitrate</h2>
              <p className="mb-3">
                This section applies to any dispute EXCEPT IT DOESN'T INCLUDE A DISPUTE RELATING TO CLAIMS
                FOR INJUNCTIVE OR EQUITABLE RELIEF REGARDING THE ENFORCEMENT OR VALIDITY OF YOUR
                OR Fleetapp.me's INTELLECTUAL PROPERTY RIGHTS. The term "dispute" means any dispute, action, or
                other controversy between you and Fleetapp.me concerning the Services or this agreement, whether in
                contract, warranty, tort, statute, regulation, ordinance, or any other legal or equitable basis. "Dispute" will be
                given the broadest possible meaning allowable under law.
              </p>
            </motion.div>

            <motion.div variants={itemVariants}>
              <h2 className="text-xl font-semibold mb-3 text-white">Notice of Dispute</h2>
              <p className="mb-3">
                In the event of a dispute, you or Fleetapp.me must give the other a Notice of Dispute, which is a written
                statement that sets forth the name, address, and contact information of the party giving it, the facts giving
                rise to the dispute, and the relief requested. You must send any Notice of Dispute via email to:
                support@fleetapp.me. Fleetapp.me will send any Notice of Dispute to you by mail to your address if we have
                it, or otherwise to your email address. You and Fleetapp.me will attempt to resolve any dispute through
                informal negotiation within sixty (60) days from the date the Notice of Dispute is sent. After sixty (60) days,
                you or Fleetapp.me may commence arbitration.
              </p>
            </motion.div>

            <motion.div variants={itemVariants}>
              <h2 className="text-xl font-semibold mb-3 text-white">Binding Arbitration</h2>
              <p className="mb-3">
                If you and Fleetapp.me don't resolve any dispute by informal negotiation, any other effort to resolve the
                dispute will be conducted exclusively by binding arbitration as described in this section. You are giving up the
                right to litigate (or participate in as a party or class member) all disputes in court before a judge or jury. The
                dispute shall be settled by binding arbitration in accordance with the commercial arbitration rules of the
                American Arbitration Association. Either party may seek any interim or preliminary injunctive relief from any
                court of competent jurisdiction, as necessary to protect the party's rights or property pending the completion
                of arbitration. Any and all legal, accounting, and other costs, fees, and expenses incurred by the prevailing
                party shall be borne by the non-prevailing party.
              </p>
            </motion.div>

            <motion.div variants={itemVariants}>
              <h2 className="text-xl font-semibold mb-3 text-white">Submissions and Privacy</h2>
              <p className="mb-3">
                In the event that you submit or post any ideas, creative suggestions, designs, photographs, information,
                advertisements, data or proposals, including ideas for new or improved products, services, features,
                technologies or promotions, you expressly agree that such submissions will automatically be treated as
                non-confidential and non-proprietary and will become the sole property of Fleetapp.me without any
                compensation or credit to you whatsoever. Fleetapp.me and its affiliates shall have no obligations with
                respect to such submissions or posts and may use the ideas contained in such submissions or posts for any
                purposes in any medium in perpetuity, including, but not limited to, developing, manufacturing, and marketing
                products and services using such ideas.
              </p>
            </motion.div>

            <motion.div variants={itemVariants}>
              <h2 className="text-xl font-semibold mb-3 text-white">Promotions</h2>
              <p className="mb-3">
                Fleetapp.me may, from time to time, include contests, promotions, sweepstakes, or other activities
                ("Promotions") that require you to submit material or information concerning yourself. Please note that all
                Promotions may be governed by separate rules that may contain certain eligibility requirements, such as
                restrictions as to age and geographic location. You are responsible to read all Promotions rules to determine
                whether or not you are eligible to participate. If you enter any Promotion, you agree to abide by and to
                comply with all Promotions Rules.
              </p>
              <p>
                Additional terms and conditions may apply to purchases of goods or services on or through the Services,
                which terms and conditions are made a part of this Agreement by this reference.
              </p>
            </motion.div>

            <motion.div variants={itemVariants}>
              <h2 className="text-xl font-semibold mb-3 text-white">Typographical Errors</h2>
              <p className="mb-3">
                In the event a product and/or service is listed at an incorrect price or with incorrect information due to
                typographical error, we shall have the right to refuse or cancel any orders placed for the product and/or
                service listed at the incorrect price. We shall have the right to refuse or cancel any such order whether or not
                the order has been confirmed and your credit card charged. If your credit card has already been charged for
                the purchase and your order is canceled, we shall immediately issue a credit to your credit card account or
                other payment account in the amount of the charge.
              </p>
            </motion.div>

            <motion.div variants={itemVariants}>
              <h2 className="text-xl font-semibold mb-3 text-white">Miscellaneous</h2>
              <p className="mb-3">
                If for any reason a court of competent jurisdiction finds any provision or portion of these Terms & Conditions
                to be unenforceable, the remainder of these Terms & Conditions will continue in full force and effect. Any
                waiver of any provision of these Terms & Conditions will be effective only if in writing and signed by an
                authorized representative of Fleetapp.me. Fleetapp.me will be entitled to injunctive or other equitable relief
                (without the obligations of posting any bond or surety) in the event of any breach or anticipatory breach by
                you. Fleetapp.me operates and controls the Fleetapp.me Service from its offices in Lebanon. The Service is
                not intended for distribution to or use by any person or entity in any jurisdiction or country where such
                distribution or use would be contrary to law or regulation. Accordingly, those persons who choose to access
                the Fleetapp.me Service from other locations do so on their own initiative and are solely responsible for
                compliance with local laws, if and to the extent local laws are applicable. These Terms & Conditions (which
                include and incorporate the Fleetapp.me Privacy Policy) contains the entire understanding, and supersedes
                all prior understandings, between you and Fleetapp.me concerning its subject matter, and cannot be
                changed or modified by you. The section headings used in this Agreement are for convenience only and will
                not be given any legal import.
              </p>
            </motion.div>

            <motion.div variants={itemVariants}>
              <h2 className="text-xl font-semibold mb-3 text-white">Disclaimer</h2>
              <p className="mb-3">
                Fleetapp.me is not responsible for any content, code or any other imprecision.
              </p>
              <p className="mb-3">
                Fleetapp.me does not provide warranties or guarantees.
              </p>
              <p className="mb-3">
                In no event shall Fleetapp.me be liable for any special, direct, indirect, consequential, or incidental damages
                or any damages whatsoever, whether in an action of contract, negligence or other tort, arising out of or in
                connection with the use of the Service or the contents of the Service. The Company reserves the right to
                make additions, deletions, or modifications to the contents on the Service at any time without prior notice.
              </p>
              <p>
                The Fleetapp.me Service and its contents are provided "as is" and "as available" without any warranty or
                representations of any kind, whether express or implied. Fleetapp.me is a distributor and not a publisher of
                the content supplied by third parties; as such, Fleetapp.me exercises no editorial control over such content
                and makes no warranty or representation as to the accuracy, reliability or currency of any information,
                content, service or merchandise provided through or accessible via the Fleetapp.me Service. Without limiting
                the foregoing, Fleetapp.me specifically disclaims all warranties and representations in any content
                transmitted on or in connection with the Fleetapp.me Service or on sites that may appear as links on the
                Fleetapp.me Service, or in the products provided as a part of, or otherwise in connection with, the
                Fleetapp.me Service, including without limitation any warranties of merchantability, fitness for a particular
                purpose or non-infringement of third party rights. No oral advice or written information given by Fleetapp.me
                or any of its affiliates, employees, officers, directors, agents, or the like will create a warranty. Price and
                availability information is subject to change without notice. Without limiting the foregoing, Fleetapp.me does
                not warrant that the Fleetapp.me Service will be uninterrupted, uncorrupted, timely, or error-free.
              </p>
            </motion.div>

            <motion.div variants={itemVariants}>
              <h2 className="text-xl font-semibold mb-3 text-white">Contact Us</h2>
              <p className="mb-3">
                Don't hesitate to contact us if you have any questions.
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