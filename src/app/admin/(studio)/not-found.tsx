import { SearchX } from "lucide-react";
import { EmptyState } from "@/components/admin/kit/layout";
import { Button } from "@/components/site/button";

/** A missing admin item (e.g. a deleted project or post). */
export default function AdminNotFound() {
  return (
    <EmptyState
      icon={<SearchX />}
      title="This isn't here any more"
      description="It may have been deleted, or the link is out of date."
      action={
        <Button href="/admin" size="sm">
          Back to the dashboard
        </Button>
      }
      className="mt-10"
    />
  );
}
