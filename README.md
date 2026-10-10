# MONO — Video Link Tool

A mobile-first, monochrome TikTok/Instagram link tool with a Vercel serverless API endpoint.

## Important limitation

This repository includes the complete frontend, URL validation, and a working serverless backend scaffold. It does **not** automatically download TikTok/Instagram videos immediately after deployment. Actual downloads require a compatible, authorized provider/API and provider-specific request/response handling. TikTok and Instagram do not provide a universal public endpoint that downloads any arbitrary video URL. Do not use this tool to access private content, bypass access controls, or download content without permission.

## Deploy on Vercel via GitHub

1. Download and unzip this project.
2. Upload the **contents** of the unzipped `clipdrop-black-white` folder to a new GitHub repository (make sure `index.html`, `api/`, `app.js`, `style.css`, `vercel.json`, and `package.json` are at the repository root).
3. Open https://vercel.com/ and sign in.
4. Choose **Add New → Project**, import your GitHub repository, then press **Deploy**. No build command is needed for the static frontend and serverless API scaffold.
5. Open the generated Vercel domain. The UI and URL validation should work.

## Enable real downloads later

In Vercel, open **Project → Settings → Environment Variables** and add:
- `VIDEO_API_URL`: your authorized provider's API endpoint
- `VIDEO_API_KEY`: your private API key

Then adapt the request and response section in `api/download.js` to the provider's documented API format. The included generic adapter assumes a POST JSON request `{ "url": "...", "platform": "tiktok" }` and a JSON response `{ "downloadUrl": "https://..." }`. Many providers use different formats, so these assumptions must be updated to match the selected provider. Redeploy after changing variables.

Never place API secrets in `index.html` or `app.js`; frontend code is visible to everyone.

## Local preview

For a static visual preview, open `index.html` in a browser. The API request requires Vercel's local development environment. To test the full app locally, install Node.js and run `npm install -g vercel`, then run `vercel dev` from the project folder.

## Files

- `index.html` — mobile-first page structure
- `style.css` — monochrome styling and raised 3D/neumorphic icon treatment
- `app.js` — paste button, validation and API request
- `api/download.js` — Vercel serverless endpoint
- `vercel.json` — Vercel configuration
