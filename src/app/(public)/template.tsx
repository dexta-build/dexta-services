"use client";

import { useEffect, useState } from "react";
import { motion, useReducedMotion } from "motion/react";

/** True once the visitor has moved between pages in this tab. */
let hasNavigated = false;

/**
 * Page transition: templates remount on every navigation, so each page
 * fades in. Opacity only: a transform here would break position: fixed
 * and sticky elements inside pages.
 *
 * The first page load is not faded: it renders visible straight from the
 * server, so the main content can paint before JavaScript loads (much
 * better Largest Contentful Paint). Later navigations fade in.
 */
export default function PublicTemplate({
  children,
}: {
  children: React.ReactNode;
}) {
  const reduce = useReducedMotion();
  const [fade] = useState(() => hasNavigated);

  useEffect(() => {
    hasNavigated = true;
  }, []);

  return (
    <motion.div
      initial={fade && !reduce ? { opacity: 0 } : false}
      animate={{ opacity: 1 }}
      transition={{ duration: 0.45, ease: [0.16, 1, 0.3, 1] }}
    >
      {children}
    </motion.div>
  );
}
