import Document, { Html, Head, Main, NextScript } from 'next/document';

class MyDocument extends Document {
  /**
   * Renders the custom HTML document structure for server-side rendering.
   * This method extends Next.js's default Document to allow for custom
   * `<html>` and `<body>` tags, and injection of external scripts/stylesheets.
   *
   * It includes CDN links for Font Awesome for icons and AOS (Animate On Scroll)
   * for scroll-based animations, along with an initialization script for AOS.
   *
   * @returns {JSX.Element} The custom document structure.
   */
  render(): JSX.Element {
    return (
      <Html lang="de" className="dark"> {/* Set language to German and default to dark mode */}
        <Head>
          {/* Favicon - Consider adding a real favicon.ico or a complete set */}
          {/* <link rel="icon" href="/favicon.ico" /> */}

          {/* Font Awesome CDN for icons */}
          <link
            rel="stylesheet"
            href="https://cdnjs.cloudflare.com/ajax/libs/font-awesome/6.5.2/css/all.min.css"
            integrity="sha512-SnH5WK+bZxgPHs44uWIX+LLJAJ9/2PkPKZ5QiAj6Ta86w+fsb2TkcmfRyVX3pBnMFcV7oQPJkl9QevSCWr3W6A=="
            crossOrigin="anonymous"
            referrerPolicy="no-referrer"
          />

          {/* AOS (Animate On Scroll) CSS */}
          <link href="https://unpkg.com/aos@2.3.1/dist/aos.css" rel="stylesheet" />

          {/* Add any other meta tags or external links here that should be in the <head> */}
        </Head>
        <body>
          <Main /> {/* This is where Next.js injects your application */}
          <NextScript /> {/* This is where Next.js injects the scripts for your app */}

          {/* AOS (Animate On Scroll) JavaScript */}
          <script src="https://unpkg.com/aos@2.3.1/dist/aos.js"></script>
          {/* Initialize AOS after the script has loaded */}
          <script dangerouslySetInnerHTML={{ __html: `AOS.init();` }} />
        </body>
      </Html>
    );
  }
}

export default MyDocument;