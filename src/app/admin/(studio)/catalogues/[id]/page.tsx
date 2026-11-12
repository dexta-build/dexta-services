import { notFound } from "next/navigation";
import { requirePageAccess } from "@/lib/admin/session";
import {
  readCatalogueForAdmin,
  readCataloguesForAdmin,
} from "@/lib/catalogue/admin";
import { CatalogueWorkspace } from "./workspace";

export const metadata = { title: "Catalogue" };

export default async function CatalogueAdminPage({
  params,
}: {
  params: Promise<{ id: string }>;
}) {
  await requirePageAccess("catalogue");
  const { id } = await params;
  const [data, all] = await Promise.all([
    readCatalogueForAdmin(id).catch(() => null),
    readCataloguesForAdmin().catch(() => []),
  ]);
  const row = all.find((c) => c.id === id);
  if (!data || !row) notFound();
  return (
    <CatalogueWorkspace
      row={row}
      categories={data.categories}
      items={data.items}
    />
  );
}
