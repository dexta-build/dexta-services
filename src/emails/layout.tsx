import {
  Body,
  Container,
  Head,
  Hr,
  Html,
  Img,
  Link,
  Preview,
  Section,
  Text,
} from "@react-email/components";
import { SITE_URL } from "@/lib/site/site-url";

/**
 * Every email the site sends shares this frame: the Dexta logo, a white
 * card on the site's cream background, and a quiet footer. Built with React
 * Email, so it renders well in Gmail, Outlook and Apple Mail.
 */

export const C = {
  royal: "#000c99",
  cyan: "#00abff",
  canvas: "#f8f8f5",
  ink: "#202321",
  muted: "#5f625f",
  rule: "#e6e6e1",
};

export const font =
  "-apple-system, BlinkMacSystemFont, 'Segoe UI', Helvetica, Arial, sans-serif";

export function EmailLayout({
  preview,
  eyebrow,
  children,
}: {
  /** The line inboxes show after the subject. */
  preview: string;
  /** Small label above the content, e.g. the event name. */
  eyebrow?: string;
  children: React.ReactNode;
}) {
  return (
    <Html lang="en">
      <Head />
      <Preview>{preview}</Preview>
      <Body
        style={{
          backgroundColor: C.canvas,
          margin: 0,
          padding: "32px 12px",
          fontFamily: font,
          color: C.ink,
        }}
      >
        <Container style={{ maxWidth: 580, margin: "0 auto" }}>
          <Section style={{ padding: "0 8px 20px" }}>
            <Link href={SITE_URL}>
              <Img
                src={`${SITE_URL}/images/dexta.png`}
                width="104"
                height="33"
                alt="Dexta"
              />
            </Link>
          </Section>
          <Section
            style={{
              backgroundColor: "#ffffff",
              borderRadius: 14,
              padding: "32px 32px 28px",
              border: `1px solid ${C.rule}`,
            }}
          >
            {eyebrow && (
              <Text
                style={{
                  margin: "0 0 14px",
                  color: C.royal,
                  fontSize: 11,
                  fontWeight: 700,
                  letterSpacing: "0.12em",
                  textTransform: "uppercase",
                }}
              >
                {eyebrow}
              </Text>
            )}
            {children}
          </Section>
          <Section style={{ padding: "20px 8px 0" }}>
            <Text
              style={{
                margin: 0,
                color: C.muted,
                fontSize: 12,
                lineHeight: "20px",
              }}
            >
              Dexta Synergy Services · Design, build and print
              <br />
              <Link
                href={SITE_URL}
                style={{ color: C.muted, textDecoration: "underline" }}
              >
                {SITE_URL.replace(/^https?:\/\//, "")}
              </Link>
            </Text>
          </Section>
        </Container>
      </Body>
    </Html>
  );
}

export function Heading({ children }: { children: React.ReactNode }) {
  return (
    <Text
      style={{
        margin: "0 0 16px",
        fontSize: 24,
        lineHeight: "30px",
        fontWeight: 700,
        letterSpacing: "-0.01em",
        color: C.ink,
      }}
    >
      {children}
    </Text>
  );
}

const p = {
  margin: "0 0 14px",
  fontSize: 15,
  lineHeight: "24px",
  color: C.ink,
} as const;

/** Splits links in a line of text into real links. */
function linkify(line: string) {
  const parts = line.split(/(https?:\/\/[^\s]+)/g);
  return parts.map((part, i) =>
    /^https?:\/\//.test(part) ? (
      <Link
        key={i}
        href={part}
        style={{ color: C.royal, textDecoration: "underline" }}
      >
        {part}
      </Link>
    ) : (
      part
    ),
  );
}

/**
 * Plain text written in the admin as email paragraphs: a blank line starts
 * a new paragraph, a single line break stays a line break, and web
 * addresses become links. React escapes everything, so it's safe.
 */
export function Paragraphs({ text }: { text: string }) {
  const paragraphs = text
    .replace(/\r\n/g, "\n")
    .split(/\n\s*\n/)
    .map((x) => x.trim())
    .filter(Boolean);
  return (
    <>
      {paragraphs.map((para, i) => (
        <Text key={i} style={p}>
          {para.split("\n").map((line, j, all) => (
            <span key={j}>
              {linkify(line)}
              {j < all.length - 1 && <br />}
            </span>
          ))}
        </Text>
      ))}
    </>
  );
}

export function Para({ children }: { children: React.ReactNode }) {
  return <Text style={p}>{children}</Text>;
}

export function Muted({ children }: { children: React.ReactNode }) {
  return (
    <Text style={{ ...p, color: C.muted, fontSize: 13, lineHeight: "21px" }}>
      {children}
    </Text>
  );
}

export function EmailButton({
  href,
  children,
}: {
  href: string;
  children: React.ReactNode;
}) {
  return (
    <Section style={{ margin: "8px 0 18px" }}>
      <Link
        href={href}
        style={{
          display: "inline-block",
          backgroundColor: C.royal,
          color: "#ffffff",
          fontSize: 14,
          fontWeight: 700,
          padding: "12px 22px",
          borderRadius: 999,
          textDecoration: "none",
        }}
      >
        {children}
      </Link>
    </Section>
  );
}

/** The event's name, time and place in a soft card. */
export function EventCard({
  title,
  when,
  where,
}: {
  title: string;
  when: string;
  where: string;
}) {
  return (
    <Section
      style={{
        backgroundColor: C.canvas,
        borderRadius: 10,
        padding: "16px 18px",
        margin: "6px 0 18px",
      }}
    >
      <Text
        style={{
          margin: "0 0 4px",
          fontSize: 15,
          fontWeight: 700,
          color: C.ink,
        }}
      >
        {title}
      </Text>
      <Text style={{ margin: "0 0 2px", fontSize: 13, color: C.muted }}>
        {when}
      </Text>
      <Text style={{ margin: 0, fontSize: 13, color: C.muted }}>{where}</Text>
    </Section>
  );
}

export function Rule() {
  return <Hr style={{ borderColor: C.rule, margin: "22px 0" }} />;
}

/** Rich text from the email editor, already made email-safe. */
export function RichBody({ html }: { html: string }) {
  return <div dangerouslySetInnerHTML={{ __html: html }} />;
}

export type LinkedFile = { name: string; url: string; size: string };

/** Files offered as download links (too big, or a big group). */
export function Files({ files }: { files: LinkedFile[] }) {
  return (
    <Section
      style={{
        border: `1px solid ${C.rule}`,
        borderRadius: 10,
        padding: "6px 16px",
        margin: "6px 0 18px",
      }}
    >
      <Text
        style={{
          margin: "8px 0 4px",
          fontSize: 11,
          fontWeight: 700,
          letterSpacing: "0.1em",
          textTransform: "uppercase",
          color: C.muted,
        }}
      >
        {files.length === 1 ? "File" : "Files"}
      </Text>
      {files.map((f, i) => (
        <Text
          key={i}
          style={{
            margin: 0,
            padding: "8px 0",
            borderTop: i ? `1px solid ${C.rule}` : undefined,
            fontSize: 14,
          }}
        >
          <Link
            href={f.url}
            style={{
              color: C.royal,
              fontWeight: 700,
              textDecoration: "underline",
            }}
          >
            {f.name}
          </Link>
          {f.size && <span style={{ color: C.muted }}> · {f.size}</span>}
        </Text>
      ))}
    </Section>
  );
}

/** Their original message under a reply. */
export function Quoted({ label, text }: { label: string; text: string }) {
  return (
    <>
      <Rule />
      <Text style={{ margin: "0 0 8px", fontSize: 12, color: C.muted }}>
        {label}
      </Text>
      <Section style={{ borderLeft: `3px solid ${C.rule}`, paddingLeft: 14 }}>
        <Text
          style={{
            margin: 0,
            fontSize: 13,
            lineHeight: "21px",
            color: C.muted,
            whiteSpace: "pre-line",
          }}
        >
          {text}
        </Text>
      </Section>
    </>
  );
}

/** Label/value rows (e.g. a registration's answers for the team). */
export function Details({
  rows,
}: {
  rows: { label: string; value: string }[];
}) {
  return (
    <Section style={{ margin: "4px 0 10px" }}>
      {rows.map((r, i) => (
        <Section
          key={i}
          style={{
            borderTop: i ? `1px solid ${C.rule}` : undefined,
            padding: "9px 0",
          }}
        >
          <Text
            style={{
              margin: "0 0 2px",
              fontSize: 11,
              fontWeight: 700,
              letterSpacing: "0.08em",
              textTransform: "uppercase",
              color: C.muted,
            }}
          >
            {r.label}
          </Text>
          <Text
            style={{
              margin: 0,
              fontSize: 14,
              lineHeight: "21px",
              whiteSpace: "pre-line",
            }}
          >
            {r.value || "—"}
          </Text>
        </Section>
      ))}
    </Section>
  );
}
