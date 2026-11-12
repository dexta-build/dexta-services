import { requirePageAccess } from "@/lib/admin/session";
import {
  ensureExpressionsSeeded,
  readExpressionsForAdmin,
} from "@/lib/site/expressions-admin";
import { PageHeader } from "@/components/admin/kit/layout";
import { Callout } from "@/components/admin/kit/display";
import { Button } from "@/components/site/button";
import { ExpressionsManager } from "./expressions-manager";

export const metadata = { title: "Our Expressions" };

export default async function ExpressionsAdminPage() {
  await requirePageAccess("works");
  const seed = await ensureExpressionsSeeded();
  const products = seed.ready ? await readExpressionsForAdmin() : [];

  return (
    <>
      <PageHeader
        eyebrow="Works"
        title="Our *Expressions*"
        description="The products Dexta designs, builds and runs: screenshots, key facts, features and the story behind each one."
        actions={
          <Button
            href="/admin/pages/expressions"
            size="sm"
            variant="subtle"
            arrow
          >
            Our Expressions page
          </Button>
        }
      />
      {seed.ready ? (
        <ExpressionsManager products={products} />
      ) : (
        <Callout tone="warning" title="Our Expressions isn't set up yet">
          {seed.message} Until then the site keeps showing the built-in
          products.
        </Callout>
      )}
    </>
  );
}
