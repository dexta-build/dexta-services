import { requirePageAccess } from "@/lib/admin/session";
import { PageHeader } from "@/components/admin/kit/layout";
import {
  getSchoolPortalFeatureCardsAdmin,
  getSchoolPortalSectionContentAdmin,
} from "../actions";
import { PortalManager } from "./portal-manager";

export const metadata = { title: "School portal" };

export const dynamic = "force-dynamic";

export default async function WeBrandSchoolsPortalPage() {
  await requirePageAccess("schools");
  const [sectionContent, cards] = await Promise.all([
    getSchoolPortalSectionContentAdmin(),
    getSchoolPortalFeatureCardsAdmin(),
  ]);

  return (
    <>
      <PageHeader
        eyebrow="We Brand Schools"
        title="The free *portal*"
        description="The school portal section on the We Brand Schools page: its heading, and the cards with their features, screenshots and videos."
      />
      <PortalManager sectionContent={sectionContent} cards={cards} />
    </>
  );
}
