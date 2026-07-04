// ============================================================
// NexCart — App Configuration Data
// Contains: Banner slides, Interest categories, Sidebar tabs
// ============================================================

// ── Hero Banner / Carousel Slides ───────────────────────────

const BANNER_SLIDES = [
  {
    image: "hero_banner_fashion.png",
    tag: "Exclusive Launch",
    title: "Vapor Summer Wear",
    desc: "Up to 40% off premium shirts and silk apparel",
    color: "#8a85f2",
    category: "Fashion"
  },
  {
    image: "hero_banner_tech.png",
    tag: "Next-Gen Audio",
    title: "SonicX Audio Tech",
    desc: "Experience high-fidelity wireless music starting ₹2,499",
    color: "#83a5f5",
    category: "Gadgets"
  }
];

// ── Interest / Personalisation Categories ───────────────────
const INTEREST_CATEGORIES = [
  { id: "int-home",    label: "Home Appliances",   icon: "home" },
  { id: "int-gadgets", label: "Gadgets",            icon: "smartphone" },
  { id: "int-fashion", label: "Fashion",            icon: "shirt" },
  { id: "int-kitchen", label: "Kitchen Appliances", icon: "utensils" },
  { id: "int-toys",    label: "Toys",               icon: "gamepad-2" },
  { id: "int-diecast", label: "Diecast Miniatures", icon: "truck" }
];

// ── Sidebar / Category Navigator Tabs ───────────────────────
const CATEGORY_TABS = [
  { id: "Fashion",     label: "Fashion",     icon: "shirt" },
  { id: "Mobiles",     label: "Mobiles",     icon: "smartphone" },
  { id: "Appliances",  label: "Appliances",  icon: "home" },
  { id: "Electronics", label: "Electronics", icon: "laptop" },
  { id: "Gadgets",     label: "Gadgets",     icon: "headphones" },
  { id: "Toys",        label: "Toys",        icon: "gamepad-2" },
  { id: "Sports",      label: "Sports",      icon: "bike" },
  { id: "Furniture",   label: "Furniture",   icon: "armchair" },
  { id: "Books",       label: "Books",       icon: "book-open" }
];
