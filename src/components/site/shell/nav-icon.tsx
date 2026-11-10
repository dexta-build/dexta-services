import {
  AppWindow,
  BookOpen,
  Briefcase,
  Cake,
  CalendarDays,
  Code2,
  CreditCard,
  Flag,
  Flower2,
  Globe,
  GraduationCap,
  Heart,
  Lightbulb,
  Mail,
  Maximize2,
  Monitor,
  Package,
  Palette,
  PartyPopper,
  PenTool,
  Presentation,
  Share2,
  Shirt,
  ShoppingCart,
  Sparkles,
  Wrench,
  type LucideIcon,
} from "lucide-react";
import type { NavIcon as NavIconName } from "@/lib/site/navigation";

const ICONS: Record<NavIconName, LucideIcon> = {
  palette: Palette,
  pen: PenTool,
  share: Share2,
  presentation: Presentation,
  package: Package,
  sparkles: Sparkles,
  globe: Globe,
  app: AppWindow,
  cart: ShoppingCart,
  code: Code2,
  school: GraduationCap,
  wrench: Wrench,
  mail: Mail,
  book: BookOpen,
  card: CreditCard,
  flag: Flag,
  shirt: Shirt,
  maximize: Maximize2,
  heart: Heart,
  flower: Flower2,
  party: PartyPopper,
  cake: Cake,
  monitor: Monitor,
  briefcase: Briefcase,
  calendar: CalendarDays,
  lightbulb: Lightbulb,
};

export function NavIcon({
  name,
  className,
}: {
  name: NavIconName;
  className?: string;
}) {
  const Icon = ICONS[name];
  return <Icon aria-hidden className={className} strokeWidth={1.5} />;
}
