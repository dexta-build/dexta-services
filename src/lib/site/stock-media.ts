import { getCloudinaryUrl } from "@/lib/cloudinary";

/**
 * TEMPORARY stock imagery (Unsplash licence: free for commercial use, no
 * attribution required). Every image used on the new public pages that is
 * not real Dexta work lives here, so replacing them later means editing one
 * file. In the admin phase these become uploadable.
 */

const STOCK_ID = /^\d{10,13}-[0-9a-f]{8,14}$/;

/**
 * Image address for any stored image value, cropped to w×h (h optional):
 * - a stock photo ID (Unsplash),
 * - a site path ("/images/…") or full URL (used as is),
 * - a Cloudinary public ID from the media library.
 * Sections edited in the admin can hold any of these.
 */
export function stock(id: string, w = 1200, h?: number) {
  if (!id) return "";
  if (STOCK_ID.test(id)) {
    const size = h ? `&h=${h}&fit=crop` : "";
    return `https://images.unsplash.com/photo-${id}?auto=format&q=75&w=${w}${size}`;
  }
  if (id.startsWith("/") || /^https?:\/\//i.test(id)) return id;
  return getCloudinaryUrl(id, { c: "fill", g: "auto", w, h });
}

export const STOCK = {
  // Scenes
  teamCafe: "1522202176988-66273c2fd55f",
  teamWhiteboard: "1552664730-d307ca884978",
  teamLaptopCasual: "1543269865-cbf427effbad",
  teamLibrary: "1523240795612-9a054b0db644",
  designerTablet: "1572044162444-ad60f128bdea",
  colourSwatches: "1561070791-2526d30994b5",
  typeOnTablet: "1611532736597-de2d4265fba3",
  webDesignMonitor: "1559028012-481c04fa702d",
  developerScreens: "1542744094-3a31f272c490",
  codeOnLaptop: "1498050108023-c5249f4df085",
  phoneUi: "1586953208448-b95a79798f07",
  // Services: print, merch and stationery
  ideasLightbox: "1589561253898-768105ca91a8",
  whiteTshirt: "1521572163474-6864f9cf17ab",
  whiteMug: "1514228742587-6b1558fcca3d",
  toteBag: "1544816155-12df9643f363",
  notebook: "1531346878377-a5be20888e57",
  brushes: "1517697471339-4aa32003c11a",
  paintStrokes: "1513364776144-60967b0f800f",
  craftSupplies: "1452860606245-08befc0ff44b",
  architectDrawings: "1503387762-592deb58ef4e",
  // Services: design and build
  appScreensImac: "1609921212029-bb5a28e60960",
  laptopPhone: "1563986768609-322da13575f3",
  blueWaves: "1634017839464-5c339ebe3cb4",
  abstract3d: "1626544827763-d516dce335e2",
  stickyNotes: "1611224923853-80b023f02d71",
  laptopBrowsing: "1542744095-291d1f67b221",
  wireframeBoard: "1531403009284-440f080d1e12",
  sketchWireframes: "1581291518857-4e27b48ff24e",
  laptopPhoneApp: "1545235617-9465d2a55698",
  darkDashboard: "1559028006-448665bd7c7f",
  tabletSketch: "1586717791821-3f44a563fa4c",
  shoppingLaptopPhone: "1618761714954-0b8cd0026356",
  analyticsDark: "1551288049-bebda4e38f71",
  laptopAnalytics: "1460925895917-afdab827c52f",
  laptopCode: "1517694712202-14dd9538aa97",
  laptopCharts: "1504868584819-f8e8b4b6d7e3",
  socialLaptopPhone: "1563986768494-4dee2763ff3f",
  shopOwner: "1556742049-0cfed4f6a45d",
  cardReader: "1556742502-ec7c0e9f34b1",
  serverRack: "1558494949-ef010cbdcc31",
  cardPayment: "1563013544-824ae1b704d3",
  phoneAppUi: "1551650975-87deedd944c3",
  developerWoman: "1580894908361-967195033215",
  teamMeeting: "1572021335469-31706a17aaef",
  meetingHands: "1517245386807-bb43f82c33c4",
  codeScreen: "1624953587687-daf255b6b80a",
  // Celebrations & events
  weddingCouple: "1583939003579-730e3918a45a",
  weddingRings: "1606800052052-a08af7148866",
  weddingTable: "1519225421980-715cb0215aed",
  weddingAisle: "1511285560929-80b456fea0bc",
  eventTableSetup: "1464366400600-7168b8af9bc3",
  balloons: "1530103862676-de8c9debad1d",
  confettiConcert: "1492684223066-81342ee5ff30",
  celebrationToast: "1527529482837-4698179dc6ce",
  dinnerParty: "1528605248644-14dd04022da1",
  friendsSunset: "1529333166437-7750a6dd5a70",
  giftRibbon: "1513201099705-a9746e1e201f",
  goldRibbons: "1607344645866-009c320b63e0",
  eventStage: "1505373877841-8d25f7d46678",
  colourfulPortrait: "1509631179647-0177331693ae",
  // Portraits (used as audience avatars)
  womanPortraitA: "1531123897727-8f129e1688ce",
  manPortraitA: "1531384441138-2736e62e0919",
  manPortraitB: "1522529599102-193c0d76b5b6",
  womanPortraitB: "1589156280159-27698a70f29e",
  manPortraitC: "1506277886164-e25aa3f4ef7f",
  womanPortraitC: "1611432579699-484f7990b127",
  womanPortraitD: "1573496359142-b8d87734a5a2",
  womanPortraitE: "1544005313-94ddf0286df2",
} as const;

/** Placeholder showreel until Dexta has its own (served from /public). */
export const SHOWREEL_VIDEO = "/videos/video1.mp4";

/** Is this stored media value a video (a video file or Cloudinary video)? */
export function isVideoSource(value: string) {
  return (
    /\.(mp4|webm|mov|m4v)(\?.*)?$/i.test(value) ||
    value.includes("/video/upload/")
  );
}

/**
 * A stored media value (image or video) as an item for MediaAsset and the
 * gallery viewer.
 */
export function mediaItemFor(value: string, alt: string, width = 1200) {
  return isVideoSource(value)
    ? { kind: "video" as const, src: value, alt }
    : { kind: "image" as const, src: stock(value, width), alt };
}
