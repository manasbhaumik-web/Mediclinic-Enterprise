# Mediclinic Enterprise

Enterprise Outpatient Medical Center Clinical Suite (EMR, Pharmacy, Cashier, Triage, and Multi-tenant Administration).

## Run Locally

**Prerequisites:** Node.js (v18+)

1. Install dependencies:
   ```bash
   npm install
   ```

2. Configure environment variables in `.env.local`:
   ```env
   VITE_SUPABASE_URL="https://your-project.supabase.co"
   VITE_SUPABASE_ANON_KEY="your-anon-key"
   ```

3. Run the development server:
   ```bash
   npm run dev
   ```

4. Run tests:
   ```bash
   npm test
   ```

## Production Deployment (Vercel)

When deploying to Vercel, ensure the following build-time environment variables are configured under **Project Settings → Environment Variables**:

| Variable | Description | Exposure |
| :--- | :--- | :--- |
| `VITE_SUPABASE_URL` | Live Supabase project URL | Public client bundle |
| `VITE_SUPABASE_ANON_KEY` | Public Supabase anonymous client JWT | Public client bundle |
| `VITE_STRIPE_PUBLISHABLE_KEY` | Stripe publishable key (optional) | Public client bundle |
| `APP_URL` | Production canonical URL | Server / Edge |

After setting the environment variables in Vercel, redeploy to inline the configuration into the client bundle.
