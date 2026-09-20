// Shared animation variants. Kept intentionally small: opacity + a short
// vertical shift only, per DESIGN.md ("primarily transform/opacity",
// "150–400ms typical interaction range", no decorative looping motion).

export const fadeUp = {
  hidden: { opacity: 0, y: 14 },
  visible: { opacity: 1, y: 0 },
};

export const fadeIn = {
  hidden: { opacity: 0 },
  visible: { opacity: 1 },
};
