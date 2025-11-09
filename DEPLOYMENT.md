# Deployment Guide - Cortex Voice Notes App

## Quick Deploy to Vercel

Your code is now on GitHub at: https://github.com/uxmaniik/cortex.git

### Step 1: Deploy via Vercel Dashboard

1. **Go to Vercel Dashboard**
   - Visit [vercel.com](https://vercel.com)
   - Sign in with your GitHub account

2. **Import Project**
   - Click "Add New Project" or "Import Project"
   - Select your GitHub repository: `uxmaniik/cortex`
   - Vercel will auto-detect Next.js

3. **Configure Project**
   - **Project Name**: `cortex` (or your preferred name)
   - **Framework Preset**: Next.js (auto-detected)
   - **Root Directory**: `./` (default)
   - **Build Command**: `npm run build` (auto-detected)
   - **Output Directory**: `.next` (auto-detected)

4. **Add Environment Variables**
   Click "Environment Variables" and add:
   - `NEXT_PUBLIC_SUPABASE_URL` = Your Supabase project URL
   - `NEXT_PUBLIC_SUPABASE_ANON_KEY` = Your Supabase anonymous key

   You can find these in your Supabase dashboard:
   - Go to Project Settings → API
   - Copy the "Project URL" and "anon public" key

5. **Deploy**
   - Click "Deploy"
   - Wait for the build to complete (~2-3 minutes)
   - Your app will be live at `https://cortex-*.vercel.app`

### Step 2: Configure Custom Domain (Optional)

1. In Vercel dashboard, go to your project → Settings → Domains
2. Add your custom domain
3. Follow DNS configuration instructions

### Step 3: Verify Deployment

1. Visit your deployment URL
2. Test authentication (sign up/sign in)
3. Test voice recording
4. Verify all features work correctly

## Post-Deployment Checklist

- [ ] Environment variables are set correctly
- [ ] Supabase CORS is configured for your Vercel domain
- [ ] Storage bucket `voice-notes` exists and is private
- [ ] RLS policies are set up correctly
- [ ] Test authentication flow
- [ ] Test voice recording and playback
- [ ] Test all features (edit, delete, search, etc.)

## Troubleshooting

### Build Fails
- Check environment variables are set correctly
- Verify all dependencies are in `package.json`
- Check build logs in Vercel dashboard

### Authentication Issues
- Verify Supabase URL and keys are correct
- Check Supabase project is active
- Verify RLS policies allow authenticated users

### Audio Playback Issues
- Ensure storage bucket is configured correctly
- Check signed URL generation works
- Verify CORS settings in Supabase

## Environment Variables Reference

```env
# Required
NEXT_PUBLIC_SUPABASE_URL=https://your-project.supabase.co
NEXT_PUBLIC_SUPABASE_ANON_KEY=your-anon-key-here

# Optional (for transcription feature)
GEMINI_API_KEY=your-gemini-key (stored in Supabase secrets)
```

## Support

If you encounter issues:
1. Check Vercel deployment logs
2. Check Supabase logs
3. Review browser console for errors
4. Verify all environment variables are set

