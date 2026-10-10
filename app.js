const input = document.querySelector("#videoUrl");
const statusBox = document.querySelector("#status");
const submitBtn = document.querySelector("#submitBtn");

function setStatus(message, kind = "normal") {
  statusBox.textContent = message;
  statusBox.style.color = kind === "error" ? "#a32121" : kind === "success" ? "#245b3a" : "#777770";
}

function identifyPlatform(value) {
  let parsed;
  try { parsed = new URL(value.trim()); } catch { return null; }
  if (!["https:", "http:"].includes(parsed.protocol)) return null;
  const host = parsed.hostname.toLowerCase().replace(/\.$/, "");
  if (host === "tiktok.com" || host.endsWith(".tiktok.com")) return "tiktok";
  if (host === "instagram.com" || host.endsWith(".instagram.com")) return "instagram";
  return null;
}

document.querySelector("#pasteBtn").addEventListener("click", async () => {
  try {
    input.value = await navigator.clipboard.readText();
    setStatus("Link pasted. Tap Continue to check it.");
  } catch {
    input.focus();
    setStatus("Clipboard permission is unavailable. Paste your link into the field.");
  }
});

async function submitLink() {
  const url = input.value.trim();
  const platform = identifyPlatform(url);
  if (!url) return setStatus("Please paste a TikTok or Instagram link.", "error");
  if (!platform) return setStatus("That doesn't look like a supported TikTok or Instagram URL.", "error");

  submitBtn.disabled = true;
  submitBtn.querySelector("span").textContent = "Checking…";
  setStatus("Checking link with the backend…");

  try {
    const response = await fetch("/api/download", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ url, platform })
    });
    const data = await response.json().catch(() => ({}));
    if (!response.ok) throw new Error(data.error || "The service could not process this link.");
    if (data.downloadUrl) {
      const link = document.createElement("a");
      link.href = data.downloadUrl;
      link.target = "_blank";
      link.rel = "noopener noreferrer";
      link.textContent = "Open downloadable video";
      link.className = "result-link";
      statusBox.replaceChildren(document.createTextNode("Your provider returned a download link: "), link);
      statusBox.style.color = "#245b3a";
    } else {
      setStatus(data.message || "The link was recognized, but no download provider is configured yet.");
    }
  } catch (error) {
    setStatus(error.message || "Could not reach the backend. Please try again.", "error");
  } finally {
    submitBtn.disabled = false;
    submitBtn.querySelector("span").textContent = "Continue";
  }
}

submitBtn.addEventListener("click", submitLink);
input.addEventListener("keydown", event => { if (event.key === "Enter") submitLink(); });
