import assert from "node:assert/strict";
import { describe, it } from "node:test";
import { schoolTemplateManifests } from "@/lib/school-template-manifests";
import {
  buildSchoolTemplateProjectContent,
  buildSchoolTemplateSourceSnapshot,
  parseSchoolTemplateProjectContent,
  syncSchoolTemplateProjectContentWithManifest,
} from "@/lib/school-template-project-content";
import { renderSchoolTemplatePreview } from "@/lib/school-template-preview-renderer";

describe("school template loading theme", () => {
  it("provides loading page defaults for every template", () => {
    for (const manifest of schoolTemplateManifests) {
      const content = buildSchoolTemplateProjectContent(manifest);

      assert.equal(typeof content.theme.loadingText, "string");
      assert.equal(typeof content.theme.loadingTextColor, "string");
      assert.ok(content.theme.loadingText.length > 0);
      assert.ok(content.theme.loadingTextColor.length > 0);
      assert.ok(content.theme.loadingLogoWidth > 0);
      assert.ok(content.theme.loadingLogoHeight > 0);
    }
  });

  it("carries loading text and loading logo sizing into preview runtime", async () => {
    const manifest = schoolTemplateManifests.find(
      (item) => item.templateSlug === "dexta-academy-2",
    );

    assert.ok(manifest, "Expected Template 2 manifest.");

    const content = buildSchoolTemplateProjectContent(manifest);
    const sourceSnapshot = buildSchoolTemplateSourceSnapshot(manifest);

    content.theme.loadingText = "Opening River Gate Academy";
    content.theme.loadingTextColor = "#f8fafc";
    content.theme.loadingLogoWidth = 104;
    content.theme.loadingLogoHeight = 76;

    const html = await renderSchoolTemplatePreview({
      content,
      sourceSnapshot,
      pageSlug: "home",
    });

    assert.ok(html, "Expected home preview HTML.");
    assert.match(html, /Opening River Gate Academy/);
    assert.match(html, /loadingTextColor":"#f8fafc"/);
    assert.match(html, /loadingLogoWidth":104/);
    assert.match(html, /loadingLogoHeight":76/);
    assert.match(html, /site-loader__mark/);
  });

  it("syncs older saved projects to template-specific loading defaults", () => {
    const manifest = schoolTemplateManifests.find(
      (item) => item.templateSlug === "dexta-academy-2",
    );

    assert.ok(manifest, "Expected Template 2 manifest.");

    const content = buildSchoolTemplateProjectContent(manifest);
    const sourceSnapshot = buildSchoolTemplateSourceSnapshot(manifest);
    const legacyContent = JSON.parse(JSON.stringify(content));

    delete legacyContent.theme.loadingText;
    delete legacyContent.theme.loadingTextColor;
    delete legacyContent.theme.loadingLogoWidth;
    delete legacyContent.theme.loadingLogoHeight;

    const parsed = parseSchoolTemplateProjectContent(legacyContent);

    assert.ok(parsed.success, "Expected legacy content to parse.");
    assert.equal(parsed.data.theme.loadingText, "Loading school website");
    assert.equal(parsed.data.theme.loadingTextColor, "#111827");

    const synced = syncSchoolTemplateProjectContentWithManifest({
      content: parsed.data,
      sourceSnapshot,
      rawContent: legacyContent,
    });

    assert.equal(synced.contentJson.theme.loadingText, "Loading DXT Academy");
    assert.equal(synced.contentJson.theme.loadingTextColor, "#ffffff");
    assert.equal(synced.contentJson.theme.loadingLogoWidth, 48);
    assert.equal(synced.contentJson.theme.loadingLogoHeight, 48);
  });

  it("does not rewrite loading settings that match generic defaults by choice", () => {
    const manifest = schoolTemplateManifests.find(
      (item) => item.templateSlug === "dexta-academy-2",
    );

    assert.ok(manifest, "Expected Template 2 manifest.");

    const content = buildSchoolTemplateProjectContent(manifest);
    const sourceSnapshot = buildSchoolTemplateSourceSnapshot(manifest);

    content.theme.loadingText = "Loading school website";
    content.theme.loadingLogoWidth = 64;
    content.theme.loadingLogoHeight = 64;

    const synced = syncSchoolTemplateProjectContentWithManifest({
      content,
      sourceSnapshot,
      rawContent: JSON.parse(JSON.stringify(content)),
    });

    assert.equal(
      synced.contentJson.theme.loadingText,
      "Loading school website",
    );
    assert.equal(synced.contentJson.theme.loadingLogoWidth, 64);
    assert.equal(synced.contentJson.theme.loadingLogoHeight, 64);
  });

  it("renders Template 5 without a loading screen (removed from the template)", async () => {
    const manifest = schoolTemplateManifests.find(
      (item) => item.templateSlug === "dexta-academy-5",
    );

    assert.ok(manifest, "Expected Template 5 manifest.");

    const html = await renderSchoolTemplatePreview({
      content: buildSchoolTemplateProjectContent(manifest),
      sourceSnapshot: buildSchoolTemplateSourceSnapshot(manifest),
      pageSlug: "home",
    });

    assert.ok(html, "Expected Template 5 home preview HTML.");
    // Shared theme CSS still names .site-loader__mark; no element uses it.
    assert.doesNotMatch(html, /data-site-loader/);
    assert.doesNotMatch(html, /<[a-z]+[^>]*class="site-loader[\s"]/);
  });
});
