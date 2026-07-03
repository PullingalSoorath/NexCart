// ============================================================
// NexCart — Product Catalog Index
// Combines all category files into one PRODUCT_CATALOG array.
// Each category file must be loaded BEFORE this file in index.html.
//
// Load order in index.html:
//   <script src="data/products/fashion.js"></script>
//   <script src="data/products/electronics.js"></script>
//   <script src="data/products/appliances.js"></script>
//   <script src="data/products/toys.js"></script>
//   <script src="data/products/others.js"></script>
//   <script src="data/products/index.js"></script>
// ============================================================

const PRODUCT_CATALOG = [
  ...FASHION_PRODUCTS,
  ...ELECTRONICS_PRODUCTS,
  ...APPLIANCES_PRODUCTS,
  ...TOYS_PRODUCTS,
  ...OTHERS_PRODUCTS
];

// ── Catalog Data Enrichment ──────────────────────────────────
// Runs after all products are merged. Fills in any missing
// fields that were not explicitly set in the category files.
PRODUCT_CATALOG.forEach(p => {
  // 1. Warranty fallback
  if (!p.warranty) {
    if (["Fashion", "Toys", "Books"].includes(p.category)) {
      p.warranty = "Brand Authenticity Guarantee";
    } else {
      p.warranty = "1 Year Brand Warranty";
    }
  }

  // 2. Image carousel — generate 3 slides from the base image
  if (!p.images) {
    p.images = [
      p.image,
      p.image + "&sig=" + p.id + "sec",
      p.image + "&sig=" + p.id + "thr"
    ];
  }

  // 3. Key highlights fallback by category
  if (!p.highlights) {
    if (p.category === "Fashion") {
      p.highlights = [
        "100% Organic long-staple cotton",
        "Highly breathable, shrink-resistant weave",
        "Tailored clean shoulders comfort fit",
        "Easy maintenance, machine-wash compatible"
      ];
    } else if (p.category === "Mobiles") {
      p.highlights = [
        "Cinematic triple optical camera setup with OIS",
        "120Hz LTPO Fluid Display with HDR10+",
        "Octa-core AI chipset (built on advanced 3nm process)",
        "Supports 15W MagSafe and fast wireless charging"
      ];
    } else if (p.category === "Appliances") {
      p.highlights = [
        "Digital inverter compressor saves up to 40% energy",
        "High-grade rust-resistant brushed steel shell",
        "Smart App connectivity with live diagnostics",
        "Double noise-reduction fan systems (ultra quiet)"
      ];
    } else if (p.category === "Electronics") {
      p.highlights = [
        "Multi-core processing allows high workloads",
        "Wide-gamut color-accurate display matrix",
        "Ultralight structural body weighs only 1.2 kg",
        "High-density battery delivers up to 10 hours active use"
      ];
    } else if (p.category === "Gadgets") {
      p.highlights = [
        "Hybrid Active Noise Cancellation (up to -35dB ANC)",
        "IPX4 water-resistant and splashproof certification",
        "Smart touch controls for track skipping and volume",
        "Immersive dual-channel stereo acoustics"
      ];
    } else {
      p.highlights = [
        "Designed from premium toxic-free components",
        "Double-reinforced base structure for durability",
        "Tested safe under international children standards",
        "Comes with a 10-step quick assembly guide"
      ];
    }
  }
});
