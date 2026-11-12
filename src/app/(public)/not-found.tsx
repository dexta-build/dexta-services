import type { Metadata } from "next";
import { NotFoundView } from "@/components/site/not-found-view";

export const metadata: Metadata = {
  title: "Page not found",
  robots: { index: false, follow: true },
};

/** A public page that called notFound() (the layout adds header and footer). */
export default function NotFound() {
  return <NotFoundView />;
}
