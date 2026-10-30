import { DEPARTMENTS, productsIn } from "@/lib/catalog";
import { AUDIENCES, DEPT_LATIN, DEPT_PHOTO, KITS, TYPES, techLabel, typeOf, type DeptPhoto } from "@/components/shop/taxonomy";
import { HeaderBar } from "./HeaderBar";

export type MenuLink = { label: string; href: string; count: number };
export type MenuCol = { title: string; links: MenuLink[] };
export type MenuProduct = { href: string; title: string; price: number; compareAt: number | null; image: string; label: string };
export type MenuDept = {
  slug: string;
  href: string;
  label: string;
  title: string;
  latin: string;
  kicker: string;
  count: number;
  hot?: boolean;
  cols: MenuCol[];
  photo: DeptPhoto | null;
  product: MenuProduct | null;
};

const NAV: { slug: string; label: string; hot?: boolean }[] = [
  { slug: "new", label: "26/27" },
  { slug: "kits", label: "תלבושות משחק" },
  { slug: "training", label: "אימון וייצוג" },
  { slug: "fashion", label: "אופנה ורטרו" },
  { slug: "kids", label: "ילדים" },
  { slug: "accessories", label: "אביזרים" },
  { slug: "sale", label: "SALE", hot: true },
];

// Server half of the header: builds the mega menu from the live catalog so
// every column link points at a filter that actually returns products.
export async function Header() {
  const depts: MenuDept[] = await Promise.all(
    NAV.map(async (n) => {
      const dept = DEPARTMENTS.find((d) => d.slug === n.slug)!;
      const list = await productsIn(n.slug);
      const live = list.filter((p) => p.available);
      const href = `/shop/${n.slug}`;
      const tally = (keys: { key: string; label: string }[], has: (k: string, p: (typeof list)[number]) => boolean, param: string) =>
        keys
          .map((k) => ({ label: k.label, href: `${href}?${param}=${k.key}`, count: live.filter((p) => has(k.key, p)).length }))
          .filter((l) => l.count > 0);

      const kits = tally(KITS, (k, p) => p.kit === k, "kit");
      const types = tally(TYPES, (k, p) => typeOf(p) === k, "type")
        .sort((a, b) => b.count - a.count)
        .slice(0, 7);
      const auds = tally(AUDIENCES, (k, p) => AUDIENCES.find((a) => a.key === k)!.test(p, ""), "aud");

      const cols: MenuCol[] = [];
      if (kits.length > 1) cols.push({ title: "ערכות", links: kits.map((l) => ({ ...l, label: `ערכת ${l.label}` })) });
      if (types.length > 1) cols.push({ title: "לפי סוג", links: types });
      if (auds.length > 1 && n.slug !== "kids") cols.push({ title: "למי", links: auds });

      const pick = live.find((p) => p.images.length && typeOf(p) === "shirts") ?? live.find((p) => p.images.length);
      return {
        slug: n.slug,
        href,
        label: n.label,
        title: dept.title,
        latin: DEPT_LATIN[n.slug] ?? "",
        kicker: dept.kicker,
        count: list.length,
        hot: n.hot,
        cols,
        photo: DEPT_PHOTO[n.slug] ?? null,
        product: pick
          ? { href: `/product/${pick.handle}`, title: pick.title, price: pick.price, compareAt: pick.compareAt, image: pick.images[0].src, label: techLabel(pick) }
          : null,
      };
    }),
  );

  return <HeaderBar depts={depts} />;
}
