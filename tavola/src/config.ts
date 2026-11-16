/**
 * Everything the page says or shows lives here: brand, nav, the ingredient
 * cut-outs, and the dishes. Swap an image, a colour or a sentence in this file
 * and the table follows.
 */

/** Table geometry, in the table's own units (the camera scales them to pixels). */
export const TABLE = {
  size: 2000,
  /** distance from the centre of the table to the centre of each plate */
  ring: 700,
  /** plate diameter */
  plate: 460,
  /** how much the plate at the front grows */
  boost: 0.25,
} as const;

export const brand = {
  name: "TAVOLA",
  tagline: "Open kitchen · Lisbon",
  /** stitched around the middle of the cloth */
  lettering: "TAVOLA · COZINHA ABERTA · DESDE 1987 · MESA PARA TODOS · ",
};

export const nav = [
  { label: "Menu", href: "#menu" },
  { label: "Kitchen", href: "#kitchen" },
  { label: "Wine", href: "#wine" },
  { label: "Visit", href: "#visit" },
];

/* ------------------------------------------------------------------ */
/* Ingredients                                                         */
/* ------------------------------------------------------------------ */

export type Ingredient = {
  /** cut-out, shot from straight above */
  file: string;
  /** its own blurred silhouette, used as a drop shadow */
  shadow: string;
  name: string;
  /** edge of the (square) cut-out in table units */
  size: number;
};

const ing = (id: string, name: string, size: number): Ingredient => ({
  file: `/img/ingredients/${id}.webp`,
  shadow: `/img/ingredients/${id}-shadow.webp`,
  name,
  size,
});

export const ingredients = {
  basil: ing("basil", "Basil", 190),
  mint: ing("mint", "Mint", 170),
  tomato: ing("tomato", "Vine tomatoes", 190),
  lemon: ing("lemon", "Lemon", 150),
  orange: ing("orange", "Orange", 160),
  chili: ing("chili", "Red chilli", 240),
  garlic: ing("garlic", "Garlic", 170),
  parsley: ing("parsley", "Flat-leaf parsley", 200),
  walnut: ing("walnut", "Walnuts", 160),
  rosemary: ing("rosemary", "Rosemary", 240),
  pomegranate: ing("pomegranate", "Pomegranate", 140),
  raspberry: ing("raspberry", "Raspberries", 160),
  peppercorn: ing("peppercorn", "Peppercorns", 130),
  olive: ing("olive", "Green olives", 160),
} satisfies Record<string, Ingredient>;

export type IngredientKey = keyof typeof ingredients;

/**
 * Loose ingredients lying on the cloth. `angle` is measured clockwise from the
 * first plate, `radius` from the centre of the table; plates sit every 45°, so
 * the half-steps fall in the gaps between them.
 */
export const loose: { key: IngredientKey; angle: number; radius: number; rotate: number; scale?: number }[] = [
  { key: "chili", angle: 22.5, radius: 478, rotate: 118 },
  { key: "lemon", angle: 67.5, radius: 492, rotate: 0, scale: 0.9 },
  { key: "basil", angle: 112.5, radius: 470, rotate: 205, scale: 0.85 },
  { key: "tomato", angle: 157.5, radius: 486, rotate: 70, scale: 0.9 },
  { key: "rosemary", angle: 202.5, radius: 470, rotate: 150 },
  { key: "orange", angle: 247.5, radius: 492, rotate: 30, scale: 0.92 },
  { key: "mint", angle: 292.5, radius: 474, rotate: 300, scale: 0.9 },
  { key: "walnut", angle: 337.5, radius: 486, rotate: 15, scale: 0.9 },
  { key: "peppercorn", angle: 4, radius: 372, rotate: 40, scale: 0.9 },
  { key: "olive", angle: 96, radius: 366, rotate: 190, scale: 0.8 },
  { key: "pomegranate", angle: 181, radius: 370, rotate: 80, scale: 0.9 },
  { key: "raspberry", angle: 270, radius: 368, rotate: 250, scale: 0.8 },
];

/* ------------------------------------------------------------------ */
/* Dishes                                                              */
/* ------------------------------------------------------------------ */

export type Dish = {
  id: string;
  /** plate shot from exactly above, cropped square so the rim touches all four edges */
  image: string;
  course: string;
  /** two lines; the second is set in italics in the accent colour */
  name: [string, string];
  line: string;
  /** euros */
  price: number;
  /** laid over the neutral linen with mix-blend-mode: multiply */
  tint: string;
  /** the dark floor around the table */
  floor: string;
  accent: string;
  /** fly out of the plate when the dish is opened */
  ingredients: [IngredientKey, IngredientKey, IngredientKey, IngredientKey];
  onPlate: [string, string, string, string];
  allergens: string;
  wine: string;
};

export const dishes: Dish[] = [
  {
    id: "burrata",
    image: "/img/dishes/burrata.webp",
    course: "To start",
    name: ["Burrata,", "heirloom tomato"],
    line: "A whole burrata, opened at the table, over late tomatoes from three farms and a green basil oil.",
    price: 16,
    tint: "#ecdccb",
    floor: "#2a1411",
    accent: "#f0714f",
    ingredients: ["tomato", "basil", "olive", "peppercorn"],
    onPlate: ["Burrata from Puglia", "Heirloom & vine tomatoes", "Basil oil", "Sea salt, cracked pepper"],
    allergens: "Milk",
    wine: "Alvarinho, Monção e Melgaço",
  },
  {
    id: "octopus",
    image: "/img/dishes/octopus.webp",
    course: "To start",
    name: ["Charred", "octopus"],
    line: "Braised until it gives, then blistered over coals, on smoked red pepper and crushed potatoes.",
    price: 21,
    tint: "#e2dedb",
    floor: "#1a1d27",
    accent: "#f58549",
    ingredients: ["chili", "garlic", "olive", "rosemary"],
    onPlate: ["Atlantic octopus", "Smoked red pepper purée", "Crushed new potatoes", "Capers, paprika oil"],
    allergens: "Molluscs",
    wine: "Encruzado, Dão",
  },
  {
    id: "risotto",
    image: "/img/dishes/risotto.webp",
    course: "From the pan",
    name: ["Saffron", "risotto"],
    line: "Carnaroli cooked to order in saffron stock, finished with four prawns straight off the grill.",
    price: 24,
    tint: "#eee1b6",
    floor: "#2a2109",
    accent: "#f6b62f",
    ingredients: ["garlic", "parsley", "chili", "lemon"],
    onPlate: ["Aged carnaroli rice", "Saffron & shellfish stock", "Four grilled prawns", "Chives, olive oil"],
    allergens: "Crustaceans, milk",
    wine: "Arinto, Bucelas",
  },
  {
    id: "beetroot",
    image: "/img/dishes/beetroot.webp",
    course: "From the garden",
    name: ["Beetroot", "carpaccio"],
    line: "Three beetroots shaved paper-thin, with whipped goat’s cheese, walnuts and a thread of honey.",
    price: 14,
    tint: "#eccfdb",
    floor: "#2b0f23",
    accent: "#ef5f98",
    ingredients: ["walnut", "basil", "orange", "peppercorn"],
    onPlate: ["Red, candy & golden beetroot", "Whipped goat’s cheese", "Toasted walnuts", "Honey, basil"],
    allergens: "Milk, tree nuts",
    wine: "Rosé of Touriga Nacional, Douro",
  },
  {
    id: "aubergine",
    image: "/img/dishes/aubergine.webp",
    course: "From the garden",
    name: ["Grilled", "aubergine"],
    line: "Scored and grilled until it collapses, over tahini yoghurt with pomegranate and mint.",
    price: 17,
    tint: "#dcd4ea",
    floor: "#1c1530",
    accent: "#b693f0",
    ingredients: ["pomegranate", "mint", "garlic", "lemon"],
    onPlate: ["Whole grilled aubergine", "Tahini yoghurt", "Pomegranate, pine nuts", "Mint, sumac"],
    allergens: "Milk, sesame, pine nuts",
    wine: "Castelão, Península de Setúbal",
  },
  {
    id: "seabass",
    image: "/img/dishes/seabass.webp",
    course: "From the grill",
    name: ["Whole", "sea bass"],
    line: "Grilled on the bone and carried out whole, with saffron butter, charred lemon and wilted greens.",
    price: 29,
    tint: "#d2e3df",
    floor: "#0d2428",
    accent: "#5fd0c2",
    ingredients: ["lemon", "rosemary", "tomato", "olive"],
    onPlate: ["Line-caught sea bass", "Saffron butter", "Charred lemon, blistered tomatoes", "Wilted greens, capers"],
    allergens: "Fish, milk",
    wine: "Loureiro, Vinho Verde",
  },
  {
    id: "lamb",
    image: "/img/dishes/lamb.webp",
    course: "From the grill",
    name: ["Lamb", "cutlets"],
    line: "Three cutlets served pink, with grilled asparagus, pea and mint purée and a red wine jus.",
    price: 32,
    tint: "#dde5cf",
    floor: "#172314",
    accent: "#a9d46b",
    ingredients: ["rosemary", "garlic", "mint", "peppercorn"],
    onPlate: ["Alentejo lamb cutlets", "Grilled asparagus", "Pea & mint purée", "Red wine jus, rosemary"],
    allergens: "Sulphites",
    wine: "Touriga Nacional, Douro",
  },
  {
    id: "tart",
    image: "/img/dishes/tart.webp",
    course: "To finish",
    name: ["Lemon", "tart"],
    line: "Sharp lemon curd in brown-butter pastry, under torched meringue and raspberries.",
    price: 11,
    tint: "#efe9b9",
    floor: "#232508",
    accent: "#f4dc4d",
    ingredients: ["lemon", "raspberry", "mint", "orange"],
    onPlate: ["Lemon curd", "Brown-butter pastry", "Torched meringue", "Raspberries, mint"],
    allergens: "Gluten, eggs, milk",
    wine: "Moscatel de Setúbal",
  },
];

/** Where the four ingredients of an opened dish settle, relative to the plate (table units). */
export const burstSpots: { x: number; y: number; rotate: number }[] = [
  { x: 186, y: -350, rotate: -14 },
  { x: 372, y: 150, rotate: 22 },
  { x: -236, y: 322, rotate: -32 },
  { x: -356, y: -176, rotate: 10 },
];

export const visit = {
  street: "Largo da Mesa 12",
  city: "1100-000 Lisboa",
  email: "mesa@tavola.example",
  hours: [
    ["Tuesday – Thursday", "19:00 – 23:00"],
    ["Friday & Saturday", "12:30 – 15:00 · 19:00 – 00:00"],
    ["Sunday", "12:30 – 16:00"],
    ["Monday", "Closed"],
  ] as [string, string][],
};

/** Prefix for static files, so the same build can be served from a sub-path. */
const BASE = process.env.NEXT_PUBLIC_BASE_PATH ?? "";
export const asset = (path: string) => `${BASE}${path}`;
