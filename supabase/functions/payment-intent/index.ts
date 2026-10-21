import { serve } from "https://deno.land/std@0.168.0/http/server.ts"
import Stripe from 'https://esm.sh/stripe@11.1.0?target=deno'
import { createClient } from 'https://esm.sh/@supabase/supabase-js@2'

const stripe = new Stripe(Deno.env.get('STRIPE_SECRET_KEY') ?? '', {
  apiVersion: '2022-11-15',
  httpClient: Stripe.createFetchHttpClient(),
})

// Roles allowed to collect payment (mirrors COLLECT_PAYMENT in src/lib/rbacPermissionEngine.ts).
const PAYMENT_ROLES = ['doctor', 'pharmacist', 'clinic-assistant', 'admin']
// Sanity bounds in MYR. Stripe's own minimum for MYR is 2.00.
const MIN_AMOUNT = 2
const MAX_AMOUNT = 50000

// Comma-separated list of origins allowed to call this function, e.g. "https://app.example.com".
const allowedOrigins = (Deno.env.get('ALLOWED_ORIGIN') ?? '').split(',').map((o) => o.trim()).filter(Boolean)

function corsHeadersFor(req: Request) {
  const origin = req.headers.get('Origin') ?? ''
  const headers: Record<string, string> = {
    'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
    'Access-Control-Allow-Methods': 'POST, OPTIONS',
    'Vary': 'Origin',
  }
  if (allowedOrigins.includes(origin)) headers['Access-Control-Allow-Origin'] = origin
  return headers
}

serve(async (req) => {
  const cors = corsHeadersFor(req)
  const json = (body: unknown, status: number) =>
    new Response(JSON.stringify(body), { headers: { ...cors, 'Content-Type': 'application/json' }, status })

  if (req.method === 'OPTIONS') {
    return new Response('ok', { headers: cors })
  }
  if (req.method !== 'POST') return json({ error: 'Method not allowed' }, 405)

  try {
    // 1. Authenticate: the caller must hold a valid Supabase session.
    const authHeader = req.headers.get('Authorization')
    if (!authHeader) return json({ error: 'Unauthorized' }, 401)

    const supabase = createClient(
      Deno.env.get('SUPABASE_URL')!,
      Deno.env.get('SUPABASE_ANON_KEY')!,
      { global: { headers: { Authorization: authHeader } } },
    )
    const { data: { user }, error: userError } = await supabase.auth.getUser()
    if (userError || !user) return json({ error: 'Unauthorized' }, 401)

    // 2. Authorize: role comes from profiles (RLS lets a user read only their own row).
    const { data: profile } = await supabase.from('profiles').select('role').eq('id', user.id).single()
    if (!profile || !PAYMENT_ROLES.includes(profile.role)) return json({ error: 'Forbidden' }, 403)

    // 3. Validate input.
    const { amount, currency = 'myr', invoiceId } = await req.json()
    if (typeof amount !== 'number' || !Number.isFinite(amount) || amount < MIN_AMOUNT || amount > MAX_AMOUNT) {
      return json({ error: `amount must be a number between ${MIN_AMOUNT} and ${MAX_AMOUNT}` }, 400)
    }
    if (currency !== 'myr') return json({ error: 'Unsupported currency' }, 400)

    const paymentIntent = await stripe.paymentIntents.create({
      amount: Math.round(amount * 100), // Stripe expects amounts in cents
      currency,
      automatic_payment_methods: { enabled: true },
      metadata: {
        invoice_id: typeof invoiceId === 'string' ? invoiceId.slice(0, 100) : '',
        created_by: user.id,
      },
    })

    return json({ clientSecret: paymentIntent.client_secret }, 200)
  } catch (error) {
    console.error('payment-intent error:', error)
    return json({ error: 'Unable to create payment' }, 400)
  }
})
