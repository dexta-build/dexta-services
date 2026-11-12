import {
  Globe2,
  HeartHandshake,
  Lightbulb,
  ShieldCheck,
  Sparkles,
  Target,
  TrendingUp,
  Zap,
  type LucideIcon,
} from "lucide-react";
import type { AboutIconKey } from "@/lib/about-defaults";

const ICONS: Record<AboutIconKey, LucideIcon> = {
  ZAP: Zap,
  GLOBE: Globe2,
  SPARKLES: Sparkles,
  TRENDING_UP: TrendingUp,
  TARGET: Target,
  LIGHTBULB: Lightbulb,
  HEART_HANDSHAKE: HeartHandshake,
  SHIELD: ShieldCheck,
};

/** Line icon for the admin's About icon keys. */
export function AboutIcon({
  name,
  className,
}: {
  name: AboutIconKey;
  className?: string;
}) {
  const Icon = ICONS[name] ?? Sparkles;
  return <Icon aria-hidden strokeWidth={1.4} className={className} />;
}

/**
 * Admin headlines don't use *accent* markers, so give the last two words
 * the serif accent, Superside-style. Text that already has markers is kept.
 */
export function autoAccent(text: string) {
  if (text.includes("*")) return text;
  const words = text.trim().split(/\s+/);
  if (words.length < 3) return text;
  const tail = words.slice(-2).join(" ");
  const match = tail.match(/^(.*?)([.!?]*)$/);
  return `${words.slice(0, -2).join(" ")} *${match?.[1] ?? tail}*${match?.[2] ?? ""}`;
}
