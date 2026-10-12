import assert from "node:assert/strict";
import { readFileSync } from "node:fs";
import path from "node:path";
import { describe, it } from "node:test";
import { dextaAcademy4Manifest } from "@/lib/school-template-manifests/dexta-academy-4";
import {
  buildSchoolTemplateProjectContent,
  buildSchoolTemplateSourceSnapshot,
  sanitizeSchoolTemplateProjectContent,
  validateSchoolTemplateProjectContentReferences,
} from "@/lib/school-template-project-content";

const ABOUT_STORY_IMAGE_URL =
  "https://res.cloudinary.com/dxoorukfj/image/upload/v1777039633/dxt2-about_ubzert.png";

function getAboutStorySection(
  content: ReturnType<typeof buildSchoolTemplateProjectContent>,
) {
  return content.pages
    .find((page) => page.slug === "about")
    ?.sections.find((section) => section.id === "story");
}

function getHomeGalleryPreviewSection(
  content: ReturnType<typeof buildSchoolTemplateProjectContent>,
) {
  return content.pages
    .find((page) => page.slug === "home")
    ?.sections.find((section) => section.id === "gallery-preview");
}

function getHomeAboutPreviewManifestSection() {
  return dextaAcademy4Manifest.pages
    .find((page) => page.slug === "home")
    ?.sections.find((section) => section.id === "about-preview");
}

function getAboutManifestSection(sectionId: string) {
  return dextaAcademy4Manifest.pages
    .find((page) => page.slug === "about")
    ?.sections.find((section) => section.id === sectionId);
}

function getAdmissionsManifestSection(sectionId: string) {
  return dextaAcademy4Manifest.pages
    .find((page) => page.slug === "admissions")
    ?.sections.find((section) => section.id === sectionId);
}

function getGalleryManifestSection(sectionId: string) {
  return dextaAcademy4Manifest.pages
    .find((page) => page.slug === "gallery")
    ?.sections.find((section) => section.id === sectionId);
}

function getContactManifestSection(sectionId: string) {
  return dextaAcademy4Manifest.pages
    .find((page) => page.slug === "contact")
    ?.sections.find((section) => section.id === sectionId);
}

function getTemplateFourAboutSourceHtml() {
  return readFileSync(
    path.resolve(process.cwd(), dextaAcademy4Manifest.sourceDir, "about.html"),
    "utf8",
  );
}

describe("Dexta Academy 4 manifest", () => {
  it("normalizes entity-quoted background image URLs from source markup", () => {
    const content = buildSchoolTemplateProjectContent(dextaAcademy4Manifest);
    const sourceSnapshot = buildSchoolTemplateSourceSnapshot(
      dextaAcademy4Manifest,
    );
    const storySection = getAboutStorySection(content);

    assert.ok(storySection, "Expected the About Story section to exist.");
    assert.equal(storySection.fields.image, ABOUT_STORY_IMAGE_URL);
    const sanitized = sanitizeSchoolTemplateProjectContent(
      content,
      sourceSnapshot,
    );

    assert.deepEqual(
      validateSchoolTemplateProjectContentReferences(sanitized, sourceSnapshot),
      [],
    );
  });

  it("normalizes existing entity-quoted image references during sanitization", () => {
    const content = buildSchoolTemplateProjectContent(dextaAcademy4Manifest);
    const sourceSnapshot = buildSchoolTemplateSourceSnapshot(
      dextaAcademy4Manifest,
    );
    const storySection = getAboutStorySection(content);

    assert.ok(storySection, "Expected the About Story section to exist.");
    storySection.fields.image = `&quot;${ABOUT_STORY_IMAGE_URL}&quot;`;

    const sanitized = sanitizeSchoolTemplateProjectContent(
      content,
      sourceSnapshot,
    );
    const sanitizedStorySection = getAboutStorySection(sanitized);

    assert.equal(sanitizedStorySection?.fields.image, ABOUT_STORY_IMAGE_URL);
    assert.deepEqual(
      validateSchoolTemplateProjectContentReferences(sanitized, sourceSnapshot),
      [],
    );
  });

  it("keeps the home gallery preview image-only with six-item pagination markup", () => {
    const content = buildSchoolTemplateProjectContent(dextaAcademy4Manifest);
    const sourceSnapshot = buildSchoolTemplateSourceSnapshot(
      dextaAcademy4Manifest,
    );
    const gallerySection = getHomeGalleryPreviewSection(content);
    const gallerySnapshot = sourceSnapshot.pages
      .find((page) => page.slug === "home")
      ?.sections.find((section) => section.id === "gallery-preview");
    const sourceHtml = readFileSync(
      path.resolve(
        process.cwd(),
        dextaAcademy4Manifest.sourceDir,
        dextaAcademy4Manifest.entryFile,
      ),
      "utf8",
    );

    assert.equal(gallerySection?.repeatable?.items.length, 10);
    assert.match(sourceHtml, /data-gallery-page-size="6"/);
    assert.match(sourceHtml, /data-gallery-pagination/);
    assert.doesNotMatch(sourceHtml, /<span class="gallery-preview-label"/);
    assert.equal(
      (
        sourceHtml.match(
          /class="gallery-preview-card"[\s\S]*?\bhidden\b|class="gallery-preview-card" hidden/g,
        ) ?? []
      ).length,
      4,
    );
    assert.ok(
      gallerySection?.repeatable?.items.every(
        (item) => "image" in item && !("label" in item) && !("caption" in item),
      ),
      "Home gallery cards should only expose image content.",
    );
    assert.ok(gallerySnapshot?.fields.some((field) => field.key === "image"));
    assert.ok(
      gallerySnapshot?.fields.every(
        (field) => field.key !== "label" && field.key !== "caption",
      ),
      "Home gallery snapshot should not expose per-image title or caption fields.",
    );
  });

  it("keeps About Preview title and stat fields targeted to the correct nodes", () => {
    const aboutPreviewSection = getHomeAboutPreviewManifestSection();
    const sourceHtml = readFileSync(
      path.resolve(
        process.cwd(),
        dextaAcademy4Manifest.sourceDir,
        dextaAcademy4Manifest.entryFile,
      ),
      "utf8",
    );
    const titleField = aboutPreviewSection?.fields.find(
      (field) => field.key === "title",
    );
    const statValueField = aboutPreviewSection?.fields.find(
      (field) => field.key === "statValue",
    );
    const statLabelField = aboutPreviewSection?.fields.find(
      (field) => field.key === "statLabel",
    );

    assert.equal(aboutPreviewSection?.repeatable?.itemSelector, ".stat-card");
    assert.equal(titleField?.selector, ".section-copy > h2");
    assert.equal(statValueField?.selector, ".stat-card__value");
    assert.equal(statLabelField?.selector, ".stat-card__body");
    assert.equal(statLabelField?.label, "Stat body");
    assert.match(sourceHtml, /class="stat-card__value"/);
    assert.match(sourceHtml, /class="stat-card__body"/);
    assert.doesNotMatch(sourceHtml, /View All Programs/);
  });

  it("keeps the home Programs title editable as a section-level field", () => {
    const content = buildSchoolTemplateProjectContent(dextaAcademy4Manifest);
    const programsManifest = dextaAcademy4Manifest.pages
      .find((page) => page.slug === "home")
      ?.sections.find((section) => section.id === "programs");
    const programsContent = content.pages
      .find((page) => page.slug === "home")
      ?.sections.find((section) => section.id === "programs");
    const titleField = programsManifest?.fields.find(
      (field) => field.key === "title",
    );

    assert.equal(titleField?.selector, ".school-programs .text-center > h2");
    assert.match(
      String(programsContent?.fields.title),
      /Academic pathways built for every stage of learning\./,
    );
    assert.ok(
      programsContent?.repeatable?.items.every((item) => !("title" in item)),
      "Programs title must remain a section-level editor field.",
    );
  });

  it("preserves About Preview stat rich-text typography during sanitization", () => {
    const content = buildSchoolTemplateProjectContent(dextaAcademy4Manifest);
    const sourceSnapshot = buildSchoolTemplateSourceSnapshot(
      dextaAcademy4Manifest,
    );
    const aboutPreview = content.pages
      .find((page) => page.slug === "home")
      ?.sections.find((section) => section.id === "about-preview");
    const richText =
      '<h2><span style="font-family: Montserrat, sans-serif; color: #e03e2d; font-size: 24px;"><strong>98%</strong></span></h2>';

    assert.ok(aboutPreview?.repeatable?.items[0]);
    aboutPreview.repeatable.items[0].statValue = richText;

    const sanitized = sanitizeSchoolTemplateProjectContent(
      content,
      sourceSnapshot,
    );
    const sanitizedStatValue = sanitized.pages
      .find((page) => page.slug === "home")
      ?.sections.find((section) => section.id === "about-preview")?.repeatable
      ?.items[0]?.statValue;

    assert.equal(typeof sanitizedStatValue, "string");
    const statValueString =
      typeof sanitizedStatValue === "string" ? sanitizedStatValue : "";
    assert.match(statValueString, /^<h2><span style="/);
    assert.match(statValueString, /font-family:Montserrat, sans-serif/);
    assert.match(statValueString, /color:#e03e2d/);
    assert.match(statValueString, /font-size:24px/);
    assert.match(statValueString, /<strong>98%<\/strong>/);
  });

  it("keeps About Facts section title and card value/label fields targeted correctly", () => {
    const factsSection = getAboutManifestSection("facts");
    const sourceHtml = getTemplateFourAboutSourceHtml();
    const sectionTitleField = factsSection?.fields.find(
      (field) => field.key === "title",
    );
    const factValueField = factsSection?.fields.find(
      (field) => field.key === "factValue",
    );
    const factLabelField = factsSection?.fields.find(
      (field) => field.key === "factLabel",
    );

    assert.equal(factsSection?.repeatable?.itemSelector, ".about-fact-card");
    assert.equal(sectionTitleField?.selector, ".about-facts-section h2");
    assert.equal(sectionTitleField?.label, "Title");
    assert.equal(factValueField?.selector, ".about-fact-card__value");
    assert.equal(factLabelField?.selector, ".about-fact-card__label");
    assert.equal(factLabelField?.label, "Fact label");
    assert.match(sourceHtml, /class="about-fact-card__value"/);
    assert.match(sourceHtml, /class="about-fact-card__label"/);
  });

  it("exposes the About Mission, Vision & Core Values cards for per-item editing", () => {
    const principlesSection = getAboutManifestSection("principles");
    const sourceHtml = getTemplateFourAboutSourceHtml();
    const itemFieldSelectors = new Map(
      (principlesSection?.fields ?? []).map((field) => [
        field.key,
        field.selector,
      ]),
    );

    assert.equal(principlesSection?.label, "Mission, Vision & Core Values");
    assert.equal(
      principlesSection?.repeatable?.itemSelector,
      ".principle-card",
    );
    assert.equal(itemFieldSelectors.get("eyebrow"), ".section-kicker");
    assert.equal(
      itemFieldSelectors.get("title"),
      ".about-principles-section h2",
    );
    assert.equal(itemFieldSelectors.get("intro"), ".section-intro");
    assert.equal(
      itemFieldSelectors.get("principleLabel"),
      ".principle-card__label",
    );
    assert.equal(
      itemFieldSelectors.get("principleTitle"),
      ".principle-card__title",
    );
    assert.equal(
      itemFieldSelectors.get("principleBody"),
      ".principle-card__body",
    );
    assert.match(sourceHtml, /class="principle-label principle-card__label"/);
    assert.match(sourceHtml, /class="principle-card__title"/);
    assert.match(sourceHtml, /class="value-tags principle-card__body"/);
  });

  it("targets the About Student Experience title without exposing a missing body field", () => {
    const studentExperienceSection =
      getAboutManifestSection("student-experience");
    const sourceHtml = getTemplateFourAboutSourceHtml();
    const titleField = studentExperienceSection?.fields.find(
      (field) => field.key === "title",
    );
    const bodyField = studentExperienceSection?.fields.find(
      (field) => field.key === "body",
    );

    assert.equal(titleField?.selector, ".student-experience-section__title");
    assert.equal(bodyField, undefined);
    assert.match(sourceHtml, /class="student-experience-section__title"/);
  });

  it("exposes Principal Note section, panel, and signoff background controls", () => {
    const principalNoteSection = getAboutManifestSection("principal-note");
    const fields = new Map(
      (principalNoteSection?.fields ?? []).map((field) => [field.key, field]),
    );

    assert.equal(
      fields.get("sectionBgColor")?.cssVariable,
      "--dexta-academy-4-about-principal-note-section-bg-color",
    );
    assert.equal(
      fields.get("sectionBgImage")?.cssVariable,
      "--dexta-academy-4-about-principal-note-section-bg-image",
    );
    assert.equal(
      fields.get("panelBgColor")?.cssVariable,
      "--dexta-academy-4-about-principal-note-panel-bg-color",
    );
    assert.equal(
      fields.get("panelBgOpacity")?.cssVariable,
      "--dexta-academy-4-about-principal-note-panel-bg-opacity",
    );
    assert.equal(
      fields.get("signoffBgColor")?.cssVariable,
      "--dexta-academy-4-about-principal-note-signoff-bg-color",
    );
    assert.equal(
      fields.get("signoffBgOpacity")?.cssVariable,
      "--dexta-academy-4-about-principal-note-signoff-bg-opacity",
    );
  });

  it("wires Template 4 About section backgrounds into preview and export CSS", () => {
    const previewRenderer = readFileSync(
      path.resolve(
        process.cwd(),
        "src/lib/school-template-preview-renderer.ts",
      ),
      "utf8",
    );
    const exporter = readFileSync(
      path.resolve(process.cwd(), "src/lib/school-template-exporter.ts"),
      "utf8",
    );
    const expectedTokens = [
      "--dexta-academy-4-about-story-section-bg-image",
      "--dexta-academy-4-about-principles-section-bg-image",
      "--dexta-academy-4-about-principal-note-section-bg-image",
      "--dexta-academy-4-about-student-experience-section-bg-image",
      "--dexta-academy-4-about-facts-section-bg-image",
      "--dexta-academy-4-about-principal-note-panel-bg-color",
      "--dexta-academy-4-about-principal-note-signoff-bg-color",
    ];

    for (const token of expectedTokens) {
      assert.match(previewRenderer, new RegExp(token));
      assert.match(exporter, new RegExp(token));
    }
    assert.match(
      previewRenderer,
      /about-principles-section\{[^}]*background-image:linear-gradient\([^}]*--dexta-academy-4-about-principles-section-bg-opacity/s,
    );
    assert.match(
      exporter,
      /\.about-principles-section\s*\{[^}]*background-image:[^}]*linear-gradient\([^}]*--dexta-academy-4-about-principles-section-bg-opacity/s,
    );
  });

  it("wires Template 4 Admissions background and card style controls", () => {
    const processSection = getAdmissionsManifestSection("process");
    const formSection = getAdmissionsManifestSection("application-form-intro");
    const ctaSection = getAdmissionsManifestSection("admissions-cta");
    const previewRenderer = readFileSync(
      path.resolve(
        process.cwd(),
        "src/lib/school-template-preview-renderer.ts",
      ),
      "utf8",
    );
    const exporter = readFileSync(
      path.resolve(process.cwd(), "src/lib/school-template-exporter.ts"),
      "utf8",
    );
    const processFields = new Map(
      (processSection?.fields ?? []).map((field) => [field.key, field]),
    );
    const formFields = new Map(
      (formSection?.fields ?? []).map((field) => [field.key, field]),
    );
    const ctaFields = new Map(
      (ctaSection?.fields ?? []).map((field) => [field.key, field]),
    );
    const expectedTokens = [
      "--dexta-academy-4-admissions-process-side-panel-bg-color",
      "--dexta-academy-4-admissions-process-side-panel-bg-opacity",
      "--dexta-academy-4-admissions-process-contact-card-bg-color",
      "--dexta-academy-4-admissions-process-contact-card-bg-opacity",
      "--dexta-academy-4-admissions-process-step-card-bg-color",
      "--dexta-academy-4-admissions-process-step-card-bg-opacity",
      "--dexta-academy-4-admissions-process-step-number-color",
      "--dexta-academy-4-admissions-process-step-number-bg-color",
      "--dexta-academy-4-admissions-process-step-number-bg-opacity",
      "--dexta-academy-4-admissions-form-button-bg-color",
      "--dexta-academy-4-admissions-form-button-text-color",
      "--dexta-academy-4-admissions-admissions-cta-panel-bg-color",
      "--dexta-academy-4-admissions-admissions-cta-panel-bg-opacity",
    ];

    assert.equal(
      processFields.get("sidePanelBgColor")?.cssVariable,
      "--dexta-academy-4-admissions-process-side-panel-bg-color",
    );
    assert.equal(
      processFields.get("contactCardBgOpacity")?.cssVariable,
      "--dexta-academy-4-admissions-process-contact-card-bg-opacity",
    );
    assert.equal(
      processFields.get("stepNumberColor")?.selector,
      ".admissions-step-number",
    );
    assert.equal(
      processFields.get("stepNumberBgColor")?.cssVariable,
      "--dexta-academy-4-admissions-process-step-number-bg-color",
    );
    assert.equal(
      formFields.get("buttonBgColor")?.cssVariable,
      "--dexta-academy-4-admissions-form-button-bg-color",
    );
    assert.equal(
      formFields.get("buttonTextColor")?.cssVariable,
      "--dexta-academy-4-admissions-form-button-text-color",
    );
    assert.equal(
      ctaFields.get("panelBgColor")?.cssVariable,
      "--dexta-academy-4-admissions-admissions-cta-panel-bg-color",
    );

    for (const token of expectedTokens) {
      assert.match(previewRenderer, new RegExp(token));
      assert.match(exporter, new RegExp(token));
    }
    assert.match(
      previewRenderer,
      /admissions-process-section\{[\s\S]*background-image:linear-gradient\([\s\S]*--dexta-academy-4-admissions-process-section-bg-opacity/,
    );
    assert.match(
      previewRenderer,
      /admissions-form-section\{[\s\S]*background-image:linear-gradient\([\s\S]*--dexta-academy-4-admissions-form-section-bg-opacity/,
    );
    assert.match(
      previewRenderer,
      /admissions-page-cta\{[\s\S]*background-image:linear-gradient\([\s\S]*--dexta-academy-4-admissions-admissions-cta-section-bg-opacity/,
    );
    assert.match(
      exporter,
      /\.admissions-process-section\s*\{[\s\S]*background-image:[\s\S]*linear-gradient\([\s\S]*--dexta-academy-4-admissions-process-section-bg-opacity/,
    );
    assert.match(
      exporter,
      /\.admissions-form-section\s*\{[\s\S]*background-image:[\s\S]*linear-gradient\([\s\S]*--dexta-academy-4-admissions-form-section-bg-opacity/,
    );
    assert.match(
      exporter,
      /\.admissions-page-cta\s*\{[\s\S]*background-image:[\s\S]*linear-gradient\([\s\S]*--dexta-academy-4-admissions-admissions-cta-section-bg-opacity/,
    );
  });

  it("wires Template 4 Gallery lightbox and CTA overlay controls", () => {
    const galleryCtaSection = getGalleryManifestSection("gallery-cta");
    const galleryCtaFields = new Map(
      (galleryCtaSection?.fields ?? []).map((field) => [field.key, field]),
    );
    const previewRenderer = readFileSync(
      path.resolve(
        process.cwd(),
        "src/lib/school-template-preview-renderer.ts",
      ),
      "utf8",
    );
    const exporter = readFileSync(
      path.resolve(process.cwd(), "src/lib/school-template-exporter.ts"),
      "utf8",
    );

    assert.equal(
      galleryCtaFields.get("panelBgOpacity")?.cssVariable,
      "--dexta-academy-4-gallery-gallery-cta-panel-bg-opacity",
    );
    assert.match(previewRenderer, /data-dexta-lightbox-src/);
    assert.match(exporter, /data-dexta-lightbox-src/);
    assert.match(
      previewRenderer,
      /gallery-page-cta\{[\s\S]*background-image:linear-gradient\([\s\S]*--dexta-academy-4-gallery-gallery-cta-section-bg-opacity/,
    );
    assert.match(
      exporter,
      /\.gallery-page-cta\s*\{[\s\S]*background-image:[\s\S]*linear-gradient\([\s\S]*--dexta-academy-4-gallery-gallery-cta-section-bg-opacity/,
    );
    assert.match(
      previewRenderer,
      /--dexta-academy-4-gallery-gallery-cta-panel-bg-opacity/,
    );
    assert.match(
      exporter,
      /--dexta-academy-4-gallery-gallery-cta-panel-bg-opacity/,
    );
  });

  it("wires Template 4 Contact hero, card, form, and CTA style controls", () => {
    const pageHeroSection = getContactManifestSection("page-hero");
    const detailsSection = getContactManifestSection("contact-details");
    const formSection = getContactManifestSection("contact-form");
    const ctaSection = getContactManifestSection("contact-cta");
    const pageHeroFields = new Map(
      (pageHeroSection?.fields ?? []).map((field) => [field.key, field]),
    );
    const detailsFields = new Map(
      (detailsSection?.fields ?? []).map((field) => [field.key, field]),
    );
    const formFields = new Map(
      (formSection?.fields ?? []).map((field) => [field.key, field]),
    );
    const ctaFields = new Map(
      (ctaSection?.fields ?? []).map((field) => [field.key, field]),
    );
    const sourceHtml = readFileSync(
      path.resolve(
        process.cwd(),
        dextaAcademy4Manifest.sourceDir,
        "contact.html",
      ),
      "utf8",
    );
    const previewRenderer = readFileSync(
      path.resolve(
        process.cwd(),
        "src/lib/school-template-preview-renderer.ts",
      ),
      "utf8",
    );
    const exporter = readFileSync(
      path.resolve(process.cwd(), "src/lib/school-template-exporter.ts"),
      "utf8",
    );
    const expectedTokens = [
      "--dexta-academy-4-contact-contact-details-card-bg-color",
      "--dexta-academy-4-contact-contact-details-card-border-color",
      "--dexta-academy-4-contact-contact-details-card-title-text-color",
      "--dexta-academy-4-contact-contact-details-card-body-text-color",
      "--dexta-academy-4-contact-form-button-bg-color",
      "--dexta-academy-4-contact-form-button-text-color",
      "--dexta-academy-4-contact-form-side-panel-bg-color",
      "--dexta-academy-4-contact-form-side-panel-title-text-color",
      "--dexta-academy-4-contact-contact-cta-panel-bg-opacity",
    ];

    assert.equal(
      pageHeroFields.get("secondaryCtaText")?.selector,
      ".contact-secondary-link-text",
    );
    assert.equal(
      pageHeroFields.get("secondaryCtaHref")?.selector,
      ".contact-secondary-link",
    );
    assert.match(sourceHtml, /class="contact-secondary-link-text"/);
    assert.equal(
      detailsFields.get("cardBgColor")?.cssVariable,
      "--dexta-academy-4-contact-contact-details-card-bg-color",
    );
    assert.equal(detailsFields.get("cardTitleTextColor")?.selector, "strong");
    assert.equal(detailsFields.get("cardBodyTextColor")?.selector, "span, a");
    assert.equal(
      formFields.get("buttonBgColor")?.cssVariable,
      "--dexta-academy-4-contact-form-button-bg-color",
    );
    assert.equal(
      formFields.get("sidePanelBgColor")?.cssVariable,
      "--dexta-academy-4-contact-form-side-panel-bg-color",
    );
    assert.equal(
      ctaFields.get("panelBgOpacity")?.cssVariable,
      "--dexta-academy-4-contact-contact-cta-panel-bg-opacity",
    );

    for (const token of expectedTokens) {
      assert.match(previewRenderer, new RegExp(token));
      assert.match(exporter, new RegExp(token));
    }
    for (const [selector, token] of [
      ["contact-details-section", "contact-contact-details-section-bg-opacity"],
      ["contact-form-section", "contact-form-section-bg-opacity"],
      ["contact-page-cta", "contact-contact-cta-section-bg-opacity"],
    ]) {
      assert.match(
        previewRenderer,
        new RegExp(
          `${selector}\\{[\\s\\S]*background-image:linear-gradient\\([\\s\\S]*--dexta-academy-4-${token}`,
        ),
      );
      assert.match(
        exporter,
        new RegExp(
          `\\.${selector}\\s*\\{[\\s\\S]*background-image:[\\s\\S]*linear-gradient\\([\\s\\S]*--dexta-academy-4-${token}`,
        ),
      );
    }
  });
});
