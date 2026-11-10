import { STOCK } from "./stock-media";

/**
 * Copy for /offers. The offers themselves come from the Offer table (admin);
 * everything here is page text. Please check the "includes" list matches
 * what Dexta really provides with every offer.
 */
export const OFFERS_PAGE = {
  hero: {
    eyebrow: "Offers",
    title: "Great work, *great value*",
    body: "Ready-made offers that bring design, build and print together, at a clear price. Pay online or order on WhatsApp.",
    cta: "See current offers",
    image: STOCK.teamMeeting,
  },
  offers: {
    eyebrow: "Current offers",
    title: "One team, *offers that fit*",
    body: "Each offer can mix design, software and print, so you get everything you need in one place. Prices show in your currency.",
  },
  includes: {
    title: "Every offer includes",
    items: [
      "A dedicated Dexta contact on WhatsApp",
      "Design proofs before anything is produced",
      "Revisions within the agreed scope",
      "Secure payment by link or bank transfer",
      "Prices in NGN, USD, EUR and GBP",
      "Delivery across Nigeria, shipping abroad on request",
      "Your final files handed over",
      "Support after delivery or launch",
    ],
  },
  faqs: [
    {
      q: "How long do offers last?",
      a: "Some offers run until further notice. Limited-time offers show a countdown; when it reaches zero the offer ends.",
    },
    {
      q: "How do I pay?",
      a: "Tap Pay now to pay securely online, or order on WhatsApp and we'll send payment details. Some offers only have one of these.",
    },
    {
      q: "Can I pay in dollars, euros or pounds?",
      a: "Yes. Switch the currency to see an estimate at today's exchange rate. We confirm the final amount before we start.",
    },
    {
      q: "Can you adjust an offer for me?",
      a: "Of course. Tell us what you need on WhatsApp and we'll tailor the offer to your goals and budget.",
    },
    {
      q: 'What does "Custom quote" mean?',
      a: "The price depends on your project. Send us a message and we'll reply with a quote, usually within a day.",
    },
    {
      q: "Do offers cover design, software and print together?",
      a: "Yes. An offer can include any mix of our services, so you don't have to buy them separately.",
    },
  ],
  closing: {
    title: "Need something different? *Let's build it together*",
    body: "Tell us what you need and we'll put together an offer that fits.",
    image: STOCK.teamCafe,
  },
};
