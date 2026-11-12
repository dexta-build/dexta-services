import assert from "node:assert/strict";
import { readFileSync } from "node:fs";
import { describe, it } from "node:test";
import { Script } from "node:vm";
import { dextaAcademy2Manifest } from "@/lib/school-template-manifests/dexta-academy-2";
import { dextaAcademy3Manifest } from "@/lib/school-template-manifests/dexta-academy-3";
import {
  buildSchoolTemplateProjectContent,
  buildSchoolTemplateSourceSnapshot,
  resolveSchoolTemplateManifestForSelection,
  syncSchoolTemplateProjectContentWithManifest,
} from "@/lib/school-template-project-content";
import { renderSchoolTemplatePreview } from "@/lib/school-template-preview-renderer";

function assertPreviewHtml(value: string | null): asserts value is string {
  assert.ok(value, "Expected preview HTML.");
}

describe("Dexta Academy 3 manifest", () => {
  it("extracts the full template content and image assets from app public HTML", () => {
    const content = buildSchoolTemplateProjectContent(dextaAcademy3Manifest);
    const homePage = content.pages.find((page) => page.slug === "home");
    const aboutPage = content.pages.find((page) => page.slug === "about");
    const galleryPage = content.pages.find((page) => page.slug === "gallery");
    const header = content.sharedSections.find(
      (section) => section.id === "site-header",
    );

    const hero = homePage?.sections.find((section) => section.id === "hero");
    const programmes = homePage?.sections.find(
      (section) => section.id === "programmes",
    );
    const howToApply = homePage?.sections.find(
      (section) => section.id === "how-to-apply",
    );
    const homeGallery = homePage?.sections.find(
      (section) => section.id === "gallery-preview",
    );
    const aboutStory = aboutPage?.sections.find(
      (section) => section.id === "story",
    );
    const values = aboutPage?.sections.find(
      (section) => section.id === "values",
    );
    const impact = aboutPage?.sections.find(
      (section) => section.id === "impact",
    );
    const galleryGrid = galleryPage?.sections.find(
      (section) => section.id === "gallery-grid",
    );

    assert.match(String(hero?.fields.skyImage), /hero-bg_cwzvwm\.png/);
    assert.match(String(hero?.fields.studentImage), /hero-image_r50mkt\.png/);
    assert.equal(hero?.fields.headlineTextColor, "#ffffff");
    assert.equal(hero?.fields.joyfulAccentColor, "#ffc94c");
    assert.equal(hero?.fields.boldAccentColor, "#ffc94c");
    assert.equal(programmes?.fields.cardOverlayColor, "#050e21");
    assert.equal(programmes?.fields.cardOverlayOpacity, 96);
    assert.equal(programmes?.fields.cardOverlayHeight, 76);
    assert.equal(programmes?.repeatable?.items[0]?.programmeIcon, "SC");
    assert.equal(programmes?.repeatable?.items[0]?.cardBorderWidth, 1);
    assert.equal(
      programmes?.repeatable?.items[0]?.cardBorderColor,
      "rgba(243,191,53,0.34)",
    );
    assert.equal(programmes?.repeatable?.items[0]?.cardShadowOpacity, 0);
    assert.equal(programmes?.repeatable?.items[0]?.iconColor, "#f3bf35");
    assert.equal(
      programmes?.repeatable?.items[0]?.iconBgColor,
      "rgba(6,18,42,0.58)",
    );
    assert.equal(
      Object.prototype.hasOwnProperty.call(
        programmes?.repeatable?.items[0] ?? {},
        "iconImage",
      ),
      false,
    );
    assert.match(
      String(programmes?.repeatable?.items[0]?.programmeImage),
      /programme1_szfzez\.png/,
    );
    assert.match(
      String(howToApply?.fields.primaryCtaText),
      /Start Application/,
    );
    assert.equal(howToApply?.fields.primaryCtaHref, "contact.html#admission");
    assert.equal(howToApply?.fields.secondaryCtaText, "Contact Admissions");
    assert.equal(howToApply?.fields.secondaryCtaHref, "contact.html#message");
    assert.equal(howToApply?.fields.noteBgColor, "#061f44");
    assert.equal(howToApply?.fields.noteBulletColor, "#ffc43d");
    assert.equal(howToApply?.repeatable?.items[0]?.stepNumber, "01");
    assert.equal(howToApply?.repeatable?.items[0]?.stepCardBgColor, "#ffffff");
    assert.equal(howToApply?.repeatable?.items[0]?.stepCardBorderRadius, 18);
    assert.equal(howToApply?.repeatable?.items[0]?.iconColor, "#122a56");
    assert.equal(howToApply?.repeatable?.items[0]?.iconBgColor, "#fff2c9");
    assert.equal(
      Object.prototype.hasOwnProperty.call(
        howToApply?.repeatable?.items[0] ?? {},
        "iconImage",
      ),
      false,
    );
    assert.equal(homeGallery?.repeatable?.items.length, 3);
    assert.equal(homeGallery?.repeatable?.items[0]?.cardBorderWidth, 0);
    assert.equal(homeGallery?.repeatable?.items[0]?.cardShadowOpacity, 0);
    assert.equal(header?.fields.navHomeText, "Home");
    assert.equal(header?.fields.navHomeHref, "index.html");
    assert.equal(header?.fields.navAboutText, "About");
    assert.equal(header?.fields.navAboutHref, "about.html");
    assert.equal(header?.fields.navProgrammesText, "Programmes");
    assert.equal(header?.fields.navProgrammesHref, "index.html#programmes");
    assert.equal(header?.fields.navGalleryText, "Gallery");
    assert.equal(header?.fields.navGalleryHref, "gallery.html");
    assert.equal(header?.fields.navApplyText, "How To Apply");
    assert.equal(header?.fields.navApplyHref, "index.html#how-to-apply");
    assert.equal(header?.fields.navContactText, "Contact");
    assert.equal(header?.fields.navContactHref, "contact.html");
    assert.equal(aboutStory?.repeatable?.items.length, 3);
    assert.equal(aboutStory?.repeatable?.items[0]?.cardBorderWidth, 0);
    assert.equal(aboutStory?.repeatable?.items[0]?.cardShadowOpacity, 0);
    assert.equal(values?.repeatable?.items.length, 10);
    assert.equal(values?.repeatable?.items[0]?.cardBorderWidth, 1);
    assert.equal(values?.repeatable?.items[0]?.cardShadowOpacity, 9);
    assert.equal(impact?.repeatable?.items.length, 4);
    assert.equal(galleryGrid?.repeatable?.items.length, 20);
    assert.equal(galleryGrid?.repeatable?.items[0]?.cardBorderWidth, 0);
    assert.equal(galleryGrid?.repeatable?.items[0]?.cardShadowOpacity, 4);
    assert.match(
      String(galleryGrid?.repeatable?.items[0]?.image),
      /g2_h1vdiy\.png/,
    );
  });

  it("renders previews from the complete public source files", async () => {
    const content = buildSchoolTemplateProjectContent(dextaAcademy3Manifest);
    const sourceSnapshot = buildSchoolTemplateSourceSnapshot(
      dextaAcademy3Manifest,
    );

    assert.equal(sourceSnapshot.sourceDir, "src/app/(public)/dexta-academy-3");

    for (const page of content.pages) {
      const html = await renderSchoolTemplatePreview({
        content,
        sourceSnapshot,
        pageSlug: page.slug,
      });
      assertPreviewHtml(html);

      assert.match(html, /<base href="\/dexta-academy-3\/">/);
      assert.match(html, /window\.__DEXTA_SCHOOL_PREVIEW__/);
      assert.match(html, new RegExp(`pageSlug: "${page.slug}"`));
    }
  });

  it("renders the academy 3 loader and full shared navbar controls in previews", async () => {
    const content = buildSchoolTemplateProjectContent(dextaAcademy3Manifest);
    const sourceSnapshot = buildSchoolTemplateSourceSnapshot(
      dextaAcademy3Manifest,
    );
    content.theme.loadingBackgroundColor = "#fff7df";
    content.theme.loadingText = "Preparing DXT Academy";
    content.theme.loadingTextColor = "#061a40";
    content.theme.loadingBarColor = "#000000";
    content.theme.loadingCardBorderColor = "#20c997";
    content.theme.loadingCardBorderWidth = 4;
    content.theme.loadingCardShadowColor = "#fe0066";
    content.theme.loadingCardShadowOpacity = 35;
    const html = await renderSchoolTemplatePreview({
      content,
      sourceSnapshot,
      pageSlug: "home",
    });
    assertPreviewHtml(html);
    const script = readFileSync(
      "src/app/(public)/dexta-academy-3/script.js",
      "utf8",
    );

    assert.match(html, /<header class="site-header" style=/);
    assert.doesNotMatch(html, /data-site-navbar/);
    assert.match(script, /function renderSiteNavbar\(\)/);
    assert.match(
      script,
      /document\.querySelectorAll\("\[data-site-navbar\]"\)/,
    );
    assert.match(script, /class="page-loader__track"/);
    assert.match(html, /class="page-loader__copy">Preparing DXT Academy<\/p>/);
    assert.doesNotMatch(
      html,
      /html\[data-dexta-project-preview="loading"\] body/,
    );
    assert.doesNotMatch(html, /\.page-loader\{display:none!important;\}/);
    assert.match(
      html,
      /document\.querySelectorAll\("\.page-loader__inner"\)[\s\S]*ensureChild\(inner, "\.page-loader__copy"/,
    );
    assert.match(
      html,
      /\.page-loader,\.js body \.page-loader\{background:" \+ loadingBackground/,
    );
    assert.match(
      html,
      /\.site-loader__bar::after,\.page-loader__bar\{background:" \+ loadingBarColor/,
    );
    assert.match(html, /border:4px solid #20c997!important/);
    assert.match(html, /0 34px 70px rgba\(254,\s*0,\s*102,\s*0\.35\)/);
    assert.match(
      html,
      /loadingCardBorderWidth = Math\.max\(0, Math\.min\(12, Number\(preview\.content\.theme\.loadingCardBorderWidth/,
    );
    assert.match(
      html,
      /\.site-header \.site-nav\{display:inline-flex!important;\}/,
    );
    assert.match(
      html,
      /position:fixed!important;top:0!important;left:0!important;right:0!important;width:100%!important/,
    );
    assert.match(
      html,
      /academyThreeNavOpacity = Math\.max\(0, Math\.min\(100, Number\(preview\.content\.theme\.navBarOpacity/,
    );
    assert.match(
      html,
      /academyThreeNavbarBg = preview\.content\.theme\.navBarTransparent/,
    );
    assert.match(html, /var academyThreeBrandNameColor/);
    assert.match(html, /var academyThreeNavActiveColor/);
    assert.doesNotMatch(
      html,
      /\.site-header \.brand,\s*\.site-header \.brand__name strong[\s\S]*color:#fff!important/,
    );
    assert.doesNotMatch(html, /document\.body\.classList\.add\("is-ready"\)/);
    assert.doesNotMatch(
      html,
      /document\.body\.classList\.add\("is-animated"\)/,
    );
  });

  it("renders admin-updated academy 3 navbar values in previews", async () => {
    const content = buildSchoolTemplateProjectContent(dextaAcademy3Manifest);
    const sourceSnapshot = buildSchoolTemplateSourceSnapshot(
      dextaAcademy3Manifest,
    );
    const header = content.sharedSections.find(
      (section) => section.id === "site-header",
    );

    assert.ok(header, "Expected the Template 3 shared header section.");
    content.theme.brandName = "DEXTA";
    content.theme.brandTagline = "Prep";
    content.theme.brandNameColor = "#fe0066";
    content.theme.brandTaglineColor = "#a9abae";
    content.theme.logoBorderColor = "#fe0066";
    content.theme.logoBorderRadius = 16;
    content.theme.tertiaryColor = "#20c997";
    content.theme.fontFamily = "Poppins";
    content.theme.navBarColor = "#fe0066";
    content.theme.navBarOpacity = 51;
    content.theme.navBarTransparent = true;
    content.theme.navLinkColor = "#00ffcc";
    content.theme.navHoverColor = "#f5b82e";
    content.theme.navLinkFontFamily = "Montserrat";
    Object.assign(header.fields, {
      navHomeText: "Start",
      navHomeHref: "/start",
      navAboutText: "Who We Are",
      navAboutHref: "/story",
      navProgrammesText: "Learning",
      navProgrammesHref: "/learning",
      navGalleryText: "Moments",
      navGalleryHref: "/moments",
      navApplyText: "Admissions",
      navApplyHref: "/apply",
      navContactText: "Talk To Us",
      navContactHref: "/contact-us",
      portalText: "Family Portal",
      portalHref: "/portal",
      portalButtonBgColor: "#031225",
      portalButtonBgOpacity: 100,
      portalButtonTextColor: "#fff7df",
      portalButtonBorderColor: "#fff7df",
      portalButtonBorderWidth: 2,
      headerCtaText: "Enroll",
      headerCtaHref: "/enroll",
      buttonBgColor: "#fe0066",
      buttonBgOpacity: 0,
      buttonTextColor: "#fff7df",
      buttonBorderColor: "#fff7df",
      buttonBorderWidth: 3,
    });

    const html = await renderSchoolTemplatePreview({
      content,
      sourceSnapshot,
      pageSlug: "home",
    });
    assertPreviewHtml(html);

    assert.match(
      html,
      /<header class="site-header" style="[^"]*background:rgba\(254, 0, 102, 0\.51\)!important[\s\S]*aria-label="DEXTA Prep home"/,
    );
    assert.match(
      html,
      /<header class="site-header"[\s\S]*<strong style="color:#fe0066!important;font-size:16px!important;">DEXTA<\/strong>[\s\S]*<span style="color:#a9abae!important;font-size:16px!important;">Prep<\/span>/,
    );
    assert.match(
      html,
      /<a href="\/start" aria-current="page" style="color:#f5b82e!important;font-family:&quot;Montserrat&quot;,&quot;Segoe UI&quot;,sans-serif!important;">Start<\/a>/,
    );
    assert.match(
      html,
      /<a href="\/story" style="color:#00ffcc!important;font-family:&quot;Montserrat&quot;,&quot;Segoe UI&quot;,sans-serif!important;">Who We Are<\/a>/,
    );
    assert.match(
      html,
      /<a href="\/learning" style="color:#00ffcc!important;font-family:&quot;Montserrat&quot;,&quot;Segoe UI&quot;,sans-serif!important;">Learning<\/a>/,
    );
    assert.match(
      html,
      /<a href="\/moments" style="color:#00ffcc!important;font-family:&quot;Montserrat&quot;,&quot;Segoe UI&quot;,sans-serif!important;">Moments<\/a>/,
    );
    assert.match(
      html,
      /<a href="\/apply" style="color:#00ffcc!important;font-family:&quot;Montserrat&quot;,&quot;Segoe UI&quot;,sans-serif!important;">Admissions<\/a>/,
    );
    assert.match(
      html,
      /<a href="\/contact-us" style="color:#00ffcc!important;font-family:&quot;Montserrat&quot;,&quot;Segoe UI&quot;,sans-serif!important;">Talk To Us<\/a>/,
    );
    assert.match(
      html,
      /<a class="portal-link" href="\/portal" style="display:inline-flex!important;align-items:center!important;justify-content:center!important;gap:8px!important;padding:12px 18px!important;border-radius:999px!important;font-weight:700!important;text-decoration:none!important;background:#031225!important;background-color:#031225!important;background-image:none!important;color:#fff7df!important;border:2px solid #fff7df!important;font-family:&quot;Montserrat&quot;,&quot;Segoe UI&quot;,sans-serif!important;">Family Portal<\/a>/,
    );
    assert.match(
      html,
      /<a class="button button--gold" href="\/enroll" style="background:rgba\(254, 0, 102, 0\)!important;background-color:rgba\(254, 0, 102, 0\)!important;background-image:none!important;color:#fff7df!important;border:3px solid #fff7df!important;font-family:&quot;Montserrat&quot;,&quot;Segoe UI&quot;,sans-serif!important;">Enroll<\/a>/,
    );
    assert.match(html, /data-dexta-template3-preview-theme="true"/);
    assert.match(html, /background:rgba\(254, 0, 102, 0\.51\)!important/);
    assert.match(
      html,
      /\.site-header \.brand__name strong\{color:#fe0066!important/,
    );
    assert.match(
      html,
      /\.site-header \.brand__name span\{color:#a9abae!important/,
    );
    assert.match(html, /\.site-header \.site-nav a\{color:#00ffcc!important/);
    assert.match(
      html,
      /\.site-header \.site-nav a\[aria-current="page"\],[\s\S]*color:#f5b82e!important/,
    );
    assert.match(html, /--red:#20c997;--red-deep:#20c997;/);
    assert.match(html, /function getTemplateThreeThemeColorForDefault/);
    assert.match(
      html,
      /if \(primaryDefaults\.indexOf\(defaultToken\) >= 0\) return "var\(--navy\)"/,
    );
    assert.match(
      html,
      /if \(secondaryDefaults\.indexOf\(defaultToken\) >= 0\) return "var\(--gold\)"/,
    );
    assert.match(
      html,
      /if \(tertiaryDefaults\.indexOf\(defaultToken\) >= 0\) return "var\(--red\)"/,
    );
    assert.match(html, /border:1px solid #fe0066!important/);
    assert.match(html, /background:rgba\(254, 0, 102, 0\)!important/);
    assert.match(
      html,
      /color:#fff7df!important;border:3px solid #fff7df!important/,
    );
    assert.match(
      html,
      /\.site-header \.portal-link\{display:inline-flex!important;align-items:center!important;justify-content:center!important;gap:8px!important;padding:12px 18px!important;border-radius:999px!important;font-weight:700!important;text-decoration:none!important;background:#031225!important;background-color:#031225!important;background-image:none!important;color:#fff7df!important;border:2px solid #fff7df!important/,
    );
    assert.match(
      html,
      /--dexta-academy-3-shared-header-portal-button-bg-color/,
    );
    assert.match(
      html,
      /fonts\.googleapis\.com\/css2\?family=Poppins:ital,wght@0,100\.\.900;1,100\.\.900(?:&|&amp;)display=swap/,
    );
    assert.match(
      html,
      /fonts\.googleapis\.com\/css2\?family=Montserrat:ital,wght@0,100\.\.900;1,100\.\.900(?:&|&amp;)display=swap/,
    );
    assert.match(
      html,
      /body,\.page-shell[\s\S]*font-family:"Poppins","Segoe UI",sans-serif!important/,
    );
    assert.match(html, /font-family:"Poppins","Segoe UI",sans-serif!important/);
    assert.match(html, /function applyTemplateThreeHeaderFields\(\)/);
    assert.match(
      html,
      /getTemplateThreeBrandText\("brandName", "brandPrimary", "DXT"\)/,
    );
    assert.match(
      html,
      /setTemplateThreeNavLink\([\s\S]*getTemplateThreeHeaderText\("navHomeText", "Home"\)/,
    );
    assert.match(
      html,
      /window\.setTimeout\(applyTemplateThreeHeaderFields, 350\)/,
    );
  });

  it("renders admin-updated academy 3 how to apply section controls", async () => {
    const content = buildSchoolTemplateProjectContent(dextaAcademy3Manifest);
    const sourceSnapshot = buildSchoolTemplateSourceSnapshot(
      dextaAcademy3Manifest,
    );
    const homePage = content.pages.find((page) => page.slug === "home");
    const howToApply = homePage?.sections.find(
      (section) => section.id === "how-to-apply",
    );

    assert.ok(howToApply, "Expected the Template 3 how to apply section.");
    const firstStep = howToApply.repeatable?.items[0];
    assert.ok(firstStep, "Expected at least one application step.");
    Object.assign(howToApply.fields, {
      eyebrow: "Admissions",
      title: "Join DXT This Term",
      body: "Parents can update every application detail.",
      primaryCtaText: "Begin Now",
      primaryCtaHref: "contact.html#admission",
      secondaryCtaText: "Speak With Us",
      secondaryCtaHref: "contact.html#message",
      titleTextColor: "#fe0066",
      bodyTextColor: "#123456",
      eyebrowTextColor: "#20c997",
      noteTitle: "Bring Along",
      noteBody: "<li>Parent phone number</li><li>Student class</li>",
      noteBgColor: "#101820",
      noteBgOpacity: 82,
      noteTitleColor: "#fff7df",
      noteTextColor: "#f5b82e",
      noteBulletColor: "#20c997",
      noteBorderColor: "#fe0066",
      noteBorderWidth: 3,
      noteBorderRadius: 12,
    });
    Object.assign(firstStep, {
      stepNumber: "A1",
      stepTitle: "Pick A Class",
      stepBody: "Choose the right year group before applying.",
      stepCardBgColor: "#061f44",
      stepCardBgOpacity: 88,
      stepCardTitleColor: "#fff7df",
      stepCardBodyColor: "#f5b82e",
      stepCardBorderColor: "#20c997",
      stepCardBorderWidth: 4,
      stepCardBorderRadius: 10,
      stepCardShadowColor: "#fe0066",
      stepCardShadowOpacity: 35,
      iconColor: "#ffffff",
      iconBgColor: "#fe0066",
      iconBgOpacity: 70,
      iconBorderColor: "#20c997",
      iconBorderWidth: 2,
    });

    const html = await renderSchoolTemplatePreview({
      content,
      sourceSnapshot,
      pageSlug: "home",
    });

    assertPreviewHtml(html);
    assert.match(html, /Admissions/);
    assert.match(html, /Join DXT This Term/);
    assert.match(html, /Begin Now/);
    assert.match(html, /Speak With Us/);
    assert.match(html, /A1/);
    assert.match(html, /Pick A Class/);
    assert.match(html, /Bring Along/);
    assert.match(html, /Parent phone number/);
    assert.match(
      html,
      /--dexta-academy-3-home-how-to-apply-step-card-bg-color/,
    );
    assert.match(
      html,
      /--dexta-academy-3-home-how-to-apply-step-card-border-radius/,
    );
    assert.match(html, /--dexta-academy-3-home-how-to-apply-icon-bg-color/);
    assert.match(html, /--dexta-academy-3-home-how-to-apply-note-bg-color/);
    assert.match(html, /--dexta-academy-3-home-how-to-apply-note-bullet-color/);
    assert.match(html, /#061f44/);
    assert.match(html, /#fe0066/);
    assert.match(html, /#20c997/);
  });

  it("renders admin-updated academy 3 contact page content, icons, and styles", async () => {
    const content = buildSchoolTemplateProjectContent(dextaAcademy3Manifest);
    const sourceSnapshot = buildSchoolTemplateSourceSnapshot(
      dextaAcademy3Manifest,
    );
    const contactPage = content.pages.find((page) => page.slug === "contact");
    const hero = contactPage?.sections.find(
      (section) => section.id === "contact-hero",
    );
    const info = contactPage?.sections.find(
      (section) => section.id === "contact-panel",
    );
    const benefits = contactPage?.sections.find(
      (section) => section.id === "contact-benefits",
    );
    const modal = contactPage?.sections.find(
      (section) => section.id === "admission-modal",
    );

    assert.ok(hero, "Expected contact hero.");
    assert.ok(info?.repeatable?.items[0], "Expected contact info items.");
    assert.ok(
      benefits?.repeatable?.items[0],
      "Expected contact benefit items.",
    );
    assert.ok(modal, "Expected admission modal.");
    assert.ok(
      String(info.repeatable.items[0].infoIcon ?? "").trim(),
      "Expected contact info icon to be extracted.",
    );
    assert.equal(info.repeatable.items[0].infoTitle, "Our Location");
    assert.match(
      String(info.repeatable.items[0].infoContent ?? ""),
      /12 Academy Drive/,
    );
    assert.ok(
      String(benefits.repeatable.items[0].benefitIcon ?? "").trim(),
      "Expected contact benefit icon to be extracted.",
    );
    assert.equal(
      benefits.repeatable.items[0].benefitTitle,
      "Personalized Support",
    );
    assert.match(
      String(benefits.repeatable.items[0].benefitBody ?? ""),
      /dedicated support/,
    );

    Object.assign(hero.fields, {
      primaryCtaText: "Enroll Today",
      primaryCtaHref: "#admission",
      secondaryCtaText: "Call Reception",
      secondaryCtaHref: "tel:+2347000000000",
      titleTextColor: "#fff7df",
      accentTextColor: "#20c997",
    });
    Object.assign(info.repeatable.items[0], {
      infoIcon: "location-dot",
      infoTitle: "Main Campus",
      infoContent: "Main Campus<br>20 Learning Avenue,<br>Lagos.",
    });
    Object.assign(info.fields, {
      iconColor: "#ffffff",
      iconBgColor: "#fe0066",
      iconBorderColor: "#20c997",
      iconBorderWidth: 2,
    });
    Object.assign(benefits.repeatable.items[0], {
      benefitIcon: "school-building",
      benefitTitle: "Family Support",
      benefitBody: "Every family gets a clear admissions guide.",
      benefitTitleColor: "#061f44",
      benefitBodyColor: "#123456",
      benefitCardShadowColor: "#20c997",
      benefitCardShadowOpacity: 28,
    });
    Object.assign(benefits.fields, {
      iconColor: "#fe0066",
    });
    Object.assign(modal.fields, {
      guideKicker: "Before admission",
      guideTitle: "Bring these documents.",
      guideList: "<li>Birth certificate</li><li>Previous school report</li>",
      guideLinkText: "See process",
      guideLinkHref: "index.html#how-to-apply",
      headerBgColor: "#fe0066",
      guideBulletColor: "#20c997",
    });

    const html = await renderSchoolTemplatePreview({
      content,
      sourceSnapshot,
      pageSlug: "contact",
    });

    assertPreviewHtml(html);
    assert.match(html, /contact-button__label[\s\S]*Enroll Today/);
    assert.match(html, /contact-button__label[\s\S]*Call Reception/);
    assert.match(
      html,
      /class="contact-button contact-button--dark"[\s\S]*<svg viewBox="0 0 24 24" aria-hidden="true">/,
    );
    assert.match(html, /◎/);
    assert.match(html, /Main Campus/);
    assert.match(html, /20 Learning Avenue/);
    assert.doesNotMatch(html, /infoContent":"Main Campus/);
    assert.match(html, /▦/);
    assert.match(html, /Family Support/);
    assert.match(html, /Every family gets a clear admissions guide/);
    assert.match(html, /Before admission/);
    assert.match(html, /Bring these documents/);
    assert.match(html, /Birth certificate/);
    assert.match(html, /See process/);
    assert.match(html, /--dexta-academy-3-contact-info-icon-icon-color/);
    assert.match(html, /--dexta-academy-3-contact-benefits-icon-icon-color/);
    assert.match(html, /--dexta-academy-3-contact-benefits-card-shadow-color/);
    assert.match(html, /--dexta-academy-3-contact-admission-header-bg-color/);
    assert.match(html, /#fe0066/);
    assert.match(html, /#20c997/);
  });

  it("renders academy 3 navbar links directly to preview routes on every page", async () => {
    const content = buildSchoolTemplateProjectContent(dextaAcademy3Manifest);
    const sourceSnapshot = buildSchoolTemplateSourceSnapshot(
      dextaAcademy3Manifest,
    );
    const header = content.sharedSections.find(
      (section) => section.id === "site-header",
    );

    assert.ok(header, "Expected the Template 3 shared header section.");
    content.theme.brandName = "OBIYE ACADEMY";
    content.theme.navBarColor = "#fe0066";
    Object.assign(header.fields, {
      navHomeText: "Home",
      navHomeHref: "index.html",
      navAboutText: "About",
      navAboutHref: "about.html",
      navProgrammesText: "Programmes",
      navProgrammesHref: "index.html#programmes",
      navGalleryText: "Gallery",
      navGalleryHref: "gallery.html",
      navApplyText: "How To Apply",
      navApplyHref: "#how-to-apply",
      navContactText: "Contact",
      navContactHref: "contact.html",
    });

    for (const page of ["home", "about", "gallery", "contact"]) {
      const html = await renderSchoolTemplatePreview({
        content,
        sourceSnapshot,
        pageSlug: page,
        previewRouteBase:
          "/admin/we-brand-schools/projects/project-123/preview",
        previewSearch: "?editorPreview=7",
      });
      assertPreviewHtml(html);
      const previewHeader =
        html.match(
          /<header class="site-header"[^>]*>[\s\S]*?<\/header>/,
        )?.[0] ?? "";

      assert.match(previewHeader, /OBIYE ACADEMY/);
      assert.doesNotMatch(previewHeader, /data-site-navbar/);
      assert.doesNotMatch(previewHeader, /href="about\.html"/);
      assert.doesNotMatch(previewHeader, /href="gallery\.html"/);
      assert.doesNotMatch(previewHeader, /href="contact\.html"/);
      assert.match(
        previewHeader,
        /href="\/admin\/we-brand-schools\/projects\/project-123\/preview\/home\?editorPreview=7"/,
      );
      assert.match(
        previewHeader,
        /href="\/admin\/we-brand-schools\/projects\/project-123\/preview\/about\?editorPreview=7"/,
      );
      assert.match(
        previewHeader,
        /href="\/admin\/we-brand-schools\/projects\/project-123\/preview\/gallery\?editorPreview=7"/,
      );
      assert.match(
        previewHeader,
        /href="\/admin\/we-brand-schools\/projects\/project-123\/preview\/contact\?editorPreview=7"/,
      );
    }
  });

  it("loads google fonts for academy 3 theme and section font overrides", async () => {
    const content = buildSchoolTemplateProjectContent(dextaAcademy3Manifest);
    const sourceSnapshot = buildSchoolTemplateSourceSnapshot(
      dextaAcademy3Manifest,
    );
    const welcome = content.pages
      .find((page) => page.slug === "home")
      ?.sections.find((section) =>
        Object.prototype.hasOwnProperty.call(section.fields, "fontFamily"),
      );

    assert.ok(welcome, "Expected a Template 3 section font family field.");
    content.theme.fontFamily = "Poppins";
    content.theme.navLinkFontFamily = "Nunito Sans";
    welcome.fields.fontFamily = "Merriweather";

    const html = await renderSchoolTemplatePreview({
      content,
      sourceSnapshot,
      pageSlug: "home",
    });
    assertPreviewHtml(html);

    assert.match(
      html,
      /fonts\.googleapis\.com\/css2\?family=Poppins:ital,wght@0,100\.\.900;1,100\.\.900(?:&|&amp;)display=swap/,
    );
    assert.match(
      html,
      /fonts\.googleapis\.com\/css2\?family=Nunito\+Sans:ital,wght@0,100\.\.900;1,100\.\.900(?:&|&amp;)display=swap/,
    );
    assert.match(html, /getGoogleFontStylesheetUrl\(section\.fields\[key\]\)/);
    assert.match(html, /function applyFontFamily\(node, value\)/);
    assert.match(html, /applyFontFamily\(node, value\)/);
  });

  it("emits parseable academy 3 preview runtime scripts", async () => {
    const content = buildSchoolTemplateProjectContent(dextaAcademy3Manifest);
    const sourceSnapshot = buildSchoolTemplateSourceSnapshot(
      dextaAcademy3Manifest,
    );
    content.theme.fontFamily = "Montserrat";
    content.theme.navLinkFontFamily = "Poppins";
    content.theme.buttonOverlayEnabled = true;
    const hero = content.pages
      .find((page) => page.slug === "home")
      ?.sections.find((section) => section.id === "hero");
    assert.ok(hero, "Expected the Template 3 hero section.");
    hero.fields.headline = "Line one<br>Line two";

    const html = await renderSchoolTemplatePreview({
      content,
      sourceSnapshot,
      pageSlug: "home",
    });
    assertPreviewHtml(html);

    const scripts = Array.from(html.matchAll(/<script>([\s\S]*?)<\/script>/g));
    assert.ok(scripts.length > 0, "Expected inline preview scripts.");
    for (const [index, script] of scripts.map((match) => match[1]).entries()) {
      assert.doesNotThrow(
        () => new Script(script, { filename: `academy3-preview-${index}.js` }),
      );
    }
  });

  it("preserves admin-cleared academy 3 navbar values during preview sync", async () => {
    const content = buildSchoolTemplateProjectContent(dextaAcademy3Manifest);
    const sourceSnapshot = buildSchoolTemplateSourceSnapshot(
      dextaAcademy3Manifest,
    );
    const header = content.sharedSections.find(
      (section) => section.id === "site-header",
    );

    assert.ok(header, "Expected the Template 3 shared header section.");
    content.theme.brandName = "OBIYE ACADEMY";
    content.theme.brandTagline = "";
    Object.assign(header.fields, {
      navGalleryText: "",
      navGalleryHref: "",
      portalText: "",
      portalHref: "",
      headerCtaText: "",
      headerCtaHref: "",
    });

    const synced = syncSchoolTemplateProjectContentWithManifest({
      content,
      sourceSnapshot,
      rawContent: content,
      templateSlug: "dexta-academy-3",
    });
    const syncedHeader = synced.contentJson.sharedSections.find(
      (section) => section.id === "site-header",
    );
    const html = await renderSchoolTemplatePreview({
      content: synced.contentJson,
      sourceSnapshot: synced.sourceSnapshot,
      pageSlug: "home",
    });
    assertPreviewHtml(html);
    const previewHeader =
      html.match(/<header class="site-header"[^>]*>[\s\S]*?<\/header>/)?.[0] ??
      "";

    assert.equal(syncedHeader?.fields.navGalleryText, "");
    assert.equal(syncedHeader?.fields.portalText, "");
    assert.equal(syncedHeader?.fields.headerCtaText, "");
    assert.match(previewHeader, /aria-label="OBIYE ACADEMY home"/);
    assert.match(previewHeader, /<strong[^>]*>OBIYE ACADEMY<\/strong>/);
    assert.doesNotMatch(previewHeader, /<span>Academy<\/span>/);
    assert.doesNotMatch(previewHeader, /<a href="gallery\.html">Gallery<\/a>/);
    assert.doesNotMatch(previewHeader, /class="portal-link"[^>]*>Portal<\/a>/);
    assert.doesNotMatch(
      previewHeader,
      /class="button button--gold"[^>]*>Apply Now<\/a>/,
    );
    assert.match(html, /link\.style\.display = text && href \? "" : "none"/);
    assert.match(
      html,
      /setDisplay\("\.site-header \.portal-link", Boolean\(portalText && portalHref\)\)/,
    );
    assert.match(
      html,
      /function getTemplateThreeBrandText\(themeKey, headerKey, fallback\)[\s\S]*hasThemeField\(themeKey\)/,
    );
  });

  it("moves legacy academy 3 footer phone and email links into footer contact fields", () => {
    const content = buildSchoolTemplateProjectContent(dextaAcademy3Manifest);
    const sourceSnapshot = buildSchoolTemplateSourceSnapshot(
      dextaAcademy3Manifest,
    );
    const footer = content.sharedSections.find(
      (section) => section.id === "site-footer",
    );

    assert.ok(footer?.repeatable, "Expected the Template 3 footer links.");
    footer.repeatable.items.push(
      {
        footerLinkLabel: "+2348064578594",
        footerLinkHref: "tel: +2348064578594",
        footerLinkVisible: 1,
      },
      {
        footerLinkLabel: "obiyeacademy13@gmail.com",
        footerLinkHref: "mailto: obiyeacademy13@gmail.com",
        footerLinkVisible: 1,
      },
    );

    const synced = syncSchoolTemplateProjectContentWithManifest({
      content,
      sourceSnapshot,
      rawContent: content,
      templateSlug: "dexta-academy-3",
    });
    const syncedFooter = synced.contentJson.sharedSections.find(
      (section) => section.id === "site-footer",
    );
    const footerLinkHrefs =
      syncedFooter?.repeatable?.items.map((item) =>
        String(item.footerLinkHref ?? ""),
      ) ?? [];

    assert.equal(syncedFooter?.fields.footerPhone, "+2348064578594");
    assert.equal(syncedFooter?.fields.footerPhoneHref, "tel: +2348064578594");
    assert.equal(syncedFooter?.fields.footerEmail, "obiyeacademy13@gmail.com");
    assert.equal(
      syncedFooter?.fields.footerEmailHref,
      "mailto: obiyeacademy13@gmail.com",
    );
    assert.ok(
      Object.prototype.hasOwnProperty.call(
        syncedFooter?.fields ?? {},
        "footerAddress",
      ),
      "Expected footer address to be editable.",
    );
    assert.deepEqual(
      footerLinkHrefs.filter(
        (href) =>
          href.toLowerCase().startsWith("tel:") ||
          href.toLowerCase().startsWith("mailto:"),
      ),
      [],
    );
  });

  it("renders the admin-uploaded logo in the academy 3 preview navbar and loader", async () => {
    const content = buildSchoolTemplateProjectContent(dextaAcademy3Manifest);
    const sourceSnapshot = buildSchoolTemplateSourceSnapshot(
      dextaAcademy3Manifest,
    );

    content.theme.logoUrl = "custom/school-logo.png";
    content.theme.logoBackgroundColor = "#123456";

    const html = await renderSchoolTemplatePreview({
      content,
      sourceSnapshot,
      pageSlug: "home",
    });
    assertPreviewHtml(html);

    assert.match(
      html,
      /<header class="site-header"[^>]*>[\s\S]*<span class="brand__crest dexta-theme-logo-mark"[^>]*aria-hidden="true">[\s\S]*<img src="[^"]*custom\/school-logo\.png" alt="School logo">/,
    );
    assert.match(
      html,
      /<div id="page-loader" class="page-loader"[\s\S]*<span class="page-loader__crest brand__crest dexta-theme-logo-mark"[^>]*aria-hidden="true">[\s\S]*<img src="[^"]*custom\/school-logo\.png" alt="School logo">/,
    );
    assert.match(html, /style="[^"]*background:#123456!important/);
    assert.doesNotMatch(
      html,
      /<header class="site-header"[^>]*>[\s\S]*brand__crest-inner[\s\S]*<\/header>/,
    );
    assert.match(
      html,
      /\.brand__mark, \.brand__crest, \.site-loader__mark, \.page-loader__crest/,
    );
  });

  it("does not fall back to the template crest when the academy 3 preview logo is removed", async () => {
    const content = buildSchoolTemplateProjectContent(dextaAcademy3Manifest);
    const sourceSnapshot = buildSchoolTemplateSourceSnapshot(
      dextaAcademy3Manifest,
    );

    content.theme.logoUrl = "";

    const html = await renderSchoolTemplatePreview({
      content,
      sourceSnapshot,
      pageSlug: "home",
    });
    assertPreviewHtml(html);

    assert.match(
      html,
      /<span class="brand__crest dexta-empty-logo-mark" hidden aria-hidden="true">/,
    );
    assert.match(
      html,
      /<span class="page-loader__crest brand__crest dexta-empty-logo-mark" hidden aria-hidden="true">/,
    );
    assert.doesNotMatch(
      html,
      /<header class="site-header"[^>]*>[\s\S]*brand__crest-inner[\s\S]*<\/header>/,
    );
    assert.match(
      html,
      /\.brand__crest\.dexta-empty-logo-mark,\.page-loader__crest\.dexta-empty-logo-mark\{display:none!important;\}/,
    );
  });

  it("preserves the original hero animation and button markup in previews", async () => {
    const content = buildSchoolTemplateProjectContent(dextaAcademy3Manifest);
    const sourceSnapshot = buildSchoolTemplateSourceSnapshot(
      dextaAcademy3Manifest,
    );
    const html = await renderSchoolTemplatePreview({
      content,
      sourceSnapshot,
      pageSlug: "home",
    });
    assertPreviewHtml(html);

    assert.match(
      html,
      /src="https:\/\/res\.cloudinary\.com\/djyarsuk6\/image\/upload\/v1781002181\/hero-bg_cwzvwm\.png"/,
    );
    assert.match(
      html,
      /src="https:\/\/res\.cloudinary\.com\/djyarsuk6\/image\/upload\/v1781002323\/hero-image_r50mkt\.png"/,
    );
    // The shared preview script mentions it; Template 3 images keep their src.
    assert.doesNotMatch(html, /<img\b[^>]*data-original-src=/);
    assert.match(html, /hero__segment hero__segment--drop-top hero__step-3/);
    assert.match(html, /hero__accent hero__accent--fade hero__accent--joyful/);
    assert.match(html, /hero__segment hero__segment--drop-bottom hero__step-4/);
    assert.match(
      html,
      /class="button button--gold hero__cta-primary"[\s\S]*<span aria-hidden="true">↗<\/span>/,
    );
    assert.match(html, /function applyAcademyThreeHeroTitle/);
    assert.match(
      html,
      /field\.key === "headline" && applyAcademyThreeHeroTitle\(node, value\)/,
    );
  });

  it("renders admin-updated academy 3 hero headline colors without colliding lines", async () => {
    const content = buildSchoolTemplateProjectContent(dextaAcademy3Manifest);
    const sourceSnapshot = buildSchoolTemplateSourceSnapshot(
      dextaAcademy3Manifest,
    );
    const homePage = content.pages.find((page) => page.slug === "home");
    const hero = homePage?.sections.find((section) => section.id === "hero");

    assert.ok(hero, "Expected the Template 3 home hero section.");
    Object.assign(hero.fields, {
      headline:
        '<p><span style="font-size: 112px;">Quality Learning</span></p><p>Made Joyful,</p><p>Bold, And</p><p>Nigerian!</p>',
      sectionBgColor: "#fe0066",
      sectionBgOpacity: 84,
      headlineTextColor: "#fff7df",
      joyfulAccentColor: "#fe0066",
      boldAccentColor: "#20c997",
      primaryButtonShadowColor: "#20c997",
      primaryButtonShadowOpacity: 0,
      secondaryButtonShadowColor: "#fe0066",
      secondaryButtonShadowOpacity: 33,
    });

    const html = await renderSchoolTemplatePreview({
      content,
      sourceSnapshot,
      pageSlug: "home",
    });
    assertPreviewHtml(html);

    assert.match(
      html,
      /\.hero h1,\.hero__title\{max-width:min\(14\.5ch,100%\)!important;line-height:1\.04!important;letter-spacing:0!important;overflow-wrap:break-word!important;text-wrap:balance;color:#fff7df!important;\}/,
    );
    assert.match(
      html,
      /\.hero__line\{display:flex!important;align-items:baseline!important;justify-content:center!important;flex-wrap:wrap!important;gap:0 \.18em!important;min-height:1\.04em!important;color:#fff7df!important;\}/,
    );
    assert.match(
      html,
      /\.hero\{background:#031225!important;background-color:#031225!important;\}/,
    );
    assert.doesNotMatch(
      html,
      /\.hero\{background:rgba\(254, 0, 102, 0\.84\)!important;background-color:rgba\(254, 0, 102, 0\.84\)!important;\}/,
    );
    assert.match(
      html,
      /\.hero__sky-layer\{top:0!important;right:0!important;bottom:0!important;left:0!important;height:auto!important;max-height:none!important;background:rgba\(254, 0, 102, 0\.84\)!important;background-image:none!important;overflow:hidden!important;\}/,
    );
    assert.match(
      html,
      /\.hero::before\{background:radial-gradient\(circle at 50% 74%,color-mix\(in srgb,rgba\(254, 0, 102, 0\.84\) 58%,transparent\)/,
    );
    assert.match(
      html,
      /\.hero::after\{background:linear-gradient\(180deg,color-mix\(in srgb,rgba\(254, 0, 102, 0\.84\) 16%,transparent\)/,
    );
    assert.match(
      html,
      /\.hero__sky-layer,\.hero::before,\.hero::after\{top:0!important;right:0!important;bottom:0!important;left:0!important;height:auto!important;max-height:none!important;\}/,
    );
    assert.match(
      html,
      /@media \(max-width:560px\)\{\.hero__sky-layer,\.hero::before,\.hero::after\{top:0!important;right:0!important;bottom:0!important;left:0!important;height:auto!important;max-height:none!important;\}/,
    );
    assert.match(html, /\.hero__accent--joyful\{color:#fe0066!important;\}/);
    assert.match(html, /\.hero__accent--bold\{color:#20c997!important;\}/);
    assert.match(
      html,
      /\.hero__cta-primary\{box-shadow:0 18px 34px rgba\(32, 201, 151, 0\)!important;\}\.hero__cta-secondary\{box-shadow:inset 0 0 0 1px rgba\(254, 0, 102, 0\.33\)!important;\}/,
    );
    assert.match(html, /--dexta-academy-3-home-hero-headline-text-color/);
    assert.match(html, /--dexta-academy-3-home-hero-joyful-accent-color/);
    assert.match(html, /--dexta-academy-3-home-hero-bold-accent-color/);
    assert.match(
      html,
      /--dexta-academy-3-home-hero-primary-button-shadow-color/,
    );
    assert.match(
      html,
      /--dexta-academy-3-home-hero-primary-button-shadow-opacity/,
    );
    assert.match(
      html,
      /--dexta-academy-3-home-hero-secondary-button-shadow-color/,
    );
    assert.match(
      html,
      /--dexta-academy-3-home-hero-secondary-button-shadow-opacity/,
    );
    assert.match(html, /function applyAcademyThreeHeroColorField/);
    assert.match(html, /function applyAcademyThreeHeroCurrentColors/);
    assert.match(html, /applyAcademyThreeHeroCurrentColors\(node\)/);
    assert.match(html, /function getAcademyThreeHeroFontSize/);
    assert.match(html, /function getResponsiveAcademyThreeHeroFontSize/);
    assert.match(html, /return "clamp\(2\.85rem, 10vw, " \+ size \+ "\)"/);
    assert.match(
      html,
      /var heroFontSize = getResponsiveAcademyThreeHeroFontSize\(value\)/,
    );
    assert.match(
      html,
      /node\.style\.setProperty\("font-size", heroFontSize, "important"\)/,
    );
    assert.match(
      html,
      /var isAcademyThreeHeroHeadline =[\s\S]*field\.key === "headline"[\s\S]*node\.classList\.contains\("hero__title"\)/,
    );
    assert.match(
      html,
      /field\.key === "headlineTextColor"[\s\S]*selectors = \["\.hero__title", "\.hero__line", "\.hero__segment"\]/,
    );
    assert.match(
      html,
      /applyAcademyThreeHeroColorField\(node, field, cssValue\)/,
    );
    assert.match(
      html,
      /var headlineColor = getAcademyThreeHeroFieldText\("headlineTextColor", "#fff"\)/,
    );
    assert.match(
      html,
      /\.hero__sky-image\{position:absolute!important;inset:0!important;width:100%!important;height:100%!important;object-fit:cover!important;object-position:center top!important;opacity:\.94!important;transform:scale\(1\.12\);transform-origin:center top!important;\}/,
    );
    assert.match(
      html,
      /\.hero\{--dexta-academy-3-home-hero-overlay-color:color-mix\(in srgb,var\(--dexta-academy-3-home-hero-section-bg-color,#031225\) var\(--dexta-academy-3-home-hero-section-bg-opacity,100%\),transparent\);background-color:#031225!important;background-image:none!important;\}/,
    );

    const styles = readFileSync(
      "src/app/(public)/dexta-academy-3/styles.css",
      "utf8",
    );
    assert.match(styles, /--dexta-academy-3-home-hero-bg-layer: color-mix\(/);
    assert.match(
      styles,
      /@media \(max-width: 560px\)[\s\S]*\.hero__sky-layer,\s*\.hero::before,\s*\.hero::after\s*\{\s*bottom: auto;\s*height: calc\(100% - clamp\(150px, 30vw, 230px\)\);\s*max-height: none;/,
    );
  });

  it("preserves the original about page sections, modal, and CTA markup in previews", async () => {
    const content = buildSchoolTemplateProjectContent(dextaAcademy3Manifest);
    const sourceSnapshot = buildSchoolTemplateSourceSnapshot(
      dextaAcademy3Manifest,
    );
    const html = await renderSchoolTemplatePreview({
      content,
      sourceSnapshot,
      pageSlug: "about",
    });
    assertPreviewHtml(html);

    assert.match(html, /class="about-hero__line"/);
    assert.match(html, /class="about-story-card about-story-card--story/);
    assert.match(html, /class="about-values__marquee/);
    assert.match(html, /class="about-approach"/);
    assert.match(html, /class="about-impact-band"/);
    assert.match(html, /class="about-tour-band"/);
    assert.match(html, /<dialog class="story-modal" id="story-modal" hidden>/);
    assert.match(
      html,
      /class="button button--gold about-hero__button"[\s\S]*<span aria-hidden="true">↗<\/span>/,
    );
    assert.match(
      html,
      /class="button button--navy reveal-item reveal-item--fade"[\s\S]*<span aria-hidden="true">↗<\/span>/,
    );
  });

  it("prefers the academy 3 manifest when a stale snapshot points elsewhere", async () => {
    const content = buildSchoolTemplateProjectContent(dextaAcademy3Manifest);
    const staleSnapshot = buildSchoolTemplateSourceSnapshot(
      dextaAcademy2Manifest,
    );

    const html = await renderSchoolTemplatePreview({
      content,
      sourceSnapshot: staleSnapshot,
      pageSlug: "home",
    });
    assertPreviewHtml(html);

    assert.match(html, /<base href="\/dexta-academy-3\/">/);
    assert.match(html, /<title>DXT Academy<\/title>/);
    assert.doesNotMatch(html, /<base href="\/dexta-academy-2\/">/);
  });

  it("uses the academy 3 URL when a template slug is stale", () => {
    const manifest = resolveSchoolTemplateManifestForSelection({
      templateSlug: "dexta-academy-2",
      websiteUrl: "/dexta-academy-3",
    });

    assert.equal(manifest?.templateSlug, "dexta-academy-3");
  });
});
