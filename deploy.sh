#!/bin/bash

echo "Setting up environment variables for Vercel deployment..."

# Set placeholder environment variables to allow deployment
vercel env add NEXT_PUBLIC_SUPABASE_URL production <<< "https://placeholder.supabase.co"
vercel env add NEXT_PUBLIC_SUPABASE_ANON_KEY production <<< "placeholder_key"
vercel env add NEXT_PUBLIC_CLERK_PUBLISHABLE_KEY production <<< "pk_placeholder"
vercel env add CLERK_SECRET_KEY production <<< "sk_placeholder"
vercel env add CLERK_WEBHOOK_SECRET production <<< "whsec_placeholder"

echo "Environment variables set. Deploying..."
vercel --prod

echo "Deployment complete! Update environment variables in Vercel dashboard with real values."