import Stripe from 'stripe'

export const stripe = new Stripe(process.env.STRIPE_SECRET_KEY!)

export const PLATFORM_FEE_PERCENT = 7 // 7%
