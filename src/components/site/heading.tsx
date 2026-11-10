import { cn } from "@/lib/utils";

type HeadingSize = "display" | "h1" | "h2" | "h3";
type HeadingTag = "h1" | "h2" | "h3" | "h4" | "p";

type HeadingProps = React.HTMLAttributes<HTMLHeadingElement> & {
  as?: HeadingTag;
  size?: HeadingSize;
};

const defaultTag: Record<HeadingSize, HeadingTag> = {
  display: "h1",
  h1: "h2",
  h2: "h2",
  h3: "h3",
};

const sizeClass: Record<HeadingSize, string> = {
  display: "text-display",
  h1: "text-h1",
  h2: "text-h2",
  h3: "text-h3",
};

/**
 * Headline with the Superside-style serif accent. Wrap the accent words in
 * <em>: `<Heading>Your <em>creative</em> partner</Heading>`.
 */
export function Heading({
  as,
  size = "h1",
  className,
  ...props
}: HeadingProps) {
  const Tag = as ?? defaultTag[size];
  return (
    <Tag
      className={cn(
        "dx-heading font-normal text-balance",
        sizeClass[size],
        className,
      )}
      {...props}
    />
  );
}
