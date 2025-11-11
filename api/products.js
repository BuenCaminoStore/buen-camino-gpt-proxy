// api/products.ts
import type { VercelRequest, VercelResponse } from '@vercel/node';

export default async function handler(req: VercelRequest, res: VercelResponse) {
  try {
    // ---- 1) Protect the endpoint with a single Bearer token ----
    const auth = req.headers.authorization || "";
    const expected = process.env.ACTION_KEY;
    if (!expected || !auth.startsWith("Bearer ") || auth.split(" ")[1] !== expected) {
      return res.status(401).json({ error: "Unauthorized" });
    }

    // ---- 2) Read WooCommerce credentials from environment ----
    const store = process.env.STORE_URL; // e.g. "https://buencamino.store"
    const ck = process.env.WC_CONSUMER_KEY;
    const cs = process.env.WC_CONSUMER_SECRET;

    if (!store || !ck || !cs) {
      return res.status(500).json({ error: "Server is not configured correctly" });
    }

    // ---- 3) Build WooCommerce request URL ----
    const url = new URL(`${store}/wp-json/wc/v3/products`);
    url.searchParams.set("per_page", req.query.per_page?.toString() || "20");
    if (req.query.search) url.searchParams.set("search", req.query.search.toString());
    url.searchParams.set("consumer_key", ck);
    url.searchParams.set("consumer_secret", cs);

    // ---- 4) Fetch data ----
    const response = await fetch(url.toString());
    const products = await response.json();

    // ---- 5) Return clean minimal product objects ----
    const cleaned = products.map((p: any) => ({
      id: p.id,
      name: p.name,
      price: p.price,
      url: p.permalink,
      image: p.images?.[0]?.src || null
    }));

    return res.status(200).json(cleaned);

  } catch (err: any) {
    return res.status(500).json({ error: "Proxy error", detail: String(err?.message || err) });
  }
}
