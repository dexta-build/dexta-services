"use client";

import { useEffect, useRef, useState, useTransition } from "react";
import { useRouter } from "next/navigation";
import { toast } from "sonner";
import {
  Building2,
  ExternalLink,
  Eye,
  EyeOff,
  Pencil,
  Plus,
  Trash2,
} from "lucide-react";
import { stock } from "@/lib/site/stock-media";
import { CLIENT_FIELDS, type ClientForm } from "@/lib/site/client-fields";
import { Button } from "@/components/site/button";
import { EmptyState, StatusPill } from "@/components/admin/kit/layout";
import { SortableList } from "@/components/admin/kit/sortable-list";
import { Modal } from "@/components/admin/kit/overlays";
import { RowActions } from "@/components/admin/kit/row-actions";
import { useConfirm } from "@/components/admin/kit/feedback";
import { SectionForm } from "@/components/admin/content/section-form";
import {
  deleteClients,
  reorderClients,
  saveClient,
  setClientVisible,
} from "./actions";

type Client = { id: string; form: ClientForm };
type Result = { success: boolean; message?: string };

const EMPTY: ClientForm = {
  name: "",
  logo: "",
  websiteUrl: "",
  isVisible: true,
};

export function ClientsManager({ clients }: { clients: Client[] }) {
  const router = useRouter();
  const confirm = useConfirm();
  const [items, setItems] = useState(clients);
  const [editing, setEditing] = useState<Client | "new" | null>(null);
  const [, start] = useTransition();
  const timer = useRef<ReturnType<typeof setTimeout> | null>(null);

  useEffect(() => setItems(clients), [clients]);

  const run = (fn: () => Promise<Result>, ok: string) =>
    start(async () => {
      const res = await fn();
      if (!res.success)
        return void toast.error(res.message ?? "That didn't work.");
      toast.success(ok);
      router.refresh();
    });

  const add = (
    <Button size="sm" onClick={() => setEditing("new")}>
      <Plus aria-hidden className="size-4" /> Add client
    </Button>
  );

  return (
    <div className="flex flex-col gap-5">
      {items.length === 0 ? (
        <EmptyState
          icon={<Building2 />}
          title="No client logos yet"
          description="Add the brands you've worked with. Until you do, the site's logo strips show only Our Expressions."
          action={add}
        />
      ) : (
        <>
          <div className="flex justify-end">{add}</div>
          <SortableList
            label="Client logo order"
            items={items}
            getId={(c) => c.id}
            onReorder={(next) => {
              setItems(next);
              if (timer.current) clearTimeout(timer.current);
              timer.current = setTimeout(async () => {
                const res = await reorderClients(next.map((c) => c.id));
                if (!res.success) toast.error(res.message);
                else toast.success("Order saved");
              }, 700);
            }}
            renderItem={(c) => (
              <div className="flex items-center gap-3">
                <button
                  type="button"
                  onClick={() => setEditing(c)}
                  className="flex min-w-0 flex-1 items-center gap-3 text-left outline-none focus-visible:underline"
                >
                  {c.form.logo ? (
                    // eslint-disable-next-line @next/next/no-img-element -- previews from any host
                    <img
                      src={stock(c.form.logo, 240)}
                      alt=""
                      className="bg-canvas h-12 w-24 shrink-0 rounded-[10px] object-contain p-2"
                    />
                  ) : (
                    <span className="bg-canvas text-surface-muted inline-flex h-12 w-24 shrink-0 items-center justify-center rounded-[10px] text-[0.65rem] font-bold tracking-wide uppercase">
                      No logo
                    </span>
                  )}
                  <span className="flex min-w-0 flex-col gap-0.5">
                    <span className="flex flex-wrap items-center gap-2">
                      <span className="text-sm font-bold">{c.form.name}</span>
                      {!c.form.isVisible && <StatusPill>Hidden</StatusPill>}
                    </span>
                    {c.form.websiteUrl && (
                      <span className="text-surface-muted truncate text-xs">
                        {c.form.websiteUrl.replace(/^https?:\/\/(www\.)?/, "")}
                      </span>
                    )}
                  </span>
                </button>
                <RowActions
                  label={`Actions for ${c.form.name}`}
                  title={c.form.name}
                  actions={[
                    {
                      label: "Edit",
                      icon: <Pencil />,
                      onSelect: () => setEditing(c),
                    },
                    {
                      label: "Open website",
                      icon: <ExternalLink />,
                      href: c.form.websiteUrl,
                      external: true,
                      hidden: !c.form.websiteUrl,
                    },
                    {
                      label: c.form.isVisible ? "Hide" : "Show",
                      icon: c.form.isVisible ? <EyeOff /> : <Eye />,
                      onSelect: () =>
                        run(
                          () => setClientVisible(c.id, !c.form.isVisible),
                          c.form.isVisible ? "Hidden" : "Shown",
                        ),
                    },
                    "separator",
                    {
                      label: "Delete",
                      icon: <Trash2 />,
                      danger: true,
                      onSelect: async () => {
                        const ok = await confirm({
                          title: `Delete ${c.form.name}?`,
                          description:
                            "Its logo leaves the site. The image stays in the media library.",
                          danger: true,
                        });
                        if (ok)
                          run(() => deleteClients([c.id]), "Client deleted");
                      },
                    },
                  ]}
                />
              </div>
            )}
          />
        </>
      )}

      <ClientModal
        key={editing === "new" ? "new" : (editing?.id ?? "closed")}
        client={editing === "new" ? null : editing}
        open={editing !== null}
        onClose={() => setEditing(null)}
        onSaved={() => {
          setEditing(null);
          router.refresh();
        }}
      />
    </div>
  );
}

function ClientModal({
  client,
  open,
  onClose,
  onSaved,
}: {
  client: Client | null;
  open: boolean;
  onClose: () => void;
  onSaved: () => void;
}) {
  const initial = client?.form ?? EMPTY;
  const [form, setForm] = useState<ClientForm>(initial);
  const [errors, setErrors] = useState<Record<string, string>>({});
  const [saving, start] = useTransition();
  const confirm = useConfirm();
  const dirty = open && JSON.stringify(form) !== JSON.stringify(initial);

  const close = async () => {
    if (
      dirty &&
      !(await confirm({
        title: "Close without saving?",
        description: "Your changes will be lost.",
        confirmLabel: "Close",
        danger: true,
      }))
    )
      return;
    onClose();
  };

  return (
    <Modal
      open={open}
      onOpenChange={(o) => !o && void close()}
      title={client ? client.form.name : "Add a client"}
      description="Shown in the homepage logo strip and on the Works page."
      footer={
        <>
          <Button size="sm" variant="subtle" onClick={() => void close()}>
            Cancel
          </Button>
          <Button
            size="sm"
            disabled={saving || !dirty}
            onClick={() =>
              start(async () => {
                const res = await saveClient(client?.id ?? null, form);
                if (!res.success) {
                  setErrors("errors" in res && res.errors ? res.errors : {});
                  return void toast.error(res.message);
                }
                toast.success(client ? "Client saved" : "Client added");
                onSaved();
              })
            }
          >
            {saving ? "Saving" : client ? "Save" : "Add client"}
          </Button>
        </>
      }
    >
      <SectionForm
        fields={CLIENT_FIELDS}
        value={form as unknown as Record<string, unknown>}
        onChange={(v) => setForm(v as unknown as ClientForm)}
        errors={errors}
      />
    </Modal>
  );
}
