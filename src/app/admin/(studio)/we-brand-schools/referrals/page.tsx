import { requirePageAccess } from "@/lib/admin/session";
import { PageHeader } from "@/components/admin/kit/layout";
import { getReferralLinksAdmin } from "../actions";
import { ReferralsManager } from "./referrals-manager";

export const metadata = { title: "School referrals" };

export const dynamic = "force-dynamic";

export default async function WeBrandSchoolsReferralsPage() {
  await requirePageAccess("schools");
  const referrals = await getReferralLinksAdmin();

  return (
    <>
      <PageHeader
        eyebrow="We Brand Schools"
        title="Referral *links*"
        description="Personal links for partners, people and organisations, with the visits, applications and live school sites each one brings."
      />
      <ReferralsManager referrals={referrals} />
    </>
  );
}
