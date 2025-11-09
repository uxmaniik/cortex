'use client'

import { useState } from 'react'
import { useAuth } from '@/lib/auth-context'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { Loader2, CheckCircle2, AlertCircle } from 'lucide-react'

export function AuthForm() {
  const [isSignUp, setIsSignUp] = useState(false)
  const [email, setEmail] = useState('')
  const [password, setPassword] = useState('')
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState<string | null>(null)
  const [success, setSuccess] = useState<string | null>(null)

  const { signUp, signIn } = useAuth()

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    setLoading(true)
    setError(null)
    setSuccess(null)

    try {
      const { error, data } = isSignUp
        ? await signUp(email, password)
        : await signIn(email, password)

      if (error) {
        // Provide user-friendly error messages
        let errorMessage = error.message
        
        if (error.message.includes('Invalid login credentials')) {
          errorMessage = 'Invalid email or password. Please check your credentials and try again.'
        } else if (error.message.includes('Email not confirmed')) {
          errorMessage = 'Please check your email and click the confirmation link to verify your account.'
        } else if (error.message.includes('User already registered')) {
          errorMessage = 'An account with this email already exists. Please sign in instead.'
        } else if (error.message.includes('Password')) {
          errorMessage = 'Password must be at least 6 characters long.'
        }
        
        setError(errorMessage)
      } else {
        if (isSignUp) {
          // Check if email confirmation is required
          if (data?.user && !data.session) {
            setSuccess('Account created! Please check your email to confirm your account before signing in.')
            setEmail('')
            setPassword('')
          } else {
            setSuccess('Account created successfully! Redirecting...')
          }
        } else {
          setSuccess('Signing you in...')
        }
      }
    } catch (err) {
      setError('An unexpected error occurred. Please try again.')
      console.error('Auth error:', err)
    } finally {
      setLoading(false)
    }
  }

  return (
    <div className="min-h-screen flex items-center justify-center bg-background">
      <Card className="w-full max-w-md">
        <CardHeader className="text-center">
          <CardTitle className="text-3xl">Cortex</CardTitle>
          <CardDescription>
            Voice notes that capture your thoughts instantly
          </CardDescription>
        </CardHeader>
        <CardContent>
          <form className="space-y-4" onSubmit={handleSubmit} aria-label={isSignUp ? 'Sign up form' : 'Sign in form'}>
            <div className="space-y-2">
              <label htmlFor="email" className="text-sm font-medium">
                Email
              </label>
              <Input
                id="email"
                name="email"
                type="email"
                required
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                placeholder="Enter your email"
                autoComplete="email"
                aria-required="true"
                aria-invalid={error ? 'true' : 'false'}
                aria-describedby={error ? 'error-message' : undefined}
              />
            </div>

            <div className="space-y-2">
              <label htmlFor="password" className="text-sm font-medium">
                Password
              </label>
              <Input
                id="password"
                name="password"
                type="password"
                required
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                placeholder="Enter your password"
                autoComplete={isSignUp ? 'new-password' : 'current-password'}
                aria-required="true"
                aria-invalid={error ? 'true' : 'false'}
                aria-describedby={error ? 'error-message' : undefined}
                onKeyDown={(e) => {
                  if (e.key === 'Enter' && email && password) {
                    handleSubmit(e as any)
                  }
                }}
              />
            </div>

            {error && (
              <div 
                id="error-message"
                className="flex items-center gap-2 p-3 rounded-md bg-destructive/10 border border-destructive/20 text-destructive text-sm" 
                role="alert"
                aria-live="polite"
              >
                <AlertCircle size={16} className="flex-shrink-0" />
                <span>{error}</span>
              </div>
            )}

            {success && (
              <div 
                className="flex items-center gap-2 p-3 rounded-md bg-green-500/10 border border-green-500/20 text-green-600 dark:text-green-400 text-sm" 
                role="status"
                aria-live="polite"
              >
                <CheckCircle2 size={16} className="flex-shrink-0" />
                <span>{success}</span>
              </div>
            )}

            <Button
              type="submit"
              disabled={loading || !email || !password}
              className="w-full"
              aria-label={isSignUp ? 'Sign up' : 'Sign in'}
            >
              {loading ? (
                <>
                  <Loader2 size={16} className="mr-2 animate-spin" />
                  {isSignUp ? 'Creating account...' : 'Signing in...'}
                </>
              ) : (
                isSignUp ? 'Sign Up' : 'Sign In'
              )}
            </Button>

            <div className="text-center">
              <Button
                type="button"
                variant="link"
                onClick={() => {
                  setIsSignUp(!isSignUp)
                  setError(null)
                  setSuccess(null)
                }}
                aria-label={isSignUp ? 'Switch to sign in' : 'Switch to sign up'}
              >
                {isSignUp ? 'Already have an account? Sign in' : "Don't have an account? Sign up"}
              </Button>
            </div>
            
            {isSignUp && (
              <p className="text-xs text-muted-foreground text-center mt-4">
                By signing up, you agree to receive a confirmation email. Please check your inbox.
              </p>
            )}
          </form>
        </CardContent>
      </Card>
    </div>
  )
}
