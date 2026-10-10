// Vercel serverless function. This endpoint validates links and optionally
// forwards them to a third-party provider that you are authorized to use.
// Configure VIDEO_API_URL and VIDEO_API_KEY in Vercel Project Settings > Environment Variables.
// Provider request/response formats differ; adapt the marked section to your provider's docs.

const allowedHosts = {
  tiktok: host => host === "tiktok.com" || host.endsWith(".tiktok.com"),
  instagram: host => host === "instagram.com" || host.endsWith(".instagram.com")
};

function json(res, status, body) {
  res.status(status).setHeader("Content-Type", "application/json; charset=utf-8");
  res.setHeader("Cache-Control", "no-store");
  return res.json(body);
}

module.exports = async (req, res) => {
  res.setHeader("Access-Control-Allow-Origin", "*");
  res.setHeader("Access-Control-Allow-Methods", "POST, OPTIONS");
  res.setHeader("Access-Control-Allow-Headers", "Content-Type");
  if (req.method === "OPTIONS") return res.status(204).end();
  if (req.method !== "POST") return json(res, 405, { error: "Use POST for this endpoint." });

  const body = req.body || {};
  const rawUrl = typeof body.url === "string" ? body.url.trim() : "";
  let parsed;
  try { parsed = new URL(rawUrl); } catch { return json(res, 400, { error: "Please provide a valid video URL." }); }

  if (!["https:", "http:"].includes(parsed.protocol)) {
    return json(res, 400, { error: "Only HTTP or HTTPS URLs are supported." });
  }

  const host = parsed.hostname.toLowerCase().replace(/\.$/, "");
  const platform = allowedHosts.tiktok(host) ? "tiktok" : allowedHosts.instagram(host) ? "instagram" : null;
  if (!platform) return json(res, 400, { error: "Only TikTok and Instagram links are supported." });
  if (body.platform && body.platform !== platform) {
    return json(res, 400, { error: "The selected platform does not match this URL." });
  }

  // Without a compatible, authorized provider, the site can validate links but
  // cannot fetch the actual video. Never scrape private content or bypass access controls.
  const apiUrl = process.env.VIDEO_API_URL;
  const apiKey = process.env.VIDEO_API_KEY;
  if (!apiUrl || !apiKey) {
    return json(res, 200, {
      platform,
      message: "Link recognized successfully. To enable downloads, configure a compatible provider API in Vercel environment variables. This deployment is currently in UI/validation mode."
    });
  }

  // IMPORTANT: adapt this request and the response parser to the provider's official docs.
  // Use only a provider you trust and are permitted to use.
  try {
    const providerResponse = await fetch(apiUrl, {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        "Authorization": `Bearer ${apiKey}`
      },
      body: JSON.stringify({ url: parsed.toString(), platform })
    });

    const result = await providerResponse.json().catch(() => ({}));
    if (!providerResponse.ok) {
      return json(res, 502, { error: "The configured video provider rejected the request. Check its API documentation and credentials." });
    }

    // Expected generic provider shape: { "downloadUrl": "https://..." }
    const downloadUrl = typeof result.downloadUrl === "string" ? result.downloadUrl : null;
    if (!downloadUrl) {
      return json(res, 502, { error: "Provider response did not contain downloadUrl. Update the response parser to match your provider." });
    }

    let safeDownloadUrl;
    try { safeDownloadUrl = new URL(downloadUrl); } catch {
      return json(res, 502, { error: "Provider returned an invalid download URL." });
    }
    if (safeDownloadUrl.protocol !== "https:") {
      return json(res, 502, { error: "Provider download links must use HTTPS." });
    }
    return json(res, 200, { platform, downloadUrl: safeDownloadUrl.toString() });
  } catch {
    return json(res, 502, { error: "Could not reach the configured provider. Check the provider URL and try again." });
  }
};
