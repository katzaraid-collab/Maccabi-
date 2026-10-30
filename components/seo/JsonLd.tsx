import { jsonLdString } from "@/lib/seo";

/** Renders one schema.org object (or an array of them) as an inline JSON-LD script. */
export function JsonLd({ data }: { data: unknown }) {
  return <script type="application/ld+json" dangerouslySetInnerHTML={{ __html: jsonLdString(data) }} />;
}
