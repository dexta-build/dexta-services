/* eslint-disable @typescript-eslint/no-explicit-any */

import { randomUUID } from "node:crypto";
import { Prisma } from "@prisma/client";
import prisma from "@/lib/prisma";

type WeBrandSchoolsPrismaDelegates = {
  weBrandSchoolsPageContent: any;
  schoolWebsiteTestimonial: any;
  schoolWebsiteTemplate: any;
  schoolWebsiteTemplateAsset: any;
  schoolPortalSectionContent: any;
  schoolPortalFeatureCard: any;
  schoolPortalFeatureAsset: any;
  referralLink: any;
  referralEvent: any;
  referralNotificationLog: any;
  schoolWebsiteApplication: any;
  schoolWebsiteProject: any;
  schoolWebsiteProjectRevision: any;
  schoolWebsiteProjectExportLog: any;
};

export const weBrandSchoolsPrisma = prisma as typeof prisma &
  WeBrandSchoolsPrismaDelegates;

export type SchoolWebsiteTestimonialStoreInput = {
  schoolName: string;
  logoPublicId: string | null;
  quote: string;
  authorName: string;
  authorPosition: string;
  isVisible: boolean;
  position: number;
};

export type SchoolWebsiteTestimonialStoreRow =
  SchoolWebsiteTestimonialStoreInput & {
    id: string;
    createdAt: Date;
  };

function getSchoolWebsiteTestimonialDelegate() {
  return (
    weBrandSchoolsPrisma as typeof weBrandSchoolsPrisma & {
      schoolWebsiteTestimonial?: {
        findMany?: (
          args: unknown,
        ) => Promise<SchoolWebsiteTestimonialStoreRow[]>;
        create?: (args: unknown) => Promise<unknown>;
        update?: (args: unknown) => Promise<unknown>;
        delete?: (args: unknown) => Promise<unknown>;
      };
    }
  ).schoolWebsiteTestimonial;
}

export async function listSchoolWebsiteTestimonials(options?: {
  visibleOnly?: boolean;
}): Promise<SchoolWebsiteTestimonialStoreRow[]> {
  const delegate = getSchoolWebsiteTestimonialDelegate();

  if (delegate?.findMany) {
    return delegate.findMany({
      where: options?.visibleOnly ? { isVisible: true } : undefined,
      orderBy: [{ position: "asc" }, { createdAt: "asc" }],
      select: {
        id: true,
        schoolName: true,
        logoPublicId: true,
        quote: true,
        authorName: true,
        authorPosition: true,
        isVisible: true,
        position: true,
        createdAt: true,
      },
    });
  }

  const visibilityClause = options?.visibleOnly
    ? Prisma.sql`WHERE "isVisible" = true`
    : Prisma.empty;

  return prisma.$queryRaw<SchoolWebsiteTestimonialStoreRow[]>(Prisma.sql`
    SELECT
      "id",
      "schoolName",
      "logoPublicId",
      "quote",
      "authorName",
      "authorPosition",
      "isVisible",
      "position",
      "createdAt"
    FROM "SchoolWebsiteTestimonial"
    ${visibilityClause}
    ORDER BY "position" ASC, "createdAt" ASC
  `);
}

export async function createSchoolWebsiteTestimonialRecord(
  data: SchoolWebsiteTestimonialStoreInput,
): Promise<void> {
  const delegate = getSchoolWebsiteTestimonialDelegate();

  if (delegate?.create) {
    await delegate.create({ data });
    return;
  }

  await prisma.$executeRaw(Prisma.sql`
    INSERT INTO "SchoolWebsiteTestimonial" (
      "id",
      "schoolName",
      "logoPublicId",
      "quote",
      "authorName",
      "authorPosition",
      "isVisible",
      "position",
      "createdAt",
      "updatedAt"
    )
    VALUES (
      ${randomUUID()},
      ${data.schoolName},
      ${data.logoPublicId},
      ${data.quote},
      ${data.authorName},
      ${data.authorPosition},
      ${data.isVisible},
      ${data.position},
      CURRENT_TIMESTAMP,
      CURRENT_TIMESTAMP
    )
  `);
}

export async function updateSchoolWebsiteTestimonialRecord(
  id: string,
  data: SchoolWebsiteTestimonialStoreInput,
): Promise<void> {
  const delegate = getSchoolWebsiteTestimonialDelegate();

  if (delegate?.update) {
    await delegate.update({
      where: { id },
      data,
    });
    return;
  }

  await prisma.$executeRaw(Prisma.sql`
    UPDATE "SchoolWebsiteTestimonial"
    SET
      "schoolName" = ${data.schoolName},
      "logoPublicId" = ${data.logoPublicId},
      "quote" = ${data.quote},
      "authorName" = ${data.authorName},
      "authorPosition" = ${data.authorPosition},
      "isVisible" = ${data.isVisible},
      "position" = ${data.position},
      "updatedAt" = CURRENT_TIMESTAMP
    WHERE "id" = ${id}
  `);
}

export async function deleteSchoolWebsiteTestimonialRecord(
  id: string,
): Promise<void> {
  const delegate = getSchoolWebsiteTestimonialDelegate();

  if (delegate?.delete) {
    await delegate.delete({
      where: { id },
    });
    return;
  }

  await prisma.$executeRaw(Prisma.sql`
    DELETE FROM "SchoolWebsiteTestimonial"
    WHERE "id" = ${id}
  `);
}

export async function deleteSchoolWebsiteTestimonialsRecord(
  ids: string[],
): Promise<void> {
  if (!ids.length) return;
  const delegate = getSchoolWebsiteTestimonialDelegate();

  if (delegate?.deleteMany) {
    await delegate.deleteMany({
      where: { id: { in: ids } },
    });
    return;
  }

  await prisma.$executeRaw(Prisma.sql`
    DELETE FROM "SchoolWebsiteTestimonial"
    WHERE "id" IN (${Prisma.join(ids)})
  `);
}
