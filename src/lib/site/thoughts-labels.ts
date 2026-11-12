/**
 * Words on the Thoughts pages and every article, edited in Pages → Thoughts
 * and Pages → Article pages. These defaults are also the components'
 * fallbacks, so this module stays safe on server and client.
 */

export const THOUGHTS_BROWSE_LABELS = {
  allCategories: "All categories",
  searchPlaceholder: "Search…",
  sortLabel: "Sort by",
  latest: "Latest",
  oldest: "Oldest",
  noneTitle: "No thoughts published yet",
  noneBody: "Our team is writing. Check back soon.",
  noMatchTitle: "Nothing matches that search",
  noMatchBody: "Try a different word or category.",
  clearSearch: "Clear search",
  loadMore: "Load more",
  showing: "Showing {shown} of {total}",
  trending: "Trending",
  readTime: "{n} min to read",
  articleOne: "{count} article",
  articleMany: "{count} articles",
};

export const ARTICLE_LABELS = {
  tldr: "TL;DR",
  by: "By",
  writtenBy: "Written by",
  onThisPage: "On this page",
  helpTitle: "Need a hand with *this*?",
  helpBody: "Our team can design, build or print it for you.",
  helpButton: "Talk to us",
  relatedEyebrow: "Keep reading",
  relatedTitle: "More *thoughts*",
  seeAll: "See all thoughts",
};

export type ThoughtsBrowseLabels = typeof THOUGHTS_BROWSE_LABELS;
export type ArticleLabels = typeof ARTICLE_LABELS;

export const fillIn = (text: string, vars: Record<string, string | number>) =>
  text.replace(/\{(\w+)\}/g, (m, k) => (k in vars ? String(vars[k]) : m));
