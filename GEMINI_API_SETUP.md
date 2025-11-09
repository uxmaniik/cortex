# Gemini API Key Setup Guide

The Gemini API key is stored in **Supabase Secrets** for secure access.

## Steps to Get Your Gemini API Key

1. **Go to Google AI Studio**
   - Visit: https://aistudio.google.com/apikey

2. **Sign in with your Google Account**

3. **Create a new API key**
   - Click "Create API Key"
   - Select or create a Google Cloud project
   - Copy the generated API key

## Storing the API Key in Supabase Secrets

The API key is stored in Supabase Secrets, which is the most secure way to handle sensitive keys.

### How It Works

1. **Supabase Edge Function**: The transcription is handled by a Supabase Edge Function (`transcribe`)
2. **Secrets Access**: The Edge Function automatically has access to secrets stored in your Supabase project
3. **Secure**: The API key never leaves Supabase's secure environment

### Setting the Secret in Supabase

The secret should already be set in your Supabase project as:
- **Secret Name**: `GEMINI_API_KEY`
- **Value**: Your Gemini API key

If you need to update it:

1. Go to your Supabase Dashboard
2. Navigate to **Project Settings** → **Edge Functions** → **Secrets**
3. Add or update the secret:
   - **Name**: `GEMINI_API_KEY`
   - **Value**: Your Gemini API key
4. The Edge Function will automatically have access to it

## Architecture

```
Next.js App → API Route (/api/transcribe) → Supabase Edge Function → Gemini API
                                                      ↑
                                              (Uses GEMINI_API_KEY secret)
```

## Security Notes

- ✅ **DO**: Store the API key in Supabase Secrets (already done)
- ✅ **DO**: The key is never exposed to the client
- ✅ **DO**: Edge Functions have secure access to secrets
- ❌ **DON'T**: Store the API key in client-side code
- ❌ **DON'T**: Hardcode the API key anywhere

## Verifying the Setup

1. The Edge Function is already deployed
2. The secret `GEMINI_API_KEY` should be set in Supabase
3. Try generating a transcript for a voice note
4. If it works, you're all set!

## Troubleshooting

- **Error: "Gemini API key not configured in Supabase secrets"**
  - Make sure `GEMINI_API_KEY` is set in Supabase Project Settings → Edge Functions → Secrets
  - The secret name must be exactly `GEMINI_API_KEY`

- **Error: "Failed to transcribe audio"**
  - Check that your API key is valid
  - Verify you have quota/credits in your Google Cloud project
  - Make sure the audio file is accessible

## Current File Structure

```
supabase/functions/transcribe/index.ts  ← Edge Function (uses secret)
src/app/api/transcribe/route.ts          ← Next.js API route (calls Edge Function)
```

The API key is only used server-side in the API route, never exposed to the client.
