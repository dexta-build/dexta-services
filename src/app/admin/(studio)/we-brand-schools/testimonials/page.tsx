import { requirePageAccess } from "@/lib/admin/session";
import { PageHeader } from "@/components/admin/kit/layout";
import { getSchoolWebsiteTestimonialsAdmin } from "../actions";
import { TestimonialsManager } from "./testimonials-manager";

export const metadata = { title: "School testimonials" };

export const dynamic = "force-dynamic";

export default async function WeBrandSchoolsTestimonialsPage() {
  await requirePageAccess("schools");
  const testimonials = await getSchoolWebsiteTestimonialsAdmin();

  return (
    <>
      <PageHeader
        eyebrow="We Brand Schools"
        title="School *testimonials*"
        description="What schools say about us: their logo, words and who said it. Shown in the moving testimonials on the We Brand Schools page."
      />
      <TestimonialsManager testimonials={testimonials} />
    </>
  );
}
