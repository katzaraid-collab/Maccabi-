import type { Kit } from "./types";

// Colors sampled from the 26/27 PUMA packshots.
export const KIT_THEME: Record<Kit, { label: string; bg: string; shirt: string; trim: string; ink: string; accent: string }> = {
  home: { label: "בית", bg: "#f9d716", shirt: "#f6c700", trim: "#1d4fb8", ink: "#0a1f7a", accent: "#000e62" },
  away: { label: "חוץ", bg: "#dbe5f6", shirt: "#173f97", trim: "#4f8be6", ink: "#f4e6b8", accent: "#0145b2" },
  third: { label: "שלישית", bg: "#f3efe1", shirt: "#fbfaf4", trim: "#ecc94b", ink: "#0f1d55", accent: "#b8901a" },
  fourth: { label: "רביעית", bg: "#e3e5ea", shirt: "#c9ccd3", trim: "#f1d96a", ink: "#0f1d55", accent: "#3b4258" },
  keeper: { label: "שוער", bg: "#e4f1fb", shirt: "#7cc3ef", trim: "#0a2a6b", ink: "#0a2a6b", accent: "#0a2a6b" },
};
