import { requirePageAccess } from "@/lib/admin/session";
import { PageHeader } from "@/components/admin/kit/layout";
import { KitPreview } from "./kit-preview";

export const metadata = { title: "Design kit" };

export default async function KitPage() {
  await requirePageAccess("settings");
  return (
    <>
      <PageHeader
        eyebrow="Design kit"
        title="Admin *building blocks*"
        description="The shared pieces every admin page is built from. Changes here show up everywhere."
      />
      <KitPreview />
    </>
  );
}
