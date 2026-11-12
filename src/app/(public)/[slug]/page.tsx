import type { Metadata } from "next";
import Image from "next/image";
import Link from "next/link";
import { notFound, permanentRedirect } from "next/navigation";
import {
  ArrowUpRight,
  BadgeCheck,
  ChevronRight,
  Download,
  GraduationCap,
  Mail,
  MapPin,
  Quote,
} from "lucide-react";
import { AccentText } from "@/components/site/accent-text";
import { Button } from "@/components/site/button";
import { Container } from "@/components/site/container";
import { Eyebrow } from "@/components/site/eyebrow";
import { Heading } from "@/components/site/heading";
import { Reveal, RevealGroup, RevealItem } from "@/components/site/reveal";
import { Section } from "@/components/site/section";
import { SectionNav, SocialLinks } from "@/components/site/team/portfolio-bits";
import {
  CertificationList,
  EducationList,
  ExperienceTimeline,
  LanguagesCard,
  SkillGroupCard,
  SubHeading,
} from "@/components/site/team/portfolio-sections";
import { TeamPortrait } from "@/components/site/team/team-card";
import { PostCard } from "@/components/site/thoughts/post-card";
import {
  findProfileRedirect,
  getTeam,
  getTeamMember,
} from "@/lib/site/team-data";
import { RESERVED_ADDRESSES } from "@/lib/team/addresses";
import { getThoughts } from "@/lib/site/thoughts-data";
import { TEAM_TEMPLATE } from "@/lib/content/pages/templates";
import { loadPage } from "@/lib/content/store";

type Params = { slug: string };

/**
 * Team profiles live at the top level: /daniel-azu. Real pages (/about,
 * /works…) always win over this route, and the editor refuses addresses
 * they use (src/lib/team/addresses.ts).
 */
export async function generateStaticParams(): Promise<Params[]> {
  return (await getTeam())
    .filter((m) => !RESERVED_ADDRESSES.has(m.slug))
    .map((m) => ({ slug: m.slug }));
}

/**
 * The person at this address. Otherwise: mixed case goes to the lower-case
 * address, and an old address (after a rename) goes permanently to the
 * person's current one. Anything else is a real 404.
 */
async function resolve(slug: string) {
  const lower = slug.toLowerCase();
  if (lower !== slug) permanentRedirect(`/${encodeURIComponent(lower)}`);
  if (RESERVED_ADDRESSES.has(slug)) notFound();
  const found = await getTeamMember(slug);
  if (found) return found;
  const current = await findProfileRedirect(slug);
  if (current) permanentRedirect(`/${current}`);
  notFound();
}

export async function generateMetadata({
  params,
}: {
  params: Promise<Params>;
}): Promise<Metadata> {
  const { slug } = await params;
  const found = await getTeamMember(slug);
  if (!found) return {};
  const { member: m } = found;
  return {
    alternates: { canonical: `/${slug}` },
    title: `${m.name}, ${m.role}`,
    description: m.headline ?? m.bio,
    openGraph: {
      type: "profile",
      title: `${m.name} · ${m.role} at Dexta`,
      description: m.headline ?? m.bio,
      ...(m.photo ? { images: [{ url: m.photo }] } : {}),
    },
  };
}

/**
 * A team member's professional portfolio: introduction, about, expertise
 * with software and language proficiency, experience, education and
 * certifications, work, articles and contact details. Sections without data are
 * left out, so a partly filled profile still looks complete.
 */
export default async function TeamMemberPage({
  params,
}: {
  params: Promise<Params>;
}) {
  const { slug } = await params;
  const { member: m } = await resolve(slug);

  const [thoughts, template] = await Promise.all([
    getThoughts(),
    loadPage(TEAM_TEMPLATE),
  ]);
  const L = {
    ...template.data.intro,
    ...template.data.nav,
    ...template.data.sections,
  };
  const named = (text: string) => text.replace(/\{name\}/g, m.firstName);
  const articles = thoughts
    .filter((t) => t.author?.name === m.name)
    .slice(0, 3);
  const location = m.location ?? L.defaultLocation;
  const skillCount = m.skillGroups.reduce((n, g) => n + g.items.length, 0);

  const stats = [
    m.yearsExperience
      ? { value: `${m.yearsExperience}+`, label: L.statYears }
      : null,
    !m.projectsFromStudio && m.projects.length
      ? { value: String(m.projects.length), label: L.statProjects }
      : null,
    m.certifications.length
      ? {
          value: String(m.certifications.length),
          label: m.certifications.length === 1 ? L.statCertOne : L.statCertMany,
        }
      : null,
    m.languages.length
      ? {
          value: String(m.languages.length),
          label: m.languages.length === 1 ? L.statLangOne : L.statLangMany,
        }
      : null,
    skillCount ? { value: String(skillCount), label: L.statSkills } : null,
  ]
    .filter((s): s is { value: string; label: string } => Boolean(s))
    .slice(0, 4);

  const hasSkills =
    m.expertise.length > 0 ||
    m.skillGroups.length > 0 ||
    m.languages.length > 0;
  const hasCredentials = m.education.length > 0 || m.certifications.length > 0;
  const hasContact = Boolean(m.email || m.cvUrl || m.socials.length);

  const nav = [
    { id: "about", label: L.navAbout },
    hasSkills ? { id: "expertise", label: L.navExpertise } : null,
    m.experience.length ? { id: "experience", label: L.navExperience } : null,
    hasCredentials ? { id: "education", label: L.navEducation } : null,
    m.projects.length ? { id: "work", label: L.navWork } : null,
    articles.length ? { id: "writing", label: L.navWriting } : null,
    hasContact ? { id: "contact", label: L.navContact } : null,
  ].filter((n): n is { id: string; label: string } => Boolean(n));

  return (
    <main className="dx-site">
      {/* ---------- Introduction ---------- */}
      <section className="bg-canvas pt-6 pb-12 md:pt-10 md:pb-16">
        <Container>
          <nav aria-label="Breadcrumb">
            <ol className="text-surface-muted flex flex-wrap items-center gap-1 text-sm">
              <li>
                <Link href="/about" className="dx-link hover:text-surface-fg">
                  About
                </Link>
              </li>
              <li className="flex items-center gap-1">
                <ChevronRight aria-hidden className="size-3.5" />
                <Link
                  href="/about#team"
                  className="dx-link hover:text-surface-fg"
                >
                  Team
                </Link>
              </li>
              <li className="flex items-center gap-1">
                <ChevronRight aria-hidden className="size-3.5" />
                <span aria-current="page">{m.name}</span>
              </li>
            </ol>
          </nav>

          <div className="mt-8 grid gap-10 lg:mt-12 lg:grid-cols-[1.25fr_1fr] lg:items-center lg:gap-16">
            <div className="order-2 flex flex-col gap-6 lg:order-1">
              <div className="flex flex-wrap items-center gap-2">
                {m.availability && (
                  <span className="bg-mint-soft text-mint-deep inline-flex items-center gap-2 rounded-full px-3 py-1.5 text-xs font-bold">
                    <span className="relative flex size-2">
                      <span className="bg-mint absolute inset-0 animate-ping rounded-full opacity-70" />
                      <span className="bg-mint relative size-2 rounded-full" />
                    </span>
                    {m.availability}
                  </span>
                )}
                {m.sample && (
                  <span className="bg-royal/8 text-royal rounded-full px-3 py-1.5 text-xs font-bold">
                    Sample profile · development only
                  </span>
                )}
              </div>

              <div>
                <p className="text-eyebrow text-surface-muted">{m.role}</p>
                <Heading size="display" as="h1" className="mt-3">
                  {m.name}
                </Heading>
              </div>
              <p className="text-lead text-surface-fg/80 max-w-xl">
                {m.headline ?? m.bio}
              </p>
              <p className="text-surface-muted flex items-center gap-2 text-sm">
                <MapPin aria-hidden className="size-4" />
                {location}
              </p>

              {m.cvUrl && (
                <div className="flex flex-col gap-3 sm:flex-row sm:flex-wrap">
                  <Button
                    href={m.cvUrl}
                    external={m.cvUrl.startsWith("http")}
                    size="lg"
                    variant="outline"
                    block="mobile"
                  >
                    <Download aria-hidden className="size-4" />
                    {L.downloadCv}
                  </Button>
                </div>
              )}

              <div className="flex flex-wrap items-center gap-4">
                <SocialLinks socials={m.socials} />
                {m.email && (
                  <a
                    href={`mailto:${m.email}`}
                    className="dx-link inline-flex items-center gap-2 text-sm font-bold"
                  >
                    <Mail aria-hidden className="size-4" />
                    {m.email}
                  </a>
                )}
              </div>
            </div>

            <div className="order-1 lg:order-2">
              <div className="relative mx-auto max-w-sm lg:max-w-none">
                <TeamPortrait
                  member={m}
                  sizes="(min-width: 1024px) 40vw, 90vw"
                  priority
                  className="aspect-[4/5] rounded-[10px]"
                />
                {m.yearsExperience && (
                  <span className="bg-royal absolute -bottom-5 -left-3 rounded-[10px] px-5 py-4 text-white shadow-lg md:-left-6">
                    <span className="block font-[family-name:var(--font-accent)] text-4xl leading-none">
                      {m.yearsExperience}+
                    </span>
                    <span className="text-ice/80 mt-1 block text-xs">
                      {L.yearsBadge}
                    </span>
                  </span>
                )}
              </div>
            </div>
          </div>

          {stats.length > 0 && (
            <dl className="border-surface-rule mt-14 grid grid-cols-2 border-t md:grid-cols-4">
              {stats.map((s) => (
                <div
                  key={s.label}
                  className="border-surface-rule border-b py-5 pr-4 md:border-b-0"
                >
                  <dt className="sr-only">{s.label}</dt>
                  <dd className="font-[family-name:var(--font-accent)] text-5xl leading-none">
                    {s.value}
                  </dd>
                  <dd className="text-surface-muted mt-2 text-sm">{s.label}</dd>
                </div>
              ))}
            </dl>
          )}
        </Container>
      </section>

      <SectionNav items={nav} />

      {/* ---------- About ---------- */}
      <Section id="about" surface="white" className="scroll-mt-32">
        <Container className="grid gap-10 lg:grid-cols-[1fr_1.4fr] lg:gap-20">
          <div className="flex flex-col gap-6">
            <Eyebrow>{L.aboutEyebrow}</Eyebrow>
            <Heading size="h1">
              <AccentText text={named(L.aboutTitle)} />
            </Heading>
            {m.quote && (
              <figure
                data-surface={m.surface}
                className="bg-surface text-surface-fg rounded-[10px] p-6"
              >
                <Quote aria-hidden className="text-surface-accent size-6" />
                <blockquote className="mt-3 font-[family-name:var(--font-accent)] text-2xl leading-snug italic">
                  “{m.quote}”
                </blockquote>
              </figure>
            )}
          </div>
          <Reveal>
            <div
              className="dx-article text-lg"
              // Sanitised in team-data (renderArticle).
              dangerouslySetInnerHTML={{ __html: m.storyHtml }}
            />
            {m.funFact && (
              <p className="border-brand-cyan mt-8 border-l-2 pl-5">
                <span className="text-surface-muted block text-xs font-bold tracking-[0.08em] uppercase">
                  {L.funFact}
                </span>
                <span className="mt-1 block text-lg">{m.funFact}</span>
              </p>
            )}
            {m.brands.length > 0 && (
              <div className="mt-8">
                <p className="text-surface-muted text-xs font-bold tracking-[0.08em] uppercase">
                  {L.brands}
                </p>
                <ul className="mt-3 flex flex-wrap gap-2">
                  {m.brands.map((b) => (
                    <li
                      key={b}
                      className="border-surface-fg/20 rounded-full border px-4 py-2 text-sm"
                    >
                      {b}
                    </li>
                  ))}
                </ul>
              </div>
            )}
          </Reveal>
        </Container>
      </Section>

      {/* ---------- Expertise, software and languages ---------- */}
      {hasSkills && (
        <Section id="expertise" className="scroll-mt-32">
          <Container>
            <div className="mb-10 flex flex-col gap-4 md:mb-14">
              <Eyebrow>{L.expertiseEyebrow}</Eyebrow>
              <Heading size="h1">
                <AccentText text={named(L.expertiseTitle)} />
              </Heading>
              <p className="text-surface-muted max-w-2xl text-lg leading-relaxed">
                The areas {m.firstName} focuses on as a {m.role.toLowerCase()},
                and the skills, tools and technologies behind the work.
              </p>
            </div>

            {m.expertise.length > 0 && <SubHeading>{L.focusAreas}</SubHeading>}
            {m.expertise.length > 0 && (
              <RevealGroup className="mb-14 grid grid-cols-2 gap-3 lg:grid-cols-4">
                {m.expertise.map((e, i) => (
                  <RevealItem
                    key={e}
                    className="flex flex-col justify-between gap-6 rounded-[10px] bg-white p-4 ring-1 ring-black/5 md:gap-8 md:p-6"
                  >
                    <span className="text-brand font-[family-name:var(--font-accent)] text-4xl leading-none italic">
                      {String(i + 1).padStart(2, "0")}
                    </span>
                    <span className="text-base leading-snug font-bold md:text-h3 md:font-normal">
                      {e}
                    </span>
                  </RevealItem>
                ))}
              </RevealGroup>
            )}

            {(m.skillGroups.length > 0 || m.languages.length > 0) && (
              <>
                {m.expertise.length > 0 && <SubHeading>{L.skills}</SubHeading>}
                <RevealGroup className="grid items-stretch gap-4 md:grid-cols-2 xl:grid-cols-3">
                  {m.skillGroups.map((g, i) => (
                    <SkillGroupCard key={g.title} group={g} index={i} />
                  ))}
                  {m.languages.length > 0 && (
                    <LanguagesCard
                      languages={m.languages}
                      title={L.languages}
                    />
                  )}
                </RevealGroup>
              </>
            )}
          </Container>
        </Section>
      )}

      {/* ---------- Experience ---------- */}
      {m.experience.length > 0 && (
        <Section id="experience" surface="white" className="scroll-mt-32">
          <Container className="grid gap-10 lg:grid-cols-[1fr_1.6fr] lg:gap-20">
            <div className="flex flex-col gap-4 lg:sticky lg:top-44 lg:self-start">
              <Eyebrow>{L.experienceEyebrow}</Eyebrow>
              <Heading size="h1">
                <AccentText text={named(L.experienceTitle)} />
              </Heading>
            </div>
            <ExperienceTimeline items={m.experience} presentLabel={L.present} />
          </Container>
        </Section>
      )}

      {/* ---------- Education & certifications ---------- */}
      {hasCredentials && (
        <Section id="education" className="scroll-mt-32">
          <Container>
            <div className="mb-10 flex flex-col gap-4 md:mb-14">
              <Eyebrow>{L.educationEyebrow}</Eyebrow>
              <Heading size="h1">
                <AccentText text={named(L.educationTitle)} />
              </Heading>
            </div>
            <div className="grid gap-12 lg:grid-cols-2 lg:gap-10">
              {m.education.length > 0 && (
                <div>
                  <SubHeading
                    icon={<GraduationCap aria-hidden className="size-4" />}
                  >
                    {L.academic}
                  </SubHeading>
                  <EducationList items={m.education} />
                </div>
              )}
              {m.certifications.length > 0 && (
                <div>
                  <SubHeading
                    icon={<BadgeCheck aria-hidden className="size-4" />}
                  >
                    {L.professional}
                  </SubHeading>
                  <CertificationList items={m.certifications} />
                </div>
              )}
            </div>
          </Container>
        </Section>
      )}

      {/* ---------- Work ---------- */}
      {m.projects.length > 0 && (
        <Section id="work" surface="white" className="scroll-mt-32">
          <Container>
            <div className="mb-10 flex flex-col gap-3 md:mb-14 md:flex-row md:items-end md:justify-between">
              <div className="flex flex-col gap-3">
                <Eyebrow>
                  {m.projectsFromStudio ? L.studioEyebrow : L.workEyebrow}
                </Eyebrow>
                <Heading size="h1">
                  <AccentText
                    text={named(
                      m.projectsFromStudio ? L.studioTitle : L.workTitle,
                    )}
                  />
                </Heading>
              </div>
              <Link
                href="/works"
                className="dx-link self-start text-sm font-bold md:self-auto"
              >
                {L.seeAllWorks}
              </Link>
            </div>
            <div className="grid gap-x-6 gap-y-12 md:grid-cols-2">
              {m.projects.map((p) => {
                const card = (
                  <>
                    <span className="bg-surface-fg/5 relative block aspect-[16/10] overflow-hidden rounded-[10px]">
                      <Image
                        src={p.image}
                        alt=""
                        fill
                        sizes="(min-width: 768px) 50vw, 100vw"
                        className="object-cover transition-transform duration-700 ease-(--ease-out-expo) group-hover:scale-105"
                      />
                    </span>
                    <span className="mt-4 flex items-start justify-between gap-3">
                      <span className="text-h3">{p.title}</span>
                      {p.url && (
                        <ArrowUpRight
                          aria-hidden
                          className="mt-1 size-5 shrink-0 transition-transform group-hover:translate-x-0.5 group-hover:-translate-y-0.5"
                        />
                      )}
                    </span>
                    {p.description && (
                      <span className="text-surface-muted mt-2 line-clamp-2 block text-sm leading-relaxed">
                        {p.description}
                      </span>
                    )}
                  </>
                );
                return p.url ? (
                  <Link
                    key={p.title}
                    href={p.url}
                    className="group block"
                    data-cursor="View"
                  >
                    {card}
                  </Link>
                ) : (
                  <div key={p.title} className="group">
                    {card}
                  </div>
                );
              })}
            </div>
          </Container>
        </Section>
      )}

      {/* ---------- Writing ---------- */}
      {articles.length > 0 && (
        <Section id="writing" className="scroll-mt-32">
          <Container>
            <div className="mb-10 flex flex-col gap-3">
              <Eyebrow>{L.writingEyebrow}</Eyebrow>
              <Heading size="h1">
                <AccentText text={named(L.writingTitle)} />
              </Heading>
            </div>
            <div className="grid gap-x-6 gap-y-12 md:grid-cols-2 xl:grid-cols-3">
              {articles.map((t) => (
                <PostCard key={t.id} post={t} />
              ))}
            </div>
          </Container>
        </Section>
      )}

      {/* ---------- Contact ---------- */}
      {hasContact && (
        <Section id="contact" surface="ice" className="scroll-mt-32">
          <Container className="grid gap-10 lg:grid-cols-[1.3fr_1fr] lg:items-end lg:gap-16">
            <div className="flex flex-col gap-5">
              <Eyebrow>{L.contactEyebrow}</Eyebrow>
              <Heading size="display">
                <AccentText text={named(L.contactTitle)} />
              </Heading>
              <p className="text-surface-fg/80 max-w-xl text-lg leading-relaxed">
                {named(L.contactBody)}
              </p>
            </div>
            <div className="flex flex-col gap-4">
              {m.email && (
                <Button
                  href={`mailto:${m.email}`}
                  variant="outline"
                  size="lg"
                  block
                >
                  <Mail aria-hidden className="size-4" />
                  {m.email}
                </Button>
              )}
              {m.cvUrl && (
                <Button
                  href={m.cvUrl}
                  external={m.cvUrl.startsWith("http")}
                  variant="outline"
                  size="lg"
                  block
                >
                  <Download aria-hidden className="size-4" />
                  {L.downloadCv}
                </Button>
              )}
              <SocialLinks socials={m.socials} size="lg" className="mt-2" />
            </div>
          </Container>
        </Section>
      )}
    </main>
  );
}
