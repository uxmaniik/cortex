# Supabase Email Template Setup Guide

## Fix Email Confirmation Redirect URL

### Step 1: Configure Site URL in Supabase

1. Go to your Supabase Dashboard: https://supabase.com/dashboard
2. Select your **Cortex** project
3. Navigate to **Authentication** → **URL Configuration**
4. Set the following:

   **Site URL:**
   ```
   https://cortex-psi.vercel.app
   ```

   **Redirect URLs:**
   Add these URLs (one per line):
   ```
   https://cortex-psi.vercel.app/**
   https://cortex-psi.vercel.app/auth/callback
   http://localhost:3000/**
   http://localhost:3000/auth/callback
   ```

5. Click **Save**

### Step 2: Set Environment Variable in Vercel

1. Go to your Vercel project dashboard
2. Navigate to **Settings** → **Environment Variables**
3. Add a new variable:
   - **Key**: `NEXT_PUBLIC_SITE_URL`
   - **Value**: `https://cortex-psi.vercel.app`
   - **Environment**: Production, Preview, Development
4. Click **Save**
5. **Redeploy** your application for the changes to take effect

## Custom Email Templates

Supabase allows you to customize email templates for:
- Email confirmation
- Password reset
- Magic link
- Email change

### Step 1: Access Email Templates

1. Go to Supabase Dashboard
2. Navigate to **Authentication** → **Email Templates**
3. Select the template you want to customize (e.g., "Confirm signup")

### Step 2: Custom Email Template for Signup Confirmation

Here's a professional email template you can use:

**Subject:**
```
Confirm your Cortex account
```

**Body (HTML):**
```html
<!DOCTYPE html>
<html>
<head>
  <meta charset="utf-8">
  <meta name="viewport" content="width=device-width, initial-scale=1.0">
  <title>Confirm your Cortex account</title>
</head>
<body style="margin: 0; padding: 0; font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, 'Helvetica Neue', Arial, sans-serif; background-color: #f5f5f5;">
  <table role="presentation" style="width: 100%; border-collapse: collapse;">
    <tr>
      <td style="padding: 40px 20px; text-align: center;">
        <table role="presentation" style="max-width: 600px; margin: 0 auto; background-color: #ffffff; border-radius: 8px; box-shadow: 0 2px 4px rgba(0,0,0,0.1);">
          <!-- Header -->
          <tr>
            <td style="padding: 40px 40px 20px; text-align: center; background: linear-gradient(135deg, #667eea 0%, #764ba2 100%); border-radius: 8px 8px 0 0;">
              <h1 style="margin: 0; color: #ffffff; font-size: 28px; font-weight: 600;">Cortex</h1>
              <p style="margin: 8px 0 0; color: rgba(255,255,255,0.9); font-size: 14px;">Voice Notes App</p>
            </td>
          </tr>
          
          <!-- Content -->
          <tr>
            <td style="padding: 40px;">
              <h2 style="margin: 0 0 20px; color: #1a1a1a; font-size: 24px; font-weight: 600;">Confirm your email address</h2>
              <p style="margin: 0 0 20px; color: #666666; font-size: 16px; line-height: 1.6;">
                Thank you for signing up for Cortex! To complete your registration and start capturing your voice notes, please confirm your email address by clicking the button below.
              </p>
              
              <!-- CTA Button -->
              <table role="presentation" style="width: 100%; margin: 30px 0;">
                <tr>
                  <td style="text-align: center;">
                    <a href="{{ .ConfirmationURL }}" style="display: inline-block; padding: 14px 32px; background: linear-gradient(135deg, #667eea 0%, #764ba2 100%); color: #ffffff; text-decoration: none; border-radius: 6px; font-weight: 600; font-size: 16px; box-shadow: 0 4px 6px rgba(102, 126, 234, 0.3);">
                      Confirm Email Address
                    </a>
                  </td>
                </tr>
              </table>
              
              <p style="margin: 20px 0 0; color: #999999; font-size: 14px; line-height: 1.6;">
                If the button doesn't work, copy and paste this link into your browser:
              </p>
              <p style="margin: 10px 0 0; color: #667eea; font-size: 12px; word-break: break-all;">
                {{ .ConfirmationURL }}
              </p>
            </td>
          </tr>
          
          <!-- Footer -->
          <tr>
            <td style="padding: 30px 40px; background-color: #f9f9f9; border-radius: 0 0 8px 8px; border-top: 1px solid #eeeeee;">
              <p style="margin: 0 0 10px; color: #999999; font-size: 12px; text-align: center;">
                This email was sent to confirm your Cortex account. If you didn't create an account, you can safely ignore this email.
              </p>
              <p style="margin: 10px 0 0; color: #999999; font-size: 12px; text-align: center;">
                © 2025 Cortex. All rights reserved.
              </p>
            </td>
          </tr>
        </table>
        
        <!-- Bottom Spacing -->
        <p style="margin: 30px 0 0; color: #999999; font-size: 12px; text-align: center;">
          Need help? Contact us at support@cortex.app
        </p>
      </td>
    </tr>
  </table>
</body>
</html>
```

**Body (Plain Text):**
```
Confirm your Cortex account

Thank you for signing up for Cortex! To complete your registration and start capturing your voice notes, please confirm your email address by clicking the link below:

{{ .ConfirmationURL }}

If you didn't create an account, you can safely ignore this email.

© 2025 Cortex. All rights reserved.
```

### Step 3: Available Template Variables

Supabase provides these variables you can use in templates:

- `{{ .ConfirmationURL }}` - The confirmation link
- `{{ .Token }}` - The confirmation token
- `{{ .TokenHash }}` - The hashed token
- `{{ .SiteURL }}` - Your site URL
- `{{ .Email }}` - User's email address
- `{{ .RedirectTo }}` - Redirect URL after confirmation

### Step 4: Test Your Email Template

1. After saving your template, test it by:
   - Signing up with a test email
   - Checking your email inbox
   - Verifying the email looks professional
   - Clicking the confirmation link
   - Ensuring it redirects to your production URL

## Additional Email Templates

You can also customize:

### Password Reset Email
- Navigate to **Authentication** → **Email Templates** → **Reset password**
- Use similar styling to the confirmation email
- Include security messaging

### Magic Link Email
- Navigate to **Authentication** → **Email Templates** → **Magic Link**
- Keep it simple and clear

## Tips for Professional Emails

1. **Brand Consistency**: Use your app's colors and branding
2. **Clear CTA**: Make the confirmation button prominent
3. **Mobile Responsive**: Test on mobile devices
4. **Security Messaging**: Include information about ignoring if not requested
5. **Support Contact**: Provide a way for users to get help

## Troubleshooting

### Email not sending?
- Check Supabase project settings
- Verify SMTP configuration (if using custom SMTP)
- Check spam folder

### Redirect not working?
- Verify Site URL is set correctly
- Check Redirect URLs include your domain
- Ensure `NEXT_PUBLIC_SITE_URL` environment variable is set
- Clear browser cache and try again

### Template not updating?
- Clear Supabase cache
- Wait a few minutes for changes to propagate
- Test with a new signup

