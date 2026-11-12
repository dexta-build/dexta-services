import { redirect } from "next/navigation";

/** Site settings live in the page editor as the "site" page. */
export default function SettingsPage() {
  redirect("/admin/pages/site");
}
