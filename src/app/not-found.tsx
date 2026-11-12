import type { Metadata } from "next";
import { NotFoundView } from "@/components/site/not-found-view";
import { PublicChrome } from "@/components/site/shell/public-chrome";

export const metadata: Metadata = {
  title: "Page not found",
  robots: { index: false, follow: true },
};

/** Any address that doesn't exist: the 404 inside the site's header and footer. */
export default function NotFound() {
  return (
    <PublicChrome>
      <NotFoundView />
    </PublicChrome>
  );
}
