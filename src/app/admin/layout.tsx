import { AdminToaster } from "@/components/admin/kit/feedback";

export const metadata = {
  title: {
    default: "Admin",
    template: "%s | Admin",
  },
  robots: { index: false, follow: false },
};

export default function AdminLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <div className="dx-site min-h-dvh">
      {children}
      <AdminToaster />
    </div>
  );
}
