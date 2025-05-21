"use client";

import { useState, useEffect, MouseEvent } from "react";
import { Dialog, DialogPanel } from "@headlessui/react";
import { Bars3Icon, XMarkIcon } from "@heroicons/react/24/outline";
import Link from "next/link";
import { useAuth } from "@/utils/AuthContext";
import { useGuestUser } from "@/utils/GuestUserContext";
import { useRouter } from "next/navigation";

const navigation:any = [
];

export default function Navbar() {
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false);
  const [scrolled, setScrolled] = useState(false);

  const { isSignedIn, user, profile, signOut } = useAuth();
  const { isGuest, clearGuestMode } = useGuestUser();
  const router = useRouter();

  useEffect(() => {
    const handleScroll = () => {
      // Change navbar color after scrolling 100px
      if (window.scrollY > 100) {
        setScrolled(true);
      } else {
        setScrolled(false);
      }
    };

    window.addEventListener('scroll', handleScroll);
    return () => {
      window.removeEventListener('scroll', handleScroll);
    };
  }, []);

  // Handle smooth scrolling when clicking on navigation links
  const scrollToSection = (e: MouseEvent<HTMLAnchorElement>, href: string) => {
    e.preventDefault();

    // Close mobile menu if open
    if (mobileMenuOpen) {
      setMobileMenuOpen(false);
    }

    const targetId = href.replace("#", "");
    const element = document.getElementById(targetId);

    if (element) {
      // Add offset to account for the navbar height
      const navbarHeight = 80;
      const offsetTop =
        element.getBoundingClientRect().top + window.pageYOffset - navbarHeight;

      window.scrollTo({
        top: offsetTop,
        behavior: "smooth",
      });
    }
  };

  const handleSignOut = async () => {
    // Do not show sign-out for guest users, but keep the function
    // in case it's called programmatically
    if (isGuest) {
      // Optional: Navigate to home instead of clearing guest mode
      router.push("/home");
      return;
    }

    await signOut();
    router.push("/");
  };

  return (
    <header
      className={`fixed top-0 left-0 right-0 z-50 transition-all duration-300 ${
        scrolled 
          ? "bg-white bg-opacity-95 backdrop-blur-lg shadow-lg" 
          : "bg-black bg-opacity-80 backdrop-blur-md"
      }`}
    >
      <nav
        aria-label="Global"
        className="mx-auto flex max-w-7xl items-center justify-between gap-x-6 p-4 lg:px-8"
      >
        <div className="flex lg:flex-1">
          <Link href="/" className="-m-1.5 p-1.5">
            <span className="sr-only">Fleet</span>
            {/* Use different logo based on scroll state */}
            {scrolled ? (
              <img alt="Fleet Logo" src="/logo-dark.png" className="h-8 w-auto transition-all duration-300" />
            ) : (
              <img alt="Fleet Logo" src="/logo.png" className="h-8 w-auto transition-all duration-300" />
            )}
          </Link>
        </div>
        <div className="hidden lg:flex lg:gap-x-12">
          {navigation.map((item:any) => (
            <a
              key={item.name}
              href={item.href}
              onClick={(e) => scrollToSection(e, item.href)}
              className={`text-sm/6 font-semibold transition-colors duration-300 ${
                scrolled ? "text-black hover:text-accent" : "text-white hover:text-accent"
              }`}
            >
              {item.name}
            </a>
          ))}
        </div>

        <div className="flex flex-1 items-center justify-end gap-x-6">
          {isSignedIn ? (
            // SIGNED-IN USER OPTIONS
            <div className="flex items-center space-x-4">
              <Link
                href="/home"
                className={`text-sm/6 font-semibold transition-colors duration-300 ${
                  scrolled ? "text-black hover:text-accent" : "text-white hover:text-accent"
                }`}
              >
                Dashboard
              </Link>
              <button
                onClick={handleSignOut}
                className={`text-sm/6 font-semibold transition-colors duration-300 ${
                  scrolled ? "text-black hover:text-accent" : "text-white hover:text-accent"
                }`}
              >
                Sign Out
              </button>
            </div>
          ) : isGuest ? (
            // GUEST USER OPTIONS - No sign out button
            <div className="flex items-center space-x-4">
              <Link
                href="/home"
                className={`text-sm/6 font-semibold transition-colors duration-300 ${
                  scrolled ? "text-black hover:text-accent" : "text-white hover:text-accent"
                }`}
              >
                Dashboard
              </Link>
              <Link
                href="/auth/signup"
                className="rounded-md bg-accent px-3 py-2 text-sm font-semibold text-white shadow-sm hover:bg-accent/80 transition-colors duration-300"
              >
                Create Account
              </Link>
            </div>
          ) : (
            // NOT SIGNED IN OPTIONS
            <div className="flex items-center space-x-4">
              <Link
                href="/auth/signin"
                className={`text-sm/6 font-semibold transition-colors duration-300 ${
                  scrolled ? "text-black hover:text-accent" : "text-white hover:text-accent"
                }`}
              >
                Log in
              </Link>
              <Link
                href="/auth/signup"
                className="rounded-md bg-accent px-3 py-2 text-sm font-semibold text-white shadow-sm hover:bg-accent/80 transition-colors duration-300"
              >
                Sign up
              </Link>
            </div>
          )}
        </div>
        <div className="flex lg:hidden">
          <button
            type="button"
            onClick={() => setMobileMenuOpen(true)}
            className={`-m-2.5 inline-flex items-center justify-center rounded-md p-2.5 ${
              scrolled ? "text-black" : "text-white"
            }`}
          >
            <span className="sr-only">Open main menu</span>
            <Bars3Icon aria-hidden="true" className="h-6 w-6" />
          </button>
        </div>
      </nav>
      <Dialog
        open={mobileMenuOpen}
        onClose={setMobileMenuOpen}
        className="lg:hidden"
      >
        <div className="fixed inset-0 z-10" />
        <DialogPanel className={`fixed inset-y-0 right-0 z-10 w-full overflow-y-auto px-6 py-6 sm:max-w-sm sm:ring-1 sm:ring-gray-700/10 ${
          scrolled ? "bg-white" : "bg-black"
        }`}>
          <div className="flex items-center gap-x-6">
            <Link href="/" className="-m-1.5 p-1.5">
              <span className="sr-only">Fleet</span>
              {/* Use different logo in mobile menu based on scroll state */}
              {scrolled ? (
                <img alt="Fleet Logo" src="/logo-dark.png" className="h-8 w-auto" />
              ) : (
                <img alt="Fleet Logo" src="/logo.png" className="h-8 w-auto" />
              )}
            </Link>
            {!(isSignedIn || isGuest) && (
              <Link
                href="/auth/signup"
                className="ml-auto rounded-md bg-accent px-3 py-2 text-sm font-semibold text-white shadow-sm hover:bg-accent/80"
              >
                Sign up
              </Link>
            )}
            <button
              type="button"
              onClick={() => setMobileMenuOpen(false)}
              className={`-m-2.5 rounded-md p-2.5 ${
                scrolled ? "text-black" : "text-white"
              }`}
            >
              <span className="sr-only">Close menu</span>
              <XMarkIcon aria-hidden="true" className="h-6 w-6" />
            </button>
          </div>
          <div className="mt-6 flow-root">
            <div className={`-my-6 divide-y ${
              scrolled ? "divide-gray-200" : "divide-gray-700"
            }`}>
              <div className="space-y-2 py-6">
                {navigation.map((item:any) => (
                  <a
                    key={item.name}
                    href={item.href}
                    onClick={(e) => scrollToSection(e, item.href)}
                    className={`-mx-3 block rounded-lg px-3 py-2 text-base/7 font-semibold hover:bg-opacity-10 ${
                      scrolled 
                        ? "text-black hover:bg-gray-200" 
                        : "text-white hover:bg-white"
                    }`}
                  >
                    {item.name}
                  </a>
                ))}
              </div>
              <div className="py-6">
                {isSignedIn ? (
                  // SIGNED-IN USER OPTIONS
                  <>
                    <Link
                      href="/home"
                      className={`flex items-center px-3 py-2 text-base/7 font-semibold rounded-md hover:bg-opacity-10 ${
                        scrolled 
                          ? "text-black hover:bg-gray-200" 
                          : "text-white hover:bg-white"
                      }`}
                    >
                      Dashboard
                    </Link>
                    <button
                      onClick={handleSignOut}
                      className={`flex w-full items-center px-3 py-2 text-base/7 font-semibold rounded-md hover:bg-opacity-10 ${
                        scrolled 
                          ? "text-black hover:bg-gray-200" 
                          : "text-white hover:bg-white"
                      }`}
                    >
                      Sign Out
                    </button>
                  </>
                ) : isGuest ? (
                  // GUEST USER OPTIONS - No sign out button
                  <>
                    <Link
                      href="/home"
                      className={`flex items-center px-3 py-2 text-base/7 font-semibold rounded-md hover:bg-opacity-10 ${
                        scrolled 
                          ? "text-black hover:bg-gray-200" 
                          : "text-white hover:bg-white"
                      }`}
                    >
                      Dashboard
                    </Link>
                    <Link
                      href="/auth/signup"
                      className="flex items-center px-3 py-2 text-base/7 font-semibold text-white bg-accent hover:bg-accent/80 rounded-md mt-2"
                    >
                      Create Account
                    </Link>
                  </>
                ) : (
                  // NOT SIGNED IN OPTIONS
                  <div className="grid grid-cols-2 gap-2 pt-2">
                    <Link
                      href="/auth/signin"
                      className={`text-center px-4 py-2 text-base/7 font-semibold border rounded-lg transition-colors ${
                        scrolled 
                          ? "text-black border-gray-300 hover:bg-gray-100" 
                          : "text-white border-gray-600 hover:bg-white/10"
                      }`}
                    >
                      Log in
                    </Link>
                    <Link
                      href="/auth/signup"
                      className="text-center px-4 py-2 bg-accent hover:bg-accent/80 text-white rounded-lg transition-colors"
                    >
                      Sign up
                    </Link>
                  </div>
                )}
              </div>
            </div>
          </div>
        </DialogPanel>
      </Dialog>
    </header>
  );
}