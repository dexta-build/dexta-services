import localFont from "next/font/local";
import { Instrument_Serif } from "next/font/google";

/**
 * Mont: primary typeface for the public site.
 * Only the weights the site uses are loaded: Regular (400), Bold (700) and
 * Black (900). They are preloaded so headlines paint in Mont straight away
 * (no late font swap, which hurt Largest Contentful Paint and caused layout
 * shift). Other weights in src/assets/fonts stay unused until a design
 * needs them; italics on the site use Instrument Serif.
 */
export const mont = localFont({
  src: [
    {
      path: "../../assets/fonts/Mont-Regular.woff2",
      weight: "400",
      style: "normal",
    },
    {
      path: "../../assets/fonts/Mont-Bold.woff2",
      weight: "700",
      style: "normal",
    },
    {
      path: "../../assets/fonts/Mont-Black.woff2",
      weight: "900",
      style: "normal",
    },
  ],
  variable: "--font-mont-local",
  display: "swap",
  preload: true,
  fallback: ["Helvetica Neue", "Arial", "sans-serif"],
  adjustFontFallback: "Arial",
});

/** Instrument Serif: italic headline accents and big stat numerals. */
export const instrumentSerif = Instrument_Serif({
  subsets: ["latin"],
  weight: "400",
  style: ["normal", "italic"],
  variable: "--font-instrument-serif",
  display: "swap",
});
