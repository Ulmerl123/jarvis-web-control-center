import React, { useState, useEffect, useCallback, ReactNode } from 'react';
import Link from 'next/link';
import { useRouter } from 'next/router';
import Head from 'next/head';

/**
 * Navigation item definition.
 */
interface NavItem {
  /** Display label */
  label: string;
  /** URL path */
  href: string;
  /** Font Awesome icon class (e.g., "fa-solid fa-house") */
  icon: string;
}

/**
 * Props for the Layout component.
 */
interface LayoutProps {
  /** Page title – will be set in the <title> tag */
  title?: string;
  /** Children elements rendered inside the layout */
  children: ReactNode;
}

/**
 * Layout component providing a consistent header, navigation and page wrapper.
 *
 * @param {LayoutProps} props - Component props.
 * @returns {JSX.Element} Rendered layout.
 */
export default function Layout({ title = 'JARVIS Dashboard', children }: LayoutProps): JSX.Element {
  const router = useRouter();
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false);
  const [isMounted, setIsMounted] = useState(false);

  // Define navigation items
  const navItems: NavItem[] = [
    { label: 'Dashboard', href: '/', icon: 'fa-solid fa-house' },
    { label: 'AI Core', href: '/ai-core', icon: 'fa-solid fa-brain' },
    { label: 'Agents', href: '/agents', icon: 'fa-solid fa-robot' },
    { label: 'Tasks', href: '/tasks', icon: 'fa-solid fa-list-check' },
    { label: 'Computer', href: '/computer', icon: 'fa-solid fa-desktop' },
    { label: 'Files', href: '/files', icon: 'fa-solid fa-folder-open' },
    { label: 'Automations', href: '/automations', icon: 'fa-solid fa-cogs' },
    { label: 'Settings', href: '/settings', icon: 'fa-solid fa-gear' },
  ];

  // Ensure client‑side only effects (e.g., localStorage) run after mount
  useEffect(() => {
    setIsMounted(true);
  }, []);

  // Close mobile menu on route change
  useEffect(() => {
    const handleRouteChange = () => setMobileMenuOpen(false);
    router.events.on('routeChangeComplete', handleRouteChange);
    return () => {
      router.events.off('routeChangeComplete', handleRouteChange);
    };
  }, [router.events]);

  const toggleMobileMenu = useCallback(() => {
    setMobileMenuOpen((prev) => !prev);
  }, []);

  const renderNavItem = (item: NavItem) => {
    const isActive = router.pathname === item.href;
    const baseClasses =
      'flex items-center px-3 py-2 rounded-md text-sm font-medium transition-colors';
    const activeClasses = isActive
      ? 'bg-indigo-700 text-white'
      : 'text-gray-300 hover:bg-indigo-600 hover:text-white';

    return (
      <Link key={item.href} href={item.href} legacyBehavior>
        <a className={`${baseClasses} ${activeClasses}`} aria-current={isActive ? 'page' : undefined}>
          <i className={`${item.icon} mr-2`}></i>
          {item.label}
        </a>
      </Link>
    );
  };

  return (
    <>
      <Head>
        <title>{title}</title>
        {/* Preload Font Awesome for faster icon rendering */}
        <link
          rel="preload"
          href="https://cdnjs.cloudflare.com/ajax/libs/font-awesome/6.5.2/webfonts/fa-solid-900.woff2"
          as="font"
          crossOrigin="anonymous"
        />
      </Head>

      <div className="min-h-screen bg-gray-900 text-gray-100 flex flex-col">
        {/* Header */}
        <header className="bg-gray-800 shadow-md">
          <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
            <div className="flex justify-between h-16 items-center">
              {/* Logo / Brand */}
              <div className="flex-shrink-0 flex items-center">
                <Link href="/" legacyBehavior>
                  <a className="text-xl font-bold text-indigo-400 hover:text-indigo-300">
                    JARVIS
                  </a>
                </Link>
              </div>

              {/* Desktop Navigation */}
              <nav className="hidden md:flex space-x-4">{navItems.map(renderNavItem)}</nav>

              {/* Mobile menu button */}
              <div className="md:hidden flex items-center">
                <button
                  type="button"
                  className="inline-flex items-center justify-center p-2 rounded-md text-gray-400 hover:text-white hover:bg-gray-700 focus:outline-none focus:ring-2 focus:ring-inset focus:ring-indigo-500"
                  aria-controls="mobile-menu"
                  aria-expanded={mobileMenuOpen}
                  onClick={toggleMobileMenu}
                >
                  <span className="sr-only">Open main menu</span>
                  {mobileMenuOpen ? (
                    <i className="fa-solid fa-xmark" aria-hidden="true"></i>
                  ) : (
                    <i className="fa-solid fa-bars" aria-hidden="true"></i>
                  )}
                </button>
              </div>
            </div>
          </div>

          {/* Mobile Navigation */}
          {mobileMenuOpen && (
            <nav className="md:hidden" id="mobile-menu">
              <div className="px-2 pt-2 pb-3 space-y-1">{navItems.map(renderNavItem)}</div>
            </nav>
          )}
        </header>

        {/* Main Content */}
        <main className="flex-1 overflow-y-auto py-6">
          <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">{children}</div>
        </main>

        {/* Footer (optional) */}
        <footer className="bg-gray-800 py-4">
          <div className="max-w-7xl mx-auto text-center text-gray-400 text-sm">
            © {new Date().getFullYear()} JARVIS – All rights reserved.
          </div>
        </footer>
      </div>
    </>
  );
}