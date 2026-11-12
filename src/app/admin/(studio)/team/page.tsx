import { requirePageAccess } from "@/lib/admin/session";
import { readTeamForAdmin } from "@/lib/team/admin";
import { PageHeader } from "@/components/admin/kit/layout";
import { Callout } from "@/components/admin/kit/display";
import { Button } from "@/components/site/button";
import { TeamManager } from "./team-manager";

export const metadata = { title: "Team" };

export default async function TeamAdminPage() {
  await requirePageAccess("about");
  const team = await readTeamForAdmin().catch(() => null);
  return (
    <>
      <PageHeader
        eyebrow="About & team"
        title="The *team*"
        description="Everyone on the About page, each with a portfolio at their own address (e.g. /daniel-azu). Drag to set the order of the team carousel."
        actions={
          <Button href="/admin/pages/about" size="sm" variant="subtle" arrow>
            About page
          </Button>
        }
      />
      {team ? (
        <TeamManager team={team} />
      ) : (
        <Callout tone="danger" title="The team couldn't be loaded">
          Refresh the page to try again.
        </Callout>
      )}
    </>
  );
}
