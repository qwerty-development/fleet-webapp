"use client";
import React from "react";
import { motion } from "framer-motion";
import Link from "next/link";

const Hero: React.FC = () => {
  return (
    <div
      className="relative flex justify-center   min-h-screen bg-cover bg-center"
      style={{
        backgroundImage: `url('/landing page/pexels-lynxexotics-377ww0875.jpg')`,
      }}
    >
      <div className="absolute inset-0 bg-black opacity-40"></div>

      <div className="relative w-11/12 xl:w-9/12 flex justify-center  items-center   flex-col lg:flex-row">
        <motion.div
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          transition={{ duration: 0.6 }}
          className="w-full  flex  justify-center   text-center md:text-left lg:pr-12"
        >
          <div className="   w-fit ">
            <div className="relative  w-full flex justify-center  mb-6">
              <h1 className="text-8xl md:text-9xl scale-125 md:scale-150  font-black tracking-tighter text-white">
                <span className="relative  inline-block">
                  <span className="relative z-10">F</span>
                  <span className="absolute top-0 left-0 z-0 text-accent blur-sm opacity-80">
                    F
                  </span>
                </span>
                <span className="relative inline-block">
                  <span className="relative z-10">L</span>
                  <span className="absolute top-0 left-0 z-0 text-accent blur-sm opacity-80">
                    L
                  </span>
                </span>
                <span className="relative inline-block">
                  <span className="relative z-10">E</span>
                  <span className="absolute top-0 left-0 z-0 text-accent blur-sm opacity-80">
                    E
                  </span>
                </span>
                <span className="relative inline-block">
                  <span className="relative z-10">E</span>
                  <span className="absolute top-0 left-0 z-0 text-accent blur-sm opacity-80">
                    E
                  </span>
                </span>
                <span className="relative inline-block">
                  <span className="relative z-10">T</span>
                  <span className="absolute top-0 left-0 z-0 text-accent blur-sm opacity-80">
                    T
                  </span>
                </span>
              </h1>
            </div>

            <div className="hidden md:block mt-4 max-w-2xl mx-auto md:mx-0">
              <p className="text-2xl md:text-3xl text-white/90 text-center font-light">
                Reimagining how you{" "}
                <span className="text-accent font-bold bg-white/10 rounded-md p-1">
                  discover
                </span>{" "}
                and
                <br />
                <span className="text-accent font-bold bg-white/10 rounded-md p-1">
                  connect with
                </span>{" "}
                automotive experiences
              </p>
            </div>
            <div className="block md:hidden mt-4 max-w-2xl mx-auto md:mx-0">
              <p className="text-2xl md:text-3xl text-white/90 text-center font-light">
                Reimagining how you discover and connect with automotive
                experiences
              </p>
            </div>
            {/* <div className="mt-8">
              <Link href="/home" passHref>
                <motion.span
                  whileHover={{ scale: 1.03 }}
                  transition={{ duration: 0.2 }}
                  className="inline-block mt-0 bg-accent hover:bg-accent-dark transition-colors duration-300 text-white font-bold rounded-xl px-8 py-5 cursor-pointer"
                >
                  Start Browsing
                </motion.span>
              </Link>
            </div> */}
          </div>
        </motion.div>
      </div>
    </div>
  );
};

export default Hero;
