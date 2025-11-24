<div align="center">
<img width="1200" height="475" alt="GHBanner" src="https://github.com/user-attachments/assets/0aa67016-6eaf-458a-adb2-6e31a0763ed6" />
</div>

# Run and deploy your AI Studio app

This contains everything you need to run your app locally.

View your app in AI Studio: https://ai.studio/apps/drive/1r_u2t3377Y07zE0vw-MXypbz04eD818F

## Run Locally

**Prerequisites:**  Node.js


1. Install dependencies:
   `npm install`
2. Set the `GEMINI_API_KEY` in [.env.local](.env.local) to your Gemini API key
3. Run the app:
   `npm run dev`

## Deployment (Cloudflare Pages)

To deploy this project on Cloudflare Pages:

1.  **Connect Git**: Link your GitHub repository to Cloudflare Pages.
2.  **Build Settings**: You **MUST** manually configure the following settings in the Cloudflare Dashboard (Settings -> Builds & deployments):
    *   **Framework preset**: `Vite` (or `None`)
    *   **Build command**: `npm run build`
    *   **Build output directory**: `dist`
3.  **Environment Variables**: (Optional) Set `NODE_VERSION` to `20` if needed.

> **Note**: Cloudflare Pages Git integration does not automatically read the build command from `wrangler.toml`. You must set it in the dashboard.
