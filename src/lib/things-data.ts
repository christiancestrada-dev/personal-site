export type ThingStatus = "own" | "wishlist" | "digital";

export interface ThingItem {
  title: string;
  brand?: string;
  description: string;
  category: string;
  status: ThingStatus;
  url: string;
  image?: string;
  price?: string;
  tags?: string[];
  addedAt?: string;
}

export const DEFAULT_SUBTITLE = "With a high bar for build quality, aesthetic, and usability. Here are some of the goods that I own or researched or want.";

export const DEFAULT_CATEGORIES = ["Tech", "Gadgets", "Toys", "Aesthetics"];

export const THINGS: ThingItem[] = [
  {
    title: "Pocket Operator PO-33 K.O!",
    brand: "Teenage Engineering",
    description: "A tiny sampler that fits in your pocket. I use it to chop up field recordings and make beats on the go.",
    category: "Gadgets",
    status: "own",
    url: "#",
    image: "/things/placeholder.svg",
    price: "$89",
    tags: ["music", "portable"],
    addedAt: "2026-03-28",
  },
  {
    title: "Jellycat Bashful Bunny",
    brand: "Jellycat",
    description: "The softest plush you'll ever hold. Sits on my desk and keeps morale high.",
    category: "Toys",
    status: "own",
    url: "#",
    image: "/things/placeholder.svg",
    price: "$25",
    tags: ["plush", "desk"],
    addedAt: "2026-03-25",
  },
  {
    title: "Himitsu Bako Puzzle Box",
    brand: "Hakone",
    description: "Traditional Japanese puzzle box. 21 moves to open. Should I pull the trigger on this...",
    category: "Toys",
    status: "wishlist",
    url: "#",
    image: "/things/placeholder.svg",
    price: "$65",
    tags: ["wood", "puzzle"],
    addedAt: "2026-03-20",
  },
  {
    title: "Ceramic Incense Holder",
    brand: "Yuppiechef",
    description: "Minimal matte black ceramic tray. Makes any room feel intentional.",
    category: "Aesthetics",
    status: "own",
    url: "#",
    image: "/things/placeholder.svg",
    price: "$32",
    tags: ["ceramic", "home"],
    addedAt: "2026-03-15",
  },
  {
    title: "Dark Navy Color Palette",
    brand: undefined,
    description: "The exact color palette used on this site — exported as CSS variables, Tailwind config, and Figma tokens.",
    category: "Aesthetics",
    status: "digital",
    url: "#",
    price: "Free",
    tags: ["design", "colors", "css"],
    addedAt: "2026-03-10",
  },
  {
    title: "Flipper Zero",
    brand: "Flipper Devices",
    description: "A multi-tool for hardware tinkering. NFC, RFID, infrared, sub-GHz — endlessly fun to explore.",
    category: "Tech",
    status: "wishlist",
    url: "#",
    image: "/things/placeholder.svg",
    price: "$169",
    tags: ["hacking", "hardware"],
    addedAt: "2026-04-01",
  },
];
