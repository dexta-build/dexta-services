/**
 * Words on the Events page and every event page, edited in Pages → Events
 * and Pages → Event pages. These defaults are also the components'
 * fallbacks, so this module stays safe on server and client.
 */

export const EVENTS_BOARD_LABELS = {
  noUpcomingTitle: "No upcoming events right now",
  noUpcomingBody:
    "New events are announced here first. Browse past events below or follow us on social media to hear about the next one.",
  allTitle: "All events",
  filterAll: "All",
  filterUpcoming: "Upcoming",
  filterPast: "Past",
  filterInPerson: "In person",
  filterOnline: "Online",
  empty: "No events here yet.",
  loadMore: "Load more",
  startsIn: "Starts in",
  ended: "Ended",
};

export const EVENT_PAGE_LABELS = {
  about: "About this event",
  dateLabel: "Date & time",
  locationLabel: "Location",
  formatLabel: "Format",
  spacesLabel: "Spaces",
  openToAll: "Open to all",
  spotsLeftOne: "1 spot left",
  spotsLeftMany: "{count} spots left",
  full: "Fully booked",
  closed: "Registration closed",
  calendar: "Add to Google Calendar",
  ended: "Ended",
  endedTitle: "This event has ended",
  endedBody: "Thanks to everyone who came. See what's coming up next.",
  endedButton: "See upcoming events",
};

export const REGISTRATION_FORM_LABELS = {
  title: "Register",
  subtitle: "Save your seat. We'll confirm by email.",
  nameLabel: "Full name",
  namePlaceholder: "Your full name",
  emailLabel: "Email",
  emailPlaceholder: "you@example.com",
  choose: "Choose…",
  submit: "Register",
  submitting: "Sending…",
  successTitle: "You're on the list",
  successBody:
    "We've received your registration and sent a confirmation to your inbox. We'll email you again once your seat is confirmed.",
  closedTitle: "Registration closed",
  closedBody: "This event is no longer taking registrations.",
  privacy: "We only use your details for this event.",
};

export type EventsBoardLabels = typeof EVENTS_BOARD_LABELS;
export type EventPageLabels = typeof EVENT_PAGE_LABELS;
export type RegistrationFormLabels = typeof REGISTRATION_FORM_LABELS;
