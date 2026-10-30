import { getProduct } from "@/lib/catalog";
import { OG_ALT, OG_CONTENT_TYPE, OG_SIZE, renderProductOg } from "@/lib/og";

export const alt = OG_ALT;
export const size = OG_SIZE;
export const contentType = OG_CONTENT_TYPE;

export default async function Image({ params }: { params: Promise<{ handle: string }> }) {
  const product = await getProduct((await params).handle);
  if (!product) return new Response("Not found", { status: 404 });
  return renderProductOg(product);
}
