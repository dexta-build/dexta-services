"use server";

import { revalidatePath, updateTag } from "next/cache";
import prisma from "@/lib/prisma";
import { logAudit } from "@/lib/admin/audit";
import {
  AdminAuthError,
  requireAdmin,
  type AdminActor,
} from "@/lib/admin/session";
import { objectSchema } from "@/lib/content/fields";
import {
  addressProblem,
  cleanAddress,
  describeProblem,
  liveAddress,
} from "@/lib/team/addresses";
import { ABOUT_TEAM_TAG } from "@/lib/about-cache";
import { THOUGHTS_TAG } from "@/lib/site/thoughts-data";
import { TEAM_FIELDS, rowFromForm, type TeamForm } from "@/lib/team/fields";

type Fail = {
  success: false;
  message: string;
  errors?: Record<string, string>;
};
type Ok<T = object> = { success: true } & T;

async function actor(): Promise<AdminActor | Fail> {
  try {
    return await requireAdmin("about");
  } catch (error) {
    return {
      success: false,
      message:
        error instanceof AdminAuthError && error.status === 403
          ? "You don't have access to manage the team."
          : "Your session has ended. Sign in again.",
    };
  }
}
const failed = (v: unknown): v is Fail =>
  !!v && typeof v === "object" && "success" in v;

function refresh(id?: string) {
  updateTag(ABOUT_TEAM_TAG);
  // Article bylines show the author's name, role and photo.
  updateTag(THOUGHTS_TAG);
  revalidatePath("/admin/team");
  if (id) revalidatePath(`/admin/team/${id}`);
}

const isWebUrl = (v: string) => {
  if (!v) return true;
  if (v.startsWith("/")) return !v.startsWith("//");
  try {
    const u = new URL(v);
    return u.protocol === "https:" || u.protocol === "http:";
  } catch {
    return false;
  }
};

export async function saveMember(
  id: string | null,
  input: TeamForm,
): Promise<Ok<{ id: string; slug: string; note?: string }> | Fail> {
  const a = await actor();
  if (failed(a)) return a;
  const parsed = objectSchema(TEAM_FIELDS).safeParse(input);
  if (!parsed.success) {
    const errors: Record<string, string> = {};
    for (const i of parsed.error.issues)
      errors[i.path.join(".")] ??= i.message.startsWith("Invalid")
        ? "Please check this field."
        : i.message;
    return { success: false, message: "Some fields need attention.", errors };
  }
  const d = { ...input, story: (input.story ?? "").slice(0, 100_000) };

  const errors: Record<string, string> = {};
  if (d.email && !/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(d.email.trim()))
    errors.email = "That email doesn't look right";
  if (!isWebUrl(d.cv.trim())) errors.cv = "Use a full web address";
  d.socials.forEach((x, i) => {
    if (!/^https?:\/\//.test(x.url.trim()))
      errors[`socials.${i}.url`] = "Use a full web address (https://…)";
  });
  d.projects.forEach((p, i) => {
    if (!isWebUrl(p.url.trim()))
      errors[`projects.${i}.url`] = "Check this link";
  });
  d.certifications.forEach((c, i) => {
    if (!isWebUrl(c.url.trim()))
      errors[`certifications.${i}.url`] = "Check this link";
  });
  if (Object.keys(errors).length)
    return { success: false, message: "Some links need attention.", errors };

  // Address: checked against the site's own pages and everyone else's.
  const slug = cleanAddress(d.slug || d.name);
  const others = await prisma.aboutTeamMember.findMany({
    where: id ? { id: { not: id } } : undefined,
    select: { name: true, slug: true },
  });
  const taken = Object.fromEntries(
    others.map((o) => [liveAddress(o.slug, o.name), o.name]),
  );
  const problem = addressProblem(slug, taken);
  if (problem)
    return {
      success: false,
      message: describeProblem(problem),
      errors: { slug: describeProblem(problem) },
    };

  const before = id
    ? await prisma.aboutTeamMember.findUnique({
        where: { id },
        select: { slug: true, name: true },
      })
    : null;
  if (id && !before)
    return { success: false, message: "That person no longer exists." };
  const oldAddress = before ? liveAddress(before.slug, before.name) : null;

  const data = { ...rowFromForm(d), slug };
  const create = {
    ...data,
    portfolioUrl: "",
    showPortfolioButton: false,
  };
  let note: string | undefined;
  try {
    let row;
    try {
      row = await prisma.$transaction(async (tx) => {
        // Someone's old address being reused: it now leads here.
        const claimed = await tx.teamSlugRedirect.findUnique({
          where: { slug },
          include: { member: { select: { name: true } } },
        });
        if (claimed) {
          await tx.teamSlugRedirect.delete({ where: { slug } });
          if (claimed.memberId !== id)
            note = `/${slug} used to lead to ${claimed.member.name}'s profile; it now opens this one.`;
        }
        const saved = id
          ? await tx.aboutTeamMember.update({ where: { id }, data })
          : await tx.aboutTeamMember.create({
              data: {
                ...create,
                position: await tx.aboutTeamMember.count(),
              },
            });
        // The old address keeps working: it redirects to the new one.
        if (oldAddress && oldAddress !== slug)
          await tx.teamSlugRedirect.upsert({
            where: { slug: oldAddress },
            create: { slug: oldAddress, memberId: saved.id },
            update: { memberId: saved.id },
          });
        return saved;
      });
    } catch (error) {
      // Before the redirects table exists: save, but say links won't move.
      if (
        !/teamSlugRedirect|TeamSlugRedirect|does not exist/i.test(String(error))
      )
        throw error;
      row = id
        ? await prisma.aboutTeamMember.update({ where: { id }, data })
        : await prisma.aboutTeamMember.create({
            data: { ...create, position: await prisma.aboutTeamMember.count() },
          });
      if (oldAddress && oldAddress !== slug)
        note = `Saved, but /${oldAddress} won't redirect yet: run the database update (prisma db push) to turn on redirects.`;
    }
    await logAudit({
      action: id ? "about.member_updated" : "about.member_created",
      area: "about",
      summary:
        oldAddress && oldAddress !== slug
          ? `Edited ${data.name}'s profile and moved it from /${oldAddress} to /${slug}`
          : `${id ? "Edited" : "Added"} ${data.name}'s profile`,
      entityType: "AboutTeamMember",
      entityId: row.id,
      actor: a,
    });
    refresh(row.id);
    return { success: true, id: row.id, slug, note };
  } catch {
    return {
      success: false,
      message: "That couldn't be saved. Please try again.",
    };
  }
}

/** Stops an old address from redirecting (it then shows "not found"). */
export async function removeAddressRedirect(
  memberId: string,
  slug: string,
): Promise<Ok | Fail> {
  const a = await actor();
  if (failed(a)) return a;
  try {
    await prisma.teamSlugRedirect.deleteMany({ where: { slug, memberId } });
  } catch {
    return { success: false, message: "That couldn't be removed." };
  }
  await logAudit({
    action: "about.address_redirect_removed",
    area: "about",
    summary: `Stopped /${slug} redirecting`,
    entityType: "AboutTeamMember",
    entityId: memberId,
    actor: a,
  });
  refresh(memberId);
  return { success: true };
}

export async function setMemberVisible(
  id: string,
  isVisible: boolean,
): Promise<Ok | Fail> {
  const a = await actor();
  if (failed(a)) return a;
  const m = await prisma.aboutTeamMember.update({
    where: { id },
    data: { isVisible },
  });
  await logAudit({
    action: "about.member_visibility",
    area: "about",
    summary: `${isVisible ? "Showed" : "Hid"} ${m.name}`,
    entityType: "AboutTeamMember",
    entityId: id,
    actor: a,
  });
  refresh(id);
  return { success: true };
}

export async function reorderMembers(ids: string[]): Promise<Ok | Fail> {
  const a = await actor();
  if (failed(a)) return a;
  await prisma.$transaction(
    ids.map((id, position) =>
      prisma.aboutTeamMember.update({ where: { id }, data: { position } }),
    ),
  );
  await logAudit({
    action: "about.team_reordered",
    area: "about",
    summary: "Reordered the team",
    actor: a,
  });
  refresh();
  return { success: true };
}

export async function deleteMember(id: string): Promise<Ok | Fail> {
  const a = await actor();
  if (failed(a)) return a;
  const m = await prisma.aboutTeamMember.findUnique({ where: { id } });
  if (!m) return { success: true };
  await prisma.aboutTeamMember.delete({ where: { id } });
  await logAudit({
    action: "about.member_deleted",
    area: "about",
    summary: `Removed ${m.name} from the team`,
    entityType: "AboutTeamMember",
    entityId: id,
    actor: a,
  });
  refresh();
  return { success: true };
}
