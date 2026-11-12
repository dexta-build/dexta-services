/** Choice lists shared by section fields. */

const ICONS = [
  ["palette", "Palette"],
  ["pen", "Pen"],
  ["share", "Share"],
  ["presentation", "Presentation"],
  ["package", "Package"],
  ["sparkles", "Sparkles"],
  ["globe", "Globe"],
  ["app", "App"],
  ["cart", "Cart"],
  ["code", "Code"],
  ["school", "School"],
  ["wrench", "Wrench"],
  ["mail", "Envelope"],
  ["book", "Book"],
  ["card", "Card"],
  ["flag", "Flag"],
  ["shirt", "Shirt"],
  ["maximize", "Large format"],
  ["heart", "Heart"],
  ["flower", "Flower"],
  ["party", "Party"],
  ["cake", "Cake"],
  ["monitor", "Monitor"],
  ["briefcase", "Briefcase"],
  ["calendar", "Calendar"],
  ["lightbulb", "Light bulb"],
] as const;

export const ICON_OPTIONS = ICONS.map(([value, label]) => ({ value, label }));

export const SURFACE_OPTIONS = [
  ["canvas", "Cream"],
  ["white", "White"],
  ["ice", "Ice blue"],
  ["royal", "Royal blue"],
  ["brand", "Brand blue"],
  ["ocean", "Ocean"],
  ["gold", "Gold"],
  ["lilac", "Lilac"],
  ["coral", "Coral"],
  ["mint", "Mint"],
  ["plum", "Plum"],
  ["forest", "Forest"],
  ["stone", "Stone"],
].map(([value, label]) => ({ value, label }));
