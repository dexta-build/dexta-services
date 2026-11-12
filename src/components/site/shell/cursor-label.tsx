"use client";

import { useEffect, useState } from "react";
import {
  AnimatePresence,
  motion,
  useMotionValue,
  useReducedMotion,
  useSpring,
} from "motion/react";

/**
 * Desktop-only cursor bubble. Any element with `data-cursor="View"` (or any
 * label) shows a round label that follows the pointer while hovered, like
 * Superside's "Close" bubble on expanded work tiles. The normal cursor is
 * left alone everywhere else.
 */
export function CursorLabel() {
  const [enabled, setEnabled] = useState(false);
  const [label, setLabel] = useState<string | null>(null);
  const reduce = useReducedMotion();
  const x = useMotionValue(-100);
  const y = useMotionValue(-100);
  const springX = useSpring(x, { stiffness: 500, damping: 40, mass: 0.4 });
  const springY = useSpring(y, { stiffness: 500, damping: 40, mass: 0.4 });

  useEffect(() => {
    const query = window.matchMedia("(hover: hover) and (pointer: fine)");
    const update = () => setEnabled(query.matches);
    update();
    query.addEventListener("change", update);
    return () => query.removeEventListener("change", update);
  }, []);

  useEffect(() => {
    if (!enabled) return;
    const onMove = (e: PointerEvent) => {
      x.set(e.clientX);
      y.set(e.clientY);
      const target = (e.target as Element | null)?.closest?.("[data-cursor]");
      setLabel(target ? target.getAttribute("data-cursor") || null : null);
    };
    const onLeave = () => setLabel(null);
    // A click usually opens or changes something (a modal, a page), so hide
    // the bubble until the pointer moves again.
    const onDown = () => setLabel(null);
    window.addEventListener("pointermove", onMove, { passive: true });
    window.addEventListener("pointerdown", onDown, { passive: true });
    document.documentElement.addEventListener("pointerleave", onLeave);
    return () => {
      window.removeEventListener("pointermove", onMove);
      window.removeEventListener("pointerdown", onDown);
      document.documentElement.removeEventListener("pointerleave", onLeave);
    };
  }, [enabled, x, y]);

  if (!enabled) return null;

  return (
    <AnimatePresence>
      {label && (
        <motion.div
          aria-hidden
          initial={{ scale: 0.4, opacity: 0 }}
          animate={{ scale: 1, opacity: 1 }}
          exit={{ scale: 0.4, opacity: 0 }}
          transition={{ duration: 0.2, ease: [0.16, 1, 0.3, 1] }}
          style={{
            x: reduce ? x : springX,
            y: reduce ? y : springY,
          }}
          className="pointer-events-none fixed top-0 left-0 z-[200] -mt-10 -ml-10 flex size-20 items-center justify-center rounded-full bg-brand-cyan font-[family-name:var(--font-mont)] text-sm font-bold text-royal shadow-lg"
        >
          {label}
        </motion.div>
      )}
    </AnimatePresence>
  );
}
