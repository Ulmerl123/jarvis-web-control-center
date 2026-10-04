import React, { createContext, useCallback, useEffect, useState, ReactNode } from 'react';
import type { AppProps } from 'next/app';
import Layout from '../components/Layout';
import '../styles/globals.css';
import AOS from 'aos';
import 'aos/dist/aos.css';

/**
 * Shape of the global application context.
 */
export interface AppContextProps {
  /** Current UI theme, either "light" or "dark". */
  theme: 'light' | 'dark';
  /** Toggles the UI theme between light and dark. */
  toggleTheme: () => void;
}

/**
 * Default values for the application context.
 */
const defaultContext: AppContextProps = {
  theme: 'light',
  toggleTheme: () => {
    // no‑op placeholder – will be overridden by provider
  },
};

/**
 * React context that holds global UI state (e.g., theme).
 */
export const AppContext = createContext<AppContextProps>(defaultContext);

/**
 * Provider component that supplies the global application context to the component tree.
 *
 * @param children - React nodes that will receive the context.
 */
export const AppProvider: React.FC<{ children: ReactNode }> = ({ children }) => {
  const [theme, setTheme] = useState<'light' | 'dark'>('light');

  const toggleTheme = useCallback(() => {
    setTheme((prev) => (prev === 'light' ? 'dark' : 'light'));
  }, []);

  // Persist theme preference in localStorage (client‑side only)
  useEffect(() => {
    try {
      const stored = window.localStorage.getItem('jarvis-theme');
      if (stored === 'light' || stored === 'dark') {
        setTheme(stored);
      }
    } catch {
      // Silently ignore storage errors (e.g., privacy mode)
    }
  }, []);

  useEffect(() => {
    try {
      window.localStorage.setItem('jarvis-theme', theme);
    } catch {
      // ignore write errors
    }
    document.documentElement.classList.toggle('dark', theme === 'dark');
  }, [theme]);

  return <AppContext.Provider value={{ theme, toggleTheme }}>{children}</AppContext.Provider>;
};

/**
 * Custom Next.js App component.
 *
 * This component wraps every page with the global layout, applies Tailwind CSS,
 * initializes third‑party libraries (AOS), and provides the global context.
 *
 * @param Component - The active page component.
 * @param pageProps - Props preloaded for the page.
 */
const MyApp: React.FC<AppProps> = ({ Component, pageProps }) => {
  // Initialise AOS (Animate On Scroll) once on client side
  useEffect(() => {
    try {
      AOS.init({
        // Global settings – feel free to adjust
        offset: 120,
        duration: 600,
        easing: 'ease-in-out',
        once: true,
        mirror: false,
      });
    } catch (error) {
      // eslint-disable-next-line no-console
      console.error('Failed to initialise AOS:', error);
    }
  }, []);

  // Re‑refresh AOS on route changes (Next.js router events)
  useEffect(() => {
    const handleRouteChange = () => {
      try {
        AOS.refreshHard();
      } catch (error) {
        // eslint-disable-next-line no-console
        console.error('AOS refresh error:', error);
      }
    };

    // Next.js router is only available on the client
    // eslint-disable-next-line @typescript-eslint/no-var-requires
    const { useRouter } = require('next/router');
    const router = useRouter();

    router.events.on('routeChangeComplete', handleRouteChange);
    return () => {
      router.events.off('routeChangeComplete', handleRouteChange);
    };
  }, []);

  return (
    <AppProvider>
      <Layout>
        <Component {...pageProps} />
      </Layout>
    </AppProvider>
  );
};

export default MyApp;