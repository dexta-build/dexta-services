import assert from "node:assert/strict";
import { describe, it } from "node:test";
import { dextaAcademy2Manifest } from "@/lib/school-template-manifests/dexta-academy-2";
import { schoolTemplateManifests } from "@/lib/school-template-manifests";
import {
  applySchoolNameFallbackToProjectContent,
  buildSchoolTemplateProjectContent,
  buildSchoolTemplateSourceSnapshot,
  syncSchoolTemplateProjectContentWithManifest,
} from "@/lib/school-template-project-content";
import { renderSchoolTemplatePreview } from "@/lib/school-template-preview-renderer";

describe("school template preview renderer", () => {
  it("keeps internal page links inside the edited project preview for every template", async () => {
    for (const manifest of schoolTemplateManifests) {
      const content = buildSchoolTemplateProjectContent(manifest);
      const sourceSnapshot = buildSchoolTemplateSourceSnapshot(manifest);
      const page =
        content.pages.find((item) => item.isHome) ?? content.pages[0];

      assert.ok(page, `Expected ${manifest.templateSlug} to provide pages.`);

      const html = await renderSchoolTemplatePreview({
        content,
        sourceSnapshot,
        pageSlug: page.slug,
      });

      assert.ok(html, `Expected preview HTML for ${manifest.templateSlug}.`);
      assert.match(html, /function getPreviewRouteBase/);
      assert.match(html, /function getPreviewNavigationTarget/);
      assert.match(html, /function rewritePreviewInternalLinks/);
      assert.match(html, /document\.querySelectorAll\("a\[href\]"\)/);
      assert.match(html, /preview\.content\.pages\.find/);
      assert.ok(
        html.includes(
          String.raw`window.location.pathname.match(/^(.*\/admin\/we-brand-schools\/projects\/[^/]+\/preview)\/[^/]+$/)`,
        ),
        `Expected ${manifest.templateSlug} preview route matching regex to stay escaped.`,
      );
      assert.ok(
        html.includes(String.raw`if (/^https?:\/\//i.test(href))`),
        `Expected ${manifest.templateSlug} same-origin URL regex to stay escaped.`,
      );
      assert.ok(
        html.includes(
          String.raw`pathname = pathname.replace(/\\/g, "/").replace(/^\.\//, "");`,
        ),
        `Expected ${manifest.templateSlug} path normalization regexes to stay escaped.`,
      );
      assert.ok(
        html.includes(
          'routeBase + "/" + encodeURIComponent(target.slug) + window.location.search + target.hash',
        ),
        `Expected ${manifest.templateSlug} preview links to target project preview routes.`,
      );

      for (const contentPage of content.pages) {
        assert.ok(
          html.includes(`"fileName":"${contentPage.fileName}"`),
          `Expected ${manifest.templateSlug} preview runtime to include ${contentPage.fileName}.`,
        );
      }
    }
  });

  it("uses the project school identity for the preview title and favicon", async () => {
    for (const manifest of schoolTemplateManifests) {
      const content = applySchoolNameFallbackToProjectContent(
        buildSchoolTemplateProjectContent(manifest),
        "PNEUMA ACADEMY",
      );
      content.theme.logoUrl = "https://example.com/pneuma-logo.png";
      const sourceSnapshot = buildSchoolTemplateSourceSnapshot(manifest);
      const page =
        content.pages.find((item) => item.isHome) ?? content.pages[0];

      assert.ok(page, `Expected ${manifest.templateSlug} to provide pages.`);

      const html = await renderSchoolTemplatePreview({
        content,
        sourceSnapshot,
        pageSlug: page.slug,
      });

      assert.ok(html, `Expected preview HTML for ${manifest.templateSlug}.`);
      assert.match(html, /<title>PNEUMA ACADEMY<\/title>/);
      assert.match(
        html,
        /<link\b(?=[^>]*\brel="icon")(?=[^>]*\bhref="https:\/\/example\.com\/pneuma-logo\.png")/,
      );
      assert.match(html, /document\.title = pageTitle && !isHomeTitle/);

      const otherPage = content.pages.find((item) => !item.isHome);
      if (otherPage) {
        const otherHtml = await renderSchoolTemplatePreview({
          content,
          sourceSnapshot,
          pageSlug: otherPage.slug,
        });

        assert.ok(
          otherHtml?.includes(
            `<title>PNEUMA ACADEMY | ${otherPage.title}</title>`,
          ),
          `Expected ${manifest.templateSlug} non-home page title to include the page name.`,
        );
      }
    }
  });

  it("does not replace an admin-edited school brand name with the application name", () => {
    const manifest = schoolTemplateManifests.find(
      (item) => item.templateSlug === "dexta-academy-1",
    );
    assert.ok(manifest);

    const content = buildSchoolTemplateProjectContent(manifest);
    content.theme.brandName = "Admin School Name";

    const synced = applySchoolNameFallbackToProjectContent(
      content,
      "PNEUMA ACADEMY",
    );

    assert.equal(synced.theme.brandName, "Admin School Name");
  });

  it("lets admins edit the browser title separately from the navbar school name", async () => {
    const manifest = schoolTemplateManifests.find(
      (item) => item.templateSlug === "dexta-academy-1",
    );
    assert.ok(manifest);

    const content = applySchoolNameFallbackToProjectContent(
      buildSchoolTemplateProjectContent(manifest),
      "PNEUMA ACADEMY",
    );
    content.theme.documentTitle = "Pneuma School Portal";
    const sourceSnapshot = buildSchoolTemplateSourceSnapshot(manifest);
    const aboutPage = content.pages.find((page) => page.slug === "about");
    assert.ok(aboutPage);

    const homeHtml = await renderSchoolTemplatePreview({
      content,
      sourceSnapshot,
      pageSlug: "home",
    });

    assert.match(homeHtml ?? "", /<title>Pneuma School Portal<\/title>/);

    const aboutHtml = await renderSchoolTemplatePreview({
      content,
      sourceSnapshot,
      pageSlug: aboutPage.slug,
    });

    assert.ok(
      aboutHtml?.includes(
        `<title>Pneuma School Portal | ${aboutPage.title}</title>`,
      ),
    );
  });

  it("keeps Template 2 Values Strip intro title sourced from the title field, not the body field", async () => {
    const content = buildSchoolTemplateProjectContent(dextaAcademy2Manifest);
    const sourceSnapshot = buildSchoolTemplateSourceSnapshot(
      dextaAcademy2Manifest,
    );
    const values = content.pages
      .find((page) => page.slug === "home")
      ?.sections.find((section) => section.id === "values");

    assert.ok(values, "Expected Template 2 Values Strip content.");
    values.fields.title = "Correct legacy intro title";
    values.fields.introTitle = "Intro body leaked into title";
    values.fields.introBody = "Intro body leaked into title";

    const html = await renderSchoolTemplatePreview({
      content,
      sourceSnapshot,
      pageSlug: "home",
    });

    assert.ok(html, "Expected Template 2 home preview HTML.");
    assert.match(html, /function getTemplateTwoValuesIntroTitle/);
    assert.match(html, /function toComparableText/);
    assert.match(html, /function setElementHtml/);
    assert.match(html, /function toInlineHtml/);
    assert.match(
      html,
      /var title = getPageSectionField\("home", "values", "title"\)/,
    );
    assert.match(
      html,
      /toComparableText\(introTitle\) === toComparableText\(introBody\)/,
    );
    assert.match(html, /setElementHtml\(node, value\)/);
    assert.match(html, /Correct legacy intro title/);
  });

  it("uses Montserrat for Template 2 navbar, footer, and buttons when projects carry the old default font", async () => {
    const content = buildSchoolTemplateProjectContent(dextaAcademy2Manifest);
    const sourceSnapshot = buildSchoolTemplateSourceSnapshot(
      dextaAcademy2Manifest,
    );

    content.theme.navLinkFontFamily =
      '"Plus Jakarta Sans", "Segoe UI", sans-serif';

    const html = await renderSchoolTemplatePreview({
      content,
      sourceSnapshot,
      pageSlug: "home",
    });

    assert.ok(html, "Expected Template 2 home preview HTML.");
    assert.match(html, /function getTemplateChromeFont/);
    assert.match(html, /\.site-footer/);
    assert.match(html, /\.button/);
    assert.match(
      html,
      /Montserrat:ital,wght@0,100\.\.900;1,100\.\.900&display=swap/,
    );
    assert.match(html, /normalized\.indexOf\("plus jakarta sans"\) !== -1/);
  });

  it("covers direct hero background images in the preview runtime", async () => {
    const manifest = schoolTemplateManifests.find(
      (item) => item.templateSlug === "dexta-academy-5",
    );

    assert.ok(manifest, "Expected Template 5 manifest.");

    const content = buildSchoolTemplateProjectContent(manifest);
    const sourceSnapshot = buildSchoolTemplateSourceSnapshot(manifest);

    const html = await renderSchoolTemplatePreview({
      content,
      sourceSnapshot,
      pageSlug: "home",
    });

    assert.ok(html, "Expected Template 5 home preview HTML.");
    assert.match(html, /function shouldCoverBackgroundImage/);
    assert.match(html, /node\.style\.backgroundSize = "cover"/);
    assert.match(html, /node\.style\.backgroundPosition = "center center"/);
    assert.match(html, /node\.style\.backgroundRepeat = "no-repeat"/);
  });

  it("exposes Template 1 preview controls without using shared template paths", async () => {
    const manifest = schoolTemplateManifests.find(
      (item) => item.templateSlug === "dexta-academy-1",
    );

    assert.ok(manifest, "Expected Template 1 manifest.");

    const headerFields =
      manifest.sharedSections.find((section) => section.id === "site-header")
        ?.fields ?? [];
    const heroFields =
      manifest.pages
        .find((page) => page.slug === "home")
        ?.sections.find((section) => section.id === "hero")?.fields ?? [];
    const aboutPreviewFields =
      manifest.pages
        .find((page) => page.slug === "home")
        ?.sections.find((section) => section.id === "about-preview")?.fields ??
      [];
    const academicsFields =
      manifest.pages
        .find((page) => page.slug === "home")
        ?.sections.find((section) => section.id === "academics")?.fields ?? [];
    const homeSections =
      manifest.pages.find((page) => page.slug === "home")?.sections ?? [];
    const galleryFields =
      homeSections.find((section) => section.id === "gallery")?.fields ?? [];
    const testimonialsFields =
      homeSections.find((section) => section.id === "testimonials")?.fields ??
      [];
    const admissionsSection = homeSections.find(
      (section) => section.id === "admissions",
    );
    const admissionsFields = admissionsSection?.fields ?? [];
    const contactFields =
      homeSections.find((section) => section.id === "contact")?.fields ?? [];
    const aboutSections =
      manifest.pages.find((page) => page.slug === "about")?.sections ?? [];
    const visionFields =
      aboutSections.find((section) => section.id === "vision")?.fields ?? [];
    const valuesSection = aboutSections.find(
      (section) => section.id === "values",
    );
    const valuesFields = valuesSection?.fields ?? [];
    const aboutCtaFields =
      aboutSections.find((section) => section.id === "about-cta")?.fields ?? [];
    const storyFields =
      aboutSections.find((section) => section.id === "story")?.fields ?? [];
    const testimonialPageSections =
      manifest.pages.find((page) => page.slug === "testimonials")?.sections ??
      [];
    const successStoryFields =
      testimonialPageSections.find((section) => section.id === "success-story")
        ?.fields ?? [];
    const testimonialsHeroFields =
      testimonialPageSections.find((section) => section.id === "hero")
        ?.fields ?? [];
    const familyNotesSection = testimonialPageSections.find(
      (section) => section.id === "testimonial-wall",
    );
    const familyNotesFields = familyNotesSection?.fields ?? [];

    assert.ok(
      headerFields.some((field) => field.key === "logoWidthMobile"),
      "Expected Template 1 navbar to expose mobile logo sizing.",
    );
    assert.ok(
      heroFields.some((field) => field.key === "headlineTabletFontSize"),
      "Expected Template 1 hero to expose tablet headline sizing.",
    );
    assert.ok(
      heroFields.some((field) => field.key === "lineOrangeOpacity"),
      "Expected Template 1 hero to expose animated line opacity.",
    );
    assert.ok(
      heroFields.some((field) => field.key === "headlineMobileFontSize"),
      "Expected Template 1 hero to expose mobile headline sizing.",
    );
    assert.ok(
      heroFields.some((field) => field.key === "bodyMobileFontSize"),
      "Expected Template 1 hero to expose mobile body sizing.",
    );
    assert.ok(
      heroFields.some((field) => field.key === "buttonMobileFontSize") &&
        heroFields.some((field) => field.key === "buttonMobileMinHeight"),
      "Expected Template 1 hero to expose mobile button sizing.",
    );
    assert.ok(
      heroFields.some((field) => field.key === "cardCenterBgColor"),
      "Expected Template 1 hero to expose image card background colors.",
    );
    assert.ok(
      aboutPreviewFields.some(
        (field) =>
          field.key === "imageBorderStyle" &&
          field.type === "select" &&
          field.options?.some((option) => option.value === "dotted"),
      ),
      "Expected Template 1 about preview image border pattern dropdown.",
    );
    assert.ok(
      academicsFields.some(
        (field) =>
          field.key === "cardIconColor" &&
          field.selector.includes(".landing-academics__card"),
      ),
      "Expected Template 1 academics cards to expose per-card icon colors.",
    );
    assert.ok(
      academicsFields.some(
        (field) =>
          field.key === "cardBgColor" &&
          field.selector === ".landing-academics__card",
      ),
      "Expected Template 1 academics cards to expose per-card background colors.",
    );
    assert.ok(
      academicsFields.some(
        (field) =>
          field.key === "iconClass" &&
          field.selector.includes(".landing-academics__card"),
      ),
      "Expected Template 1 academics icon class to be editable per card.",
    );
    assert.ok(
      academicsFields.every((field) => field.uiGroup !== "Icon style"),
      "Template 1 academics should not expose the shared section-level Icon style group.",
    );
    assert.ok(
      academicsFields.some(
        (field) =>
          field.key === "cardIconImage" &&
          field.type === "image" &&
          field.selector.includes(".landing-academics__card"),
      ),
      "Expected Template 1 academics card icon images to be editable per card.",
    );
    assert.ok(
      academicsFields.some((field) => field.key === "performanceChartBgColor"),
      "Expected Template 1 Academic Performance to expose inner background color.",
    );
    assert.ok(
      academicsFields.some((field) => field.key === "performanceBarGreenLabel"),
      "Expected Template 1 Academic Performance chart labels to be editable.",
    );
    assert.ok(
      academicsFields.some(
        (field) => field.key === "performanceBarGreenHeight",
      ),
      "Expected Template 1 Academic Performance chart heights to be editable.",
    );
    assert.ok(
      galleryFields.some((field) => field.key === "paginationBgColor") &&
        galleryFields.some((field) => field.key === "paginationTextColor"),
      "Expected Template 1 gallery pagination button colors to be editable.",
    );
    assert.ok(
      testimonialsFields.some(
        (field) =>
          field.key === "relationship" &&
          field.type === "select" &&
          field.options?.some((option) => option.value === "Guardian"),
      ),
      "Expected Template 1 testimonials to expose Parent/Guardian dropdown.",
    );
    assert.equal(
      admissionsSection && "repeatable" in admissionsSection
        ? admissionsSection.repeatable?.itemSelector
        : undefined,
      ".landing-step",
      "Expected Template 1 admissions steps to be editable as cards.",
    );
    assert.ok(
      admissionsFields.some((field) => field.key === "stepNumber") &&
        admissionsFields.some((field) => field.key === "stepCardBgColor") &&
        admissionsFields.some((field) => field.key === "stepNumberColor") &&
        admissionsFields.some((field) => field.key === "stepTitleColor") &&
        admissionsFields.some((field) => field.key === "stepBodyColor"),
      "Expected Template 1 admissions cards to expose number/text, text color, and card color controls.",
    );
    assert.ok(
      contactFields.some((field) => field.key === "addressIconClass") &&
        contactFields.some((field) => field.key === "addressCardBgColor"),
      "Expected Template 1 contact info icons and card backgrounds to be editable.",
    );
    assert.ok(
      storyFields.some(
        (field) =>
          field.key === "title" &&
          field.selector === ".about-page__story-copy > .about-page__heading",
      ),
      "Expected Template 1 Our Story title to use a section-level selector.",
    );
    assert.ok(
      visionFields.some((field) => field.key === "cardBgColor") &&
        visionFields.some((field) => field.key === "cardTextColor") &&
        visionFields.some((field) => field.key === "cardIconColor") &&
        visionFields.some((field) => field.key === "cardIconBgColor") &&
        visionFields.some((field) => field.key === "cardIconImage") &&
        visionFields.some((field) => field.key === "iconClass"),
      "Expected Template 1 vision and mission panels to expose per-card background, text, and icon controls.",
    );
    assert.equal(
      valuesSection && "repeatable" in valuesSection
        ? valuesSection.repeatable?.itemSelector
        : undefined,
      "article, .about-page__value",
      "Expected Template 1 core value cards to remain repeatable.",
    );
    assert.ok(
      valuesFields.some((field) => field.key === "cardBgColor") &&
        valuesFields.some((field) => field.key === "cardTextColor") &&
        valuesFields.some((field) => field.key === "cardIconColor") &&
        valuesFields.some((field) => field.key === "cardIconBgColor") &&
        valuesFields.some((field) => field.key === "cardIconImage") &&
        valuesFields.some((field) => field.key === "iconClass"),
      "Expected Template 1 core value cards to expose per-card background, text, and icon controls.",
    );
    assert.ok(
      aboutCtaFields.some(
        (field) =>
          field.key === "cardBgColor" &&
          field.cssVariable === "--dexta-academy-1-about-cta-card-bg-color",
      ),
      "Expected Template 1 about CTA to expose a separate card background color.",
    );
    assert.ok(
      successStoryFields.some(
        (field) =>
          field.key === "videoUrl" &&
          field.type === "link" &&
          field.selector === ".testimonials-page__video-card" &&
          field.attribute === "data-video-url",
      ),
      "Expected Template 1 featured success story to expose a video link control.",
    );
    assert.ok(
      testimonialsHeroFields.some(
        (field) =>
          field.key === "image" &&
          field.type === "image" &&
          field.selector === ".testimonials-page__hero-main img",
      ),
      "Expected Template 1 testimonials hero to expose the visible hero image.",
    );
    assert.ok(
      successStoryFields.some(
        (field) =>
          field.key === "body" &&
          field.selector === ".testimonials-page__story-body",
      ),
      "Expected Template 1 success story body to target only its body container.",
    );
    assert.equal(
      familyNotesSection && "repeatable" in familyNotesSection
        ? familyNotesSection.repeatable?.itemSelector
        : undefined,
      ".testimonials-page__wall-card",
      "Expected Template 1 family notes to be addable/deletable as exact wall cards.",
    );
    assert.ok(
      familyNotesFields.some(
        (field) =>
          field.key === "author" &&
          field.selector === ".testimonials-page__wall-meta strong",
      ) &&
        familyNotesFields.some(
          (field) =>
            field.key === "year" &&
            field.selector === ".testimonials-page__wall-meta span",
        ),
      "Expected Template 1 family notes to expose family name and year per card.",
    );

    const content = buildSchoolTemplateProjectContent(manifest);
    const sourceSnapshot = buildSchoolTemplateSourceSnapshot(manifest);
    content.theme.loadingBarColor = "#f97316";
    const homeHeroSection = content.pages
      .find((page) => page.slug === "home")
      ?.sections.find((section) => section.id === "hero");
    assert.ok(homeHeroSection, "Expected Template 1 home hero content.");
    homeHeroSection.fields.headlineTabletFontSize = 49;
    homeHeroSection.fields.headlineMobileFontSize = 31;
    homeHeroSection.fields.bodyTabletFontSize = 19;
    homeHeroSection.fields.bodyMobileFontSize = 15;
    homeHeroSection.fields.headline =
      '<span style="font-size:88px">Responsive hero headline</span>';
    homeHeroSection.fields.body =
      '<span style="font-size:28px">Responsive hero body.</span>';
    homeHeroSection.fields.buttonTabletFontSize = 14;
    homeHeroSection.fields.buttonMobileFontSize = 12;
    homeHeroSection.fields.buttonTabletMinHeight = 48;
    homeHeroSection.fields.buttonMobileMinHeight = 42;

    const html = await renderSchoolTemplatePreview({
      content,
      sourceSnapshot,
      pageSlug: "home",
    });

    assert.ok(html, "Expected Template 1 home preview HTML.");
    assert.match(html, /font-awesome\/6\.5\.2\/css\/all\.min\.css/);
    assert.doesNotMatch(html, /font-awesome\/5\.10\.0\/css\/all\.min\.css/);
    assert.match(html, /function academyOneSectionBackground/);
    assert.ok(
      html.includes(
        'background-image:linear-gradient(" + overlay + "," + overlay + "),var(" + prefix + "section-bg-image,none)!important',
      ),
      "Expected Template 1 section background color to overlay the background image.",
    );
    assert.match(
      html,
      /academyOneSectionBackground\("\.school-hero", "home", "hero", "#fff"\)/,
    );
    assert.match(
      html,
      /academyOneSectionBackground\("\.landing-section--gallery", "home", "gallery", "#fff"\)/,
    );
    assert.match(
      html,
      /class="school-hero__streaks school-hero__streaks--desktop"/,
    );
    assert.match(html, /data-dexta-template1-loader="true"/);
    assert.match(html, /window\.setTimeout\(function\(\).*?\},30000\);/);
    assert.match(
      html,
      /html\[data-dexta-project-preview="loading"\] body\{opacity:1!important;\}/,
    );
    assert.doesNotMatch(
      html,
      /html\[data-dexta-project-preview="loading"\] body\{opacity:0!important;\}/,
    );
    assert.match(
      html,
      /html\[data-dexta-project-preview="loading"\] #spinner\{display:flex!important;opacity:1!important;visibility:visible!important;pointer-events:auto!important;transition:opacity \.55s ease-out,visibility 0s linear \.55s!important;\}/,
    );
    assert.match(
      html,
      /html\[data-dexta-project-preview="ready"\] #spinner\.dexta-template-one-loader\{display:flex!important;opacity:0!important;visibility:hidden!important;pointer-events:none!important;transition:opacity \.55s ease-out,visibility 0s linear \.55s!important;\}/,
    );
    assert.match(
      html,
      /html\[data-dexta-project-preview="ready"\] #spinner\.dexta-template-one-loader>\*\{opacity:1!important;visibility:visible!important;\}/,
    );
    assert.match(html, /dexta-template-one-loader/);
    assert.match(html, /class="dexta-loading-logo"/);
    assert.match(html, /DXT-Logo_mmyi2e\.png/);
    assert.match(
      html,
      /#spinner\.dexta-template-one-loader \.spinner-border\{width:3rem!important;height:3rem!important;\}/,
    );
    assert.match(
      html,
      /#spinner\.dexta-template-one-loader \.spinner-border\{color:#f97316!important;\}/,
    );
    assert.match(html, /--dexta-academy-1-home-hero-line-orange-opacity/);
    assert.match(html, /--dexta-academy-1-home-hero-headline-mobile-font-size/);
    assert.match(html, /academyOneHeroTextSize/);
    assert.match(html, /isTemplateOneHomeHeroText/);
    assert.match(html, /isTemplateOneHomeHeroText && property === "font-size"/);
    assert.match(
      html,
      /headline-tablet-font-size,' \+ academyOneHeroHeadlineTabletSize \+ '\)/,
    );
    assert.match(
      html,
      /headline-mobile-font-size,' \+ academyOneHeroHeadlineMobileSize \+ '\)/,
    );
    assert.match(html, /"headlineTabletFontSize":49/);
    assert.match(html, /"headlineMobileFontSize":31/);
    assert.match(html, /"bodyTabletFontSize":19/);
    assert.match(html, /"bodyMobileFontSize":15/);
    assert.match(html, /--dexta-academy-1-home-hero-button-mobile-font-size/);
    assert.match(html, /--dexta-academy-1-home-hero-button-mobile-min-height/);
    assert.match(html, /"buttonTabletFontSize":14/);
    assert.match(html, /"buttonMobileFontSize":12/);
    assert.match(html, /"buttonTabletMinHeight":48/);
    assert.match(html, /"buttonMobileMinHeight":42/);
    assert.match(html, /--dexta-academy-1-home-hero-card-center-bg-color/);
    assert.match(
      html,
      /--dexta-academy-1-home-about-preview-image-border-style/,
    );
    assert.match(html, /--dexta-academy-1-home-academics-card-icon-color/);
    assert.match(html, /--dexta-academy-1-home-academics-card-icon-image/);
    assert.match(html, /node\.querySelectorAll\("i"\)\.forEach/);
    assert.match(html, /--dexta-academy-1-home-academics-card-bg-color/);
    assert.match(
      html,
      /--dexta-academy-1-home-academics-performance-chart-bg-color/,
    );
    assert.match(
      html,
      /--dexta-academy-1-home-academics-performance-bar-green-height/,
    );
    assert.match(html, /--dexta-academy-1-home-gallery-pagination-bg-color/);
    assert.match(html, /function applyTemplateOneLandingGalleryPagination/);
    assert.match(html, /var pageSize = 6/);
    assert.match(html, /dexta-template1-gallery-paginated/);
    assert.match(html, /data-dexta-preview-gallery-delegated/);
    assert.match(
      html,
      /grid\.addEventListener\("click", handleTemplateOneGalleryClick, true\)/,
    );
    assert.match(html, /event\.stopImmediatePropagation/);
    assert.match(html, /function restoreTemplateOneGalleryItemImage/);
    assert.match(html, /function getTemplateOneGalleryImageSource/);
    assert.match(html, /galleryPayloadItems/);
    assert.match(html, /function openTemplateOneGalleryModal/);
    assert.match(html, /dexta-template1-gallery-backdrop/);
    assert.match(
      html,
      /\.landing-section--gallery \.landing-gallery:not\(\.dexta-template1-gallery-paginated\) \.landing-gallery__item:nth-of-type\(n\+7\)\{display:none!important;\}/,
    );
    assert.match(
      html,
      /\.landing-section--gallery \.landing-gallery__body\{display:none!important;\}/,
    );
    assert.match(html, /data-dexta-preview-gallery-observed/);
    assert.match(html, /function applyTemplateOneFamilyNotesPagination/);
    assert.match(html, /var isTemplateOneFamilyNotes/);
    assert.match(
      html,
      /sectionContent\.repeatable \|\| isTemplateOneFamilyNotes/,
    );
    assert.match(html, /sectionContent\.id === "testimonial-wall"/);
    assert.match(html, /data-dexta-repeatable-hidden/);
    assert.match(
      html,
      /card\.getAttribute\("data-dexta-repeatable-hidden"\) !== "true"/,
    );
    assert.match(html, /data-family-notes-pagination/);
    assert.match(html, /data-dexta-preview-family-notes-observed/);
    assert.match(
      html,
      /\.testimonials-page__section--wall \.testimonials-page__wall:not\(\.dexta-template1-wall-paginated\) \.testimonials-page__wall-card:nth-of-type\(n\+7\)\{display:none!important;\}/,
    );
    assert.match(html, /--dexta-academy-1-home-admissions-step-card-bg-color/);
    assert.match(html, /--dexta-academy-1-home-admissions-step-number-color/);
    assert.match(html, /--dexta-academy-1-home-admissions-step-title-color/);
    assert.match(html, /--dexta-academy-1-home-admissions-step-body-color/);
    assert.match(html, /--dexta-academy-1-home-contact-address-card-bg-color/);
    assert.match(html, /landing-contact__socials a/);
    assert.match(html, /String\(value\)\.trim\(\) !== "#"/);
    assert.match(html, /--dexta-academy-1-shared-navbar-logo-width-mobile/);
    assert.match(html, /var shouldHideEmptyRepeatable/);
    assert.match(html, /sectionContent\.id === "testimonials"/);

    const aboutStorySection = content.pages
      .find((page) => page.slug === "about")
      ?.sections.find((section) => section.id === "story");
    assert.ok(aboutStorySection, "Expected Template 1 about story content.");
    aboutStorySection.fields.title = "Admin editable story title";
    const aboutValuesSection = content.pages
      .find((page) => page.slug === "about")
      ?.sections.find((section) => section.id === "values");
    assert.ok(aboutValuesSection?.repeatable, "Expected core values content.");
    aboutValuesSection.repeatable.items.push({
      valueTitle: "New core value",
      valueBody: "Describe this core value.",
      iconClass: "fa fa-star",
      cardBgColor: "#112233",
      cardTextColor: "#ffffff",
      cardIconColor: "#f97316",
      cardIconBgColor: "#fff7ed",
    });
    aboutValuesSection.repeatable.items.push({});

    const aboutHtml = await renderSchoolTemplatePreview({
      content,
      sourceSnapshot,
      pageSlug: "about",
    });

    assert.ok(aboutHtml, "Expected Template 1 about preview HTML.");
    assert.match(aboutHtml, /Admin editable story title/);
    assert.match(aboutHtml, /New core value/);
    assert.match(aboutHtml, /Describe this core value\./);
    assert.match(aboutHtml, /fa fa-star/);
    assert.match(aboutHtml, /--dexta-academy-1-about-vision-card-bg-color/);
    assert.match(aboutHtml, /--dexta-academy-1-about-values-card-bg-color/);
    assert.match(
      aboutHtml,
      /--dexta-academy-1-about-values-card-icon-bg-color/,
    );
    assert.match(aboutHtml, /--dexta-academy-1-about-cta-card-bg-color/);
    assert.match(aboutHtml, /itemRoot\.removeAttribute\("data-reveal"\)/);

    const successStorySection = content.pages
      .find((page) => page.slug === "testimonials")
      ?.sections.find((section) => section.id === "success-story");
    assert.ok(
      successStorySection,
      "Expected Template 1 success story content.",
    );
    successStorySection.fields.videoUrl = "https://youtu.be/dQw4w9WgXcQ";
    const familyNotesContent = content.pages
      .find((page) => page.slug === "testimonials")
      ?.sections.find((section) => section.id === "testimonial-wall");
    assert.ok(familyNotesContent?.repeatable, "Expected family notes content.");
    familyNotesContent.repeatable.items = [];

    const syncedAfterFamilyNotesDeletion =
      syncSchoolTemplateProjectContentWithManifest({
        content,
        sourceSnapshot,
        rawContent: content,
        templateSlug: manifest.templateSlug,
      }).contentJson;
    const syncedFamilyNotes = syncedAfterFamilyNotesDeletion.pages
      .find((page) => page.slug === "testimonials")
      ?.sections.find((section) => section.id === "testimonial-wall");
    assert.equal(
      syncedFamilyNotes?.repeatable?.items.length,
      0,
      "Expected Template 1 family notes sync to preserve admin deletion instead of restoring default cards.",
    );
    const contentWithLegacyDeletedFamilyNotes = JSON.parse(
      JSON.stringify(content),
    ) as typeof content;
    const legacyDeletedFamilyNotesSection =
      contentWithLegacyDeletedFamilyNotes.pages
        .find((page) => page.slug === "testimonials")
        ?.sections.find((section) => section.id === "testimonial-wall");
    assert.ok(
      legacyDeletedFamilyNotesSection,
      "Expected legacy family notes content.",
    );
    delete legacyDeletedFamilyNotesSection.repeatable;
    const syncedLegacyDeletedFamilyNotes =
      syncSchoolTemplateProjectContentWithManifest({
        content: contentWithLegacyDeletedFamilyNotes,
        sourceSnapshot,
        rawContent: contentWithLegacyDeletedFamilyNotes,
        templateSlug: manifest.templateSlug,
      })
        .contentJson.pages.find((page) => page.slug === "testimonials")
        ?.sections.find((section) => section.id === "testimonial-wall");
    assert.equal(
      syncedLegacyDeletedFamilyNotes?.repeatable?.items.length,
      0,
      "Expected Template 1 family notes sync to avoid restoring defaults when saved repeatable data is absent.",
    );

    const testimonialsHtml = await renderSchoolTemplatePreview({
      content: syncedAfterFamilyNotesDeletion,
      sourceSnapshot,
      pageSlug: "testimonials",
    });

    assert.ok(
      testimonialsHtml,
      "Expected Template 1 testimonials preview HTML.",
    );
    assert.ok(
      testimonialsHtml.includes('"videoUrl":"https://youtu.be/dQw4w9WgXcQ"'),
      "Expected Template 1 testimonials preview payload to include the admin video link.",
    );
    assert.match(
      testimonialsHtml,
      /function applyTemplateOneSuccessStoryVideo/,
    );
    assert.match(testimonialsHtml, /class="testimonials-page__story-body"/);
    assert.match(
      testimonialsHtml,
      /function applyTemplateOneFamilyNotesPagination/,
    );
    assert.match(testimonialsHtml, /"id":"testimonial-wall"/);
    assert.match(testimonialsHtml, /"items":\[\]/);
    assert.match(testimonialsHtml, /\^https\?:\\\/\\\//);
    assert.match(testimonialsHtml, /dexta-template1-video-modal/);
    assert.match(testimonialsHtml, /youtube\.com\/embed/);
  });

  it("renders Template 3 hero art through the main sky image layer", async () => {
    const manifest = schoolTemplateManifests.find(
      (item) => item.templateSlug === "dexta-academy-3",
    );

    assert.ok(manifest, "Expected Template 3 manifest.");
    const heroFields = manifest.pages
      .find((page) => page.slug === "home")
      ?.sections.find((section) => section.id === "hero")?.fields;

    assert.ok(heroFields, "Expected Template 3 home hero fields.");
    assert.ok(
      heroFields.some((field) => field.key === "skyImage"),
      "Expected Template 3 hero to expose the main sky image control.",
    );
    assert.ok(
      heroFields.every((field) => field.key !== "sectionBgImage"),
      "Template 3 hero should not expose a competing generic background image.",
    );

    const content = buildSchoolTemplateProjectContent(manifest);
    const sourceSnapshot = buildSchoolTemplateSourceSnapshot(manifest);

    const html = await renderSchoolTemplatePreview({
      content,
      sourceSnapshot,
      pageSlug: "home",
    });

    assert.ok(html, "Expected Template 3 home preview HTML.");
    assert.match(
      html,
      /\.hero__sky-image\{position:absolute!important;inset:0!important;width:100%!important;height:100%!important;object-fit:cover!important;object-position:center top!important;opacity:\.94!important;transform:scale\(1\.12\);transform-origin:center top!important;\}/,
    );
    assert.match(
      html,
      /@media \(max-width:560px\)\{\.hero__sky-layer\{top:0!important;right:0!important;bottom:0!important;left:0!important;height:auto!important;max-height:none!important;background(?:-color)?:[^}]+!important;background-image:none!important;\}\.hero__sky-image\{object-position:center 14%!important;\}\}/,
    );
    assert.match(html, /function applyAcademyThreeHeroBackgroundImage/);
    assert.match(
      html,
      /skyLayer\.style\.setProperty\("background-image", "none", "important"\)/,
    );
    assert.match(
      html,
      /\.programme-tile::before\{height:var\(--dexta-academy-3-home-programmes-card-overlay-height,76%\)!important;background:linear-gradient/,
    );
    assert.match(
      html,
      /--dexta-academy-3-home-programmes-card-overlay-opacity,96%/,
    );
    assert.match(html, /function promoteInlineRichTextColorStyles/);
    assert.match(html, /function hasRichTextColorStyle/);
    assert.match(html, /!hasRichTextColorStyle\(value\)/);
    assert.match(
      html,
      /var promotedProperties = \[\s*"color",\s*"background-color",/,
    );
    assert.match(
      html,
      /node\.style\.setProperty\(property, value, "important"\)/,
    );
  });
});
