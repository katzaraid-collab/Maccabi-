import { organizationJsonLd, websiteJsonLd } from "@/lib/seo";
import { JsonLd } from "./JsonLd";

/** Site-wide Organization + WebSite (with sitelinks search box) structured data. Render once in the root layout. */
export function SiteJsonLd() {
  return <JsonLd data={[organizationJsonLd(), websiteJsonLd()]} />;
}
