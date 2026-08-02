import express from 'express';
import cors from 'cors';
import Stripe from 'stripe';
import dotenv from 'dotenv';

// Load environment variables from .env.local
dotenv.config({ path: '.env.local' });

const app = express();
app.use(cors());
app.use(express.json());

// Use the provided key or fallback to a standard Stripe test secret key
const stripeSecretKey = process.env.STRIPE_SECRET_KEY;
const stripe = new Stripe(stripeSecretKey, {
  apiVersion: '2023-10-16',
});

app.post('/api/create-payment-intent', async (req, res) => {
  try {
    const { amount, currency = 'myr' } = req.body;

    if (!amount) {
      return res.status(400).json({ error: 'amount is required' });
    }

    const paymentIntent = await stripe.paymentIntents.create({
      amount: Math.round(amount * 100), // Stripe expects amounts in smallest currency unit (cents/sen)
      currency,
      automatic_payment_methods: {
        enabled: true,
      },
    });

    res.json({ clientSecret: paymentIntent.client_secret });
  } catch (error) {
    console.error("Stripe API Error:", error);
    res.status(400).json({ error: error.message });
  }
});

const PORT = process.env.PORT || 3001;
app.listen(PORT, () => {
  console.log(`Stripe Backend Server running on port ${PORT}`);
});
