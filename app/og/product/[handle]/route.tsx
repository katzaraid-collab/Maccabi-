import { getProduct } from "@/lib/catalog";
import { renderProductOg } from "@/lib/og";

// Product share image. A plain route instead of the opengraph-image file
// convention: Next re-encodes the (already encoded) Hebrew handle in the
// generated og:image URL, which doubled the escaping and broke previews.
export async function GET(_req: Request, { params }: { params: Promise<{ handle: string }> }) {
  const product = await getProduct((await params).handle);
  if (!product) return new Response("Not found", { status: 404 });
  return renderProductOg(product);
}
