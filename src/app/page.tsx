'use client'

import { useAuth } from '@/lib/auth-context'
import { AuthForm } from '@/components/auth/AuthForm'
import { VoiceNotesApp } from '@/components/VoiceNotesApp'

export default function Home() {
  const { user, loading } = useAuth()

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <div className="text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600 mx-auto"></div>
          <p className="mt-4 text-gray-600">Loading...</p>
        </div>
      </div>
    )
  }

  if (!user) {
    return <AuthForm />
  }

  return <VoiceNotesApp />
}
