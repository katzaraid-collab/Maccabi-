import type { Kit, Product } from "@/lib/types";

export const KIT_EN: Record<Kit, string> = { home: "HOME", away: "AWAY", third: "THIRD", fourth: "FOURTH", keeper: "GK" };

export const seasonOf = (title: string) => title.match(/(?<!\d)\d{2}[./]\d{2}(?!\d)/)?.[0].replace(".", "/") ?? null;

// Small technical line above titles, e.g. "26/27 · HOME · PUMA".
export function techLabel(p: Product) {
  return [seasonOf(p.title), p.kit ? KIT_EN[p.kit] : null, /PUMA/i.test(p.title) ? "PUMA" : "MACCABI TEL AVIV"].filter(Boolean).join(" · ");
}
