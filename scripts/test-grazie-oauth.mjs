const url = "https://oauth.account.jetbrains.com/oauth2/token";
console.log("Probing JetBrains OAuth at:", url);

try {
  const res = await fetch(url, {
    method: "POST",
    headers: {
      "Content-Type": "application/x-www-form-urlencoded",
      Accept: "application/json",
    },
    body: new URLSearchParams({
      client_id: "junie-cli",
      grant_type: "authorization_code",
      code: "invalid_test_code",
      redirect_uri: "http://127.0.0.1:62345/auth/callback",
    }),
  });
  console.log("Status:", res.status, res.statusText);
  const text = await res.text();
  console.log("Body:", text || "(empty)");
} catch (err) {
  console.error("Fetch failed:", err.message);
}
