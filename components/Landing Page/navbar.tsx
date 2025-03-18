'use client'

import { useState, useEffect, MouseEvent } from 'react'
import { Dialog, DialogPanel } from '@headlessui/react'
import { Bars3Icon, XMarkIcon } from '@heroicons/react/24/outline'
import Link from 'next/link'
import { useAuth } from '@/utils/AuthContext'
import { useGuestUser } from '@/utils/GuestUserContext'
import { useRouter } from 'next/navigation'

const navigation = [
  { name: 'Hero Section', href: '#hero' },
  { name: 'About', href: '#about' },
  { name: 'Our App', href: '#app' },
  { name: 'Contact', href: '#contact' },
]

export default function Navbar() {
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false)
  const [showNavbar, setShowNavbar] = useState(false)

  const { isSignedIn, user, profile, signOut } = useAuth()
  const { isGuest, clearGuestMode } = useGuestUser()
  const router = useRouter()

  useEffect(() => {
    const handleScroll = () => {
      // Show navbar after scrolling 100px
      if (window.scrollY > 100) {
        setShowNavbar(true)
      } else {
        setShowNavbar(false)
      }
    }

    window.addEventListener('scroll', handleScroll)
    return () => {
      window.removeEventListener('scroll', handleScroll)
    }
  }, [])

  // Handle smooth scrolling when clicking on navigation links
  const scrollToSection = (e: MouseEvent<HTMLAnchorElement>, href: string) => {
    e.preventDefault()

    // Close mobile menu if open
    if (mobileMenuOpen) {
      setMobileMenuOpen(false)
    }

    const targetId = href.replace('#', '')
    const element = document.getElementById(targetId)

    if (element) {
      // Add offset to account for the navbar height
      const navbarHeight = 80
      const offsetTop = element.getBoundingClientRect().top + window.pageYOffset - navbarHeight

      window.scrollTo({
        top: offsetTop,
        behavior: 'smooth'
      })
    }
  }

const handleSignOut = async () => {
  // Do not show sign-out for guest users, but keep the function
  // in case it's called programmatically
  if (isGuest) {
    // Optional: Navigate to home instead of clearing guest mode
    router.push('/home');
    return;
  }

  await signOut();
  router.push('/');
};

  return (
    <header
      className={`fixed top-0 left-0 right-0 z-50 transition-all duration-300 ${
        showNavbar
          ? 'bg-black bg-opacity-80 backdrop-blur-md shadow-lg transform translate-y-0'
          : 'transform -translate-y-full'
      }`}
    >
      <nav aria-label="Global" className="mx-auto flex max-w-7xl items-center justify-between gap-x-6 p-4 lg:px-8">
        <div className="flex lg:flex-1">
          <Link href="/" className="-m-1.5 p-1.5">
            <span className="sr-only">Fleet</span>
            <img alt="Fleet Logo" src="/logo.png" className="h-8 w-auto" />
          </Link>
        </div>
        <div className="hidden lg:flex lg:gap-x-12">
          {navigation.map((item) => (
            <a
              key={item.name}
              href={item.href}
              onClick={(e) => scrollToSection(e, item.href)}
              className="text-sm/6 font-semibold text-foreground hover:text-accent transition-colors duration-300"
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
        className="text-sm/6 font-semibold text-foreground hover:text-accent transition-colors duration-300"
      >
        Dashboard
      </Link>
      <button
        onClick={handleSignOut}
        className="text-sm/6 font-semibold text-foreground hover:text-accent transition-colors duration-300"
      >
        Sign Out
      </button>
    </div>
  ) : isGuest ? (
    // GUEST USER OPTIONS - No sign out button
    <div className="flex items-center space-x-4">
      <Link
        href="/home"
        className="text-sm/6 font-semibold text-foreground hover:text-accent transition-colors duration-300"
      >
        Dashboard
      </Link>
      <Link
        href="/auth/signup"
        className="rounded-md bg-accent px-3 py-2 text-sm font-semibold text-foreground shadow-sm hover:bg-accent-dark transition-colors duration-300"
      >
        Create Account
      </Link>
    </div>
  ) : (
    // NOT SIGNED IN OPTIONS
    <div className="flex items-center space-x-4">
      <Link
        href="/auth/signin"
        className="text-sm/6 font-semibold text-foreground hover:text-accent transition-colors duration-300"
      >
        Log in
      </Link>
      <Link
        href="/auth/signup"
        className="rounded-md bg-accent px-3 py-2 text-sm font-semibold text-foreground shadow-sm hover:bg-accent-dark transition-colors duration-300"
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
            className="-m-2.5 inline-flex items-center justify-center rounded-md p-2.5 text-foreground"
          >
            <span className="sr-only">Open main menu</span>
            <Bars3Icon aria-hidden="true" className="h-6 w-6" />
          </button>
        </div>
      </nav>
      <Dialog open={mobileMenuOpen} onClose={setMobileMenuOpen} className="lg:hidden">
        <div className="fixed inset-0 z-10" />
        <DialogPanel className="fixed inset-y-0 right-0 z-10 w-full overflow-y-auto bg-background px-6 py-6 sm:max-w-sm sm:ring-1 sm:ring-foreground/10">
          <div className="flex items-center gap-x-6">
            <Link href="/" className="-m-1.5 p-1.5">
              <span className="sr-only">Fleet</span>
              <img alt="Fleet Logo" src="/logo.png" className="h-8 w-auto" />
            </Link>
            {!(isSignedIn || isGuest) && (
              <Link
                href="/auth/signup"
                className="ml-auto rounded-md bg-accent px-3 py-2 text-sm font-semibold text-foreground shadow-sm hover:bg-accent-dark"
              >
                Sign up
              </Link>
            )}
            <button
              type="button"
              onClick={() => setMobileMenuOpen(false)}
              className="-m-2.5 rounded-md p-2.5 text-foreground"
            >
              <span className="sr-only">Close menu</span>
              <XMarkIcon aria-hidden="true" className="h-6 w-6" />
            </button>
          </div>
          <div className="mt-6 flow-root">
            <div className="-my-6 divide-y divide-foreground/10">
              <div className="space-y-2 py-6">
                {navigation.map((item) => (
                  <a
                    key={item.name}
                    href={item.href}
                    onClick={(e) => scrollToSection(e, item.href)}
                    className="-mx-3 block rounded-lg px-3 py-2 text-base/7 font-semibold text-foreground hover:bg-black-light"
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
        className="flex items-center px-3 py-2 text-base/7 font-semibold text-foreground hover:bg-black-light rounded-md"
      >
        Dashboard
      </Link>
      <button
        onClick={handleSignOut}
        className="flex w-full items-center px-3 py-2 text-base/7 font-semibold text-foreground hover:bg-black-light rounded-md"
      >
        Sign Out
      </button>
    </>
  ) : isGuest ? (
    // GUEST USER OPTIONS - No sign out button
    <>
      <Link
        href="/home"
        className="flex items-center px-3 py-2 text-base/7 font-semibold text-foreground hover:bg-black-light rounded-md"
      >
        Dashboard
      </Link>
      <Link
        href="/auth/signup"
        className="flex items-center px-3 py-2 text-base/7 font-semibold text-foreground hover:bg-accent/20 rounded-md"
      >
        Create Account
      </Link>
    </>
  ) : (
    // NOT SIGNED IN OPTIONS
    <div className="grid grid-cols-2 gap-2 pt-2">
      <Link
        href="/auth/signin"
        className="text-center px-4 py-2 text-base/7 font-semibold text-foreground hover:text-white border border-gray-700 rounded-lg transition-colors"
      >
        Log in
      </Link>
      <Link
        href="/auth/signup"
        className="text-center px-4 py-2 bg-accent hover:bg-accent-dark text-white rounded-lg transition-colors"
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
  )
}
