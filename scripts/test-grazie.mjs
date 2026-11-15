const url = "https://ingrazzio-cloud-prod.labs.jb.gg/auth/test";
console.log("Probing Grazie backend at:", url);

try {
  const res = await fetch(url, {
    headers: {
      "Grazie-Agent": JSON.stringify({ name: "junie:cli", version: "3013.7" }),
      "Accept-Encoding": "identity",
    },
  });
  console.log("Status:", res.status, res.statusText);
  const text = await res.text();
  console.log("Body:", text || "(empty)");
} catch (err) {
  console.error("Fetch failed:", err.message);
}
