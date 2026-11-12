"use client";

import { useTransition } from "react";
import { useRouter } from "next/navigation";
import { toast } from "sonner";
import { RefreshCw } from "lucide-react";
import { Button } from "@/components/site/button";
import { recheckMedia } from "./dashboard-actions";

export function RecheckMediaButton() {
  const router = useRouter();
  const [pending, start] = useTransition();
  return (
    <Button
      size="sm"
      variant="ghost"
      disabled={pending}
      onClick={() =>
        start(async () => {
          const res = await recheckMedia();
          if (!res.success) return void toast.error(res.message);
          router.refresh();
          toast.success("Checked again");
        })
      }
    >
      <RefreshCw
        aria-hidden
        className={pending ? "size-4 animate-spin" : "size-4"}
      />
      {pending ? "Checking" : "Check again"}
    </Button>
  );
}
