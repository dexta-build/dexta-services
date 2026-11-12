import { Fragment } from "react";

/**
 * Renders "Your *creative* partner" as "Your <em>creative</em> partner".
 * Inside a <Heading>, <em> becomes the Instrument Serif italic accent.
 * Plain text only: no HTML is ever injected.
 */
export function AccentText({ text }: { text: string }) {
  const parts = text.split(/\*([^*]+)\*/g);
  return (
    <>
      {parts.map((part, i) =>
        i % 2 === 1 ? (
          <em key={i}>{part}</em>
        ) : (
          <Fragment key={i}>{part}</Fragment>
        ),
      )}
    </>
  );
}
