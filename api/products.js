export default async function handler(req, res) {
  const ACTION_KEY = process.env.ACTION_KEY;   
  const CK = process.env.WC_CK;                
  const CS = process.env.WC_CS;                
  const WC_BASE = "https://buencamino.store";  

  // Check auth header from GPT Action
  const auth = (req.headers.authorization || "").replace(/^Bearer\s+/i, "");
  if (!auth || auth !== ACTION_KEY) return res.status(401).json({ error: "Unauthorized" });

  // Build WooCommerce URL
  const url = new URL(WC_BASE + "/wp-json/wc/v3/products");
  if (req.query.search) url.searchParams.set("search", req.query.search);
  url.searchParams.set("per_page", req.query.per_page || "20");
  url.searchParams.set("consumer_key", CK);
  url.searchParams.set("consumer_secret", CS);

  // Fetch products from WooCommerce
  const response = await fetch(url);
  const data = await response.json();

  // Clean minimal result
  const cleaned = data.map(p => ({
    id: p.id,
    name: p.name,
    price: p.price,
    url: p.permalink,
    image: p.images?.[0]?.src
  }));

  res.status(200).json(cleaned);
}
