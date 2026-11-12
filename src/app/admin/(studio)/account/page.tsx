import { requirePageAccess } from "@/lib/admin/session";
import {
  CONTENT_AREAS,
  ROLE_DESCRIPTIONS,
  ROLE_LABELS,
} from "@/lib/admin/permissions";
import {
  AdminCard,
  PageHeader,
  StatusPill,
} from "@/components/admin/kit/layout";
import { AccountForms } from "./account-forms";

export const metadata = { title: "Your account" };

export default async function AccountPage() {
  const me = await requirePageAccess(null);
  const areas =
    me.role === "ADMIN"
      ? null
      : CONTENT_AREAS.filter((a) => me.access.includes(a.key)).map(
          (a) => a.label,
        );

  return (
    <>
      <PageHeader
        eyebrow="Account"
        title="Your *account*"
        description={me.email}
      />
      <div className="grid gap-6 lg:grid-cols-[1fr_20rem]">
        <AccountForms name={me.name} email={me.email} />
        <AdminCard title="Your access">
          <div className="flex flex-col gap-3">
            <StatusPill
              tone={me.role === "ADMIN" ? "royal" : "brand"}
              className="self-start"
            >
              {ROLE_LABELS[me.role]}
            </StatusPill>
            <p className="text-surface-muted text-sm leading-relaxed">
              {me.role === "ADMIN"
                ? ROLE_DESCRIPTIONS.ADMIN
                : "You can edit and publish these areas:"}
            </p>
            {areas && (
              <ul className="flex flex-wrap gap-1.5">
                {areas.length === 0 ? (
                  <li className="text-surface-muted text-sm">
                    None yet. Ask an Admin.
                  </li>
                ) : (
                  areas.map((a) => (
                    <li key={a}>
                      <StatusPill>{a}</StatusPill>
                    </li>
                  ))
                )}
              </ul>
            )}
          </div>
        </AdminCard>
      </div>
    </>
  );
}
