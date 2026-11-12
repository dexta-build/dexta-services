import Image from "next/image";
import { RecaptchaProvider } from "@/components/layout/recaptcha-provider";

/**
 * Sign-in, password reset and invite pages: a royal brand panel beside the
 * form on larger screens, just the form on phones.
 */
export default function AdminAuthLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <div className="grid min-h-dvh lg:grid-cols-[minmax(0,1fr)_minmax(0,1.05fr)]">
      <aside
        data-surface="royal"
        className="bg-surface text-surface-fg relative hidden overflow-hidden lg:flex lg:flex-col lg:justify-between lg:p-12 xl:p-16"
      >
        <Image
          src="/images/dexta1.png"
          alt="Dexta"
          width={425}
          height={134}
          className="relative z-10 h-8 w-auto self-start"
          priority
        />
        <div className="relative z-10 flex max-w-md flex-col gap-6">
          <p className="text-eyebrow text-surface-muted">Dexta admin</p>
          <p className="dx-heading text-[3rem] leading-[1.02] tracking-[-0.03em] xl:text-[3.75rem]">
            Run the <em>whole</em> website from one place.
          </p>
          <p className="text-surface-muted text-lg leading-relaxed">
            Pages, works, offers, events and messages, all kept in step with
            what visitors see.
          </p>
        </div>
        <p className="text-surface-muted relative z-10 text-sm">
          © {new Date().getFullYear()} Dexta Synergy Services
        </p>
        {/* Soft brand glow */}
        <div
          aria-hidden
          className="pointer-events-none absolute -right-40 -bottom-48 size-[560px] rounded-full bg-[radial-gradient(circle,rgb(0_171_255/0.45),transparent_65%)]"
        />
        <div
          aria-hidden
          className="pointer-events-none absolute -top-32 -left-24 size-[380px] rounded-full bg-[radial-gradient(circle,rgb(0_12_153/0.9),transparent_70%)]"
        />
      </aside>
      <main className="flex flex-col items-center justify-center px-4 py-12 sm:px-8">
        <div className="mb-10 lg:hidden">
          <Image
            src="/images/dexta.png"
            alt="Dexta"
            width={425}
            height={134}
            className="h-8 w-auto"
            priority
          />
        </div>
        <div className="w-full max-w-[420px]">
          <RecaptchaProvider>{children}</RecaptchaProvider>
        </div>
      </main>
    </div>
  );
}
