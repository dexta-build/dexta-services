/**
 * Words on the offer cards, countdown and empty state, edited in
 * Pages → Offers. These defaults are also the components' fallbacks, so
 * this module stays safe on server and client.
 */

export const OFFER_CARD_LABELS = {
  customQuote: "Custom quote",
  estimateNote: "estimate at today's rate",
  payButton: "Pay now",
  orderButton: "Order on WhatsApp",
  quoteButton: "Get a quote on WhatsApp",
  contactButton: "Ask about this offer",
  messageIntro: "Hello Dexta! I'm interested in the {offer} offer.",
  messageQuote: "Please send me a quote.",
  endsOn: "Ends {date}",
  endingToday: "Ending today",
  days: "Days",
  hours: "Hours",
  mins: "Mins",
  secs: "Secs",
};

export const NO_OFFERS_LABELS = {
  title: "No Offer available at this time",
  body: "New offers are on the way. In the meantime, browse our catalogues or tell us what you need.",
  primary: { label: "Browse catalogues", href: "/catalogue" },
  whatsappLabel: "Chat on WhatsApp",
};

export type OfferCardLabels = typeof OFFER_CARD_LABELS;
export type NoOffersLabels = typeof NO_OFFERS_LABELS;
