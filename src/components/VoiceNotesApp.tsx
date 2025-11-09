'use client'

import { useState, useEffect, useRef, useMemo, useCallback } from 'react'
import { useAuth } from '@/lib/auth-context'
import { createClient } from '@/lib/supabase'
import { 
  Mic, Square, Play, Pause, LogOut, Edit2, Check, X, Trash2, 
  Search, Volume2, VolumeX, ChevronDown, Grid, List, Menu
} from 'lucide-react'
import { ThemeToggle } from '@/components/ThemeToggle'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Textarea } from '@/components/ui/textarea'
import { Card, CardContent, CardTitle } from '@/components/ui/card'
import { Slider } from '@/components/ui/slider'
import { Avatar, AvatarFallback } from '@/components/ui/avatar'
import { Badge } from '@/components/ui/badge'
import { Separator } from '@/components/ui/separator'
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuLabel,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from '@/components/ui/dropdown-menu'
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog'
import { toast } from 'sonner'

interface VoiceNote {
  id: string
  title: string
  audio_url: string
  duration: number
  created_at: string
  completed?: boolean
  play_count?: number
  notes?: string
}

export function VoiceNotesApp() {
  const { user, signOut } = useAuth()
  const [isRecording, setIsRecording] = useState(false)
  const [recordingTime, setRecordingTime] = useState(0)
  const [mounted, setMounted] = useState(false)
  const [voiceNotes, setVoiceNotes] = useState<VoiceNote[]>([])
  const [filteredNotes, setFilteredNotes] = useState<VoiceNote[]>([])
  const [loading, setLoading] = useState(true)
  const [currentlyPlaying, setCurrentlyPlaying] = useState<string | null>(null)
  const [currentTime, setCurrentTime] = useState(0)
  const [audioDuration, setAudioDuration] = useState<Record<string, number>>({})
  const [editingId, setEditingId] = useState<string | null>(null)
  const [editingTitle, setEditingTitle] = useState('')
  const [deleteDialogOpen, setDeleteDialogOpen] = useState(false)
  const [noteToDelete, setNoteToDelete] = useState<string | null>(null)
  const [searchQuery, setSearchQuery] = useState('')
  const [soundEnabled, setSoundEnabled] = useState(true)
  const [expandedNotes, setExpandedNotes] = useState<Set<string>>(new Set())
  const [editingNotes, setEditingNotes] = useState<Record<string, string>>({})
  const [savingNotes, setSavingNotes] = useState<Set<string>>(new Set())
  const [viewType, setViewType] = useState<'list' | 'grid'>('list')
  const [currentTimeForRelative, setCurrentTimeForRelative] = useState(() => Date.now())

  const mediaRecorderRef = useRef<MediaRecorder | null>(null)
  const audioChunksRef = useRef<Blob[]>([])
  const recordingIntervalRef = useRef<NodeJS.Timeout | null>(null)
  const audioRef = useRef<HTMLAudioElement | null>(null)
  const streamRef = useRef<MediaStream | null>(null)
  
  // Memoize supabase client to avoid recreating on every render
  const supabase = useMemo(() => createClient(), [])

  // Cleanup on unmount
  useEffect(() => {
    return () => {
      // Cleanup recording
      if (recordingIntervalRef.current) {
        clearInterval(recordingIntervalRef.current)
      }
      if (streamRef.current) {
        streamRef.current.getTracks().forEach(track => track.stop())
      }
      // Cleanup audio
      if (audioRef.current) {
        audioRef.current.pause()
        audioRef.current = null
      }
    }
  }, [])

  // Load voice notes on component mount
  useEffect(() => {
    setMounted(true)
    loadVoiceNotes()
  }, [])

  // Update current time for relative timestamps periodically (every 10 seconds)
  // This prevents all timestamps from updating on every render
  useEffect(() => {
    const interval = setInterval(() => {
      setCurrentTimeForRelative(Date.now())
    }, 10000) // Update every 10 seconds

    return () => clearInterval(interval)
  }, [])

  // Filter notes based on search query
  useEffect(() => {
    if (!searchQuery.trim()) {
      setFilteredNotes(voiceNotes)
    } else {
      const query = searchQuery.toLowerCase()
      setFilteredNotes(
        voiceNotes.filter(note =>
          note.title.toLowerCase().includes(query) ||
          new Date(note.created_at).toLocaleDateString().toLowerCase().includes(query)
        )
      )
    }
  }, [searchQuery, voiceNotes])

  // Audio playback progress tracking
  useEffect(() => {
    const audio = audioRef.current
    if (!audio || !currentlyPlaying) return

    const updateTime = () => {
      if (audio && !isNaN(audio.currentTime)) {
        setCurrentTime(audio.currentTime)
      }
    }

    const updateDuration = () => {
      if (audio && !isNaN(audio.duration) && audio.duration > 0) {
        setAudioDuration(prev => ({
          ...prev,
          [currentlyPlaying]: audio.duration
        }))
      }
    }

    const handleLoadedMetadata = () => updateDuration()
    const handleDurationChange = () => updateDuration()

    audio.addEventListener('timeupdate', updateTime)
    audio.addEventListener('loadedmetadata', handleLoadedMetadata)
    audio.addEventListener('durationchange', handleDurationChange)
    audio.addEventListener('canplay', updateDuration)

    if (audio.readyState >= 1 && audio.duration) {
      updateDuration()
    }

    return () => {
      audio.removeEventListener('timeupdate', updateTime)
      audio.removeEventListener('loadedmetadata', handleLoadedMetadata)
      audio.removeEventListener('durationchange', handleDurationChange)
      audio.removeEventListener('canplay', updateDuration)
    }
  }, [currentlyPlaying])

  // Keyboard shortcuts
  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      // Don't trigger shortcuts when typing in inputs
      if (
        e.target instanceof HTMLInputElement ||
        e.target instanceof HTMLTextAreaElement ||
        (e.target as any)?.isContentEditable
      ) {
        return
      }

      // Ignore when any modifier is pressed (avoid hijacking browser shortcuts like Ctrl+Shift+R)
      if (e.ctrlKey || e.metaKey || e.altKey || e.shiftKey) {
        return
      }

      // Space bar to play/pause currently playing note
      if (e.key === ' ' && currentlyPlaying && !e.repeat) {
        e.preventDefault()
        const note = voiceNotes.find(n => n.id === currentlyPlaying)
        if (note) {
          playAudio(note.audio_url, note.id)
        }
      }

      // Escape to close dialogs or cancel editing
      if (e.key === 'Escape') {
        if (deleteDialogOpen) {
          setDeleteDialogOpen(false)
        }
        if (editingId) {
          cancelEditing()
        }
      }

      // 'r' to start/stop recording
      if (e.key === 'r' || e.key === 'R') {
        e.preventDefault()
        if (isRecording) {
          stopRecording()
        } else {
          startRecording()
        }
      }
    }

    window.addEventListener('keydown', handleKeyDown)
    return () => window.removeEventListener('keydown', handleKeyDown)
  }, [currentlyPlaying, voiceNotes, deleteDialogOpen, editingId, isRecording])

  const loadVoiceNotes = useCallback(async () => {
    try {
      const { data, error } = await supabase
        .from('voice_notes')
        .select('*')
        .order('created_at', { ascending: false })

      if (error) throw error
      setVoiceNotes(data || [])
      setFilteredNotes(data || [])
      // Update current time when notes are loaded to ensure new notes show correctly
      setCurrentTimeForRelative(Date.now())
    } catch (error) {
      console.error('Error loading voice notes:', error)
      toast.error('Failed to load voice notes')
    } finally {
      setLoading(false)
    }
  }, [supabase])

  const generateDefaultTitle = useCallback(() => {
    const now = new Date()
    const dateStr = now.toISOString().split('T')[0]
    const timeStr = now.toTimeString().split(' ')[0].replace(/:/g, '-')
    const count = voiceNotes.length + 1
    return `Voice Note ${dateStr} ${timeStr} #${count}`
  }, [voiceNotes.length])

  // Play beep sound function
  const playBeep = useCallback((frequency: number = 800, duration: number = 100) => {
    if (!soundEnabled) return
    
    try {
      const audioContext = new (window.AudioContext || (window as any).webkitAudioContext)()
      const oscillator = audioContext.createOscillator()
      const gainNode = audioContext.createGain()
      
      oscillator.connect(gainNode)
      gainNode.connect(audioContext.destination)
      
      oscillator.frequency.value = frequency
      oscillator.type = 'sine'
      
      gainNode.gain.setValueAtTime(0.3, audioContext.currentTime)
      gainNode.gain.exponentialRampToValueAtTime(0.01, audioContext.currentTime + duration / 1000)
      
      oscillator.start(audioContext.currentTime)
      oscillator.stop(audioContext.currentTime + duration / 1000)
    } catch (error) {
      // Silently fail if audio context is not available
      console.debug('Beep sound not available:', error)
    }
  }, [soundEnabled])

  const startRecording = useCallback(async () => {
    if (!user) {
      toast.error('You must be logged in to record')
      return
    }

    try {
      if (!navigator.mediaDevices || !navigator.mediaDevices.getUserMedia) {
        toast.error('Microphone access is not supported in this browser. Please use a modern browser.')
        return
      }

      if (!window.MediaRecorder) {
        toast.error('Audio recording is not supported in this browser.')
        return
      }

      const stream = await navigator.mediaDevices.getUserMedia({ 
        audio: {
          echoCancellation: true,
          noiseSuppression: true,
          autoGainControl: true
        } 
      })
      streamRef.current = stream

      const mimeTypes = [
        'audio/webm;codecs=opus',
        'audio/webm',
        'audio/mp4',
        'audio/wav',
        'audio/mpeg'
      ]

      let selectedMimeType = ''
      for (const mimeType of mimeTypes) {
        if (MediaRecorder.isTypeSupported(mimeType)) {
          selectedMimeType = mimeType
          break
        }
      }

      const mediaRecorder = selectedMimeType
        ? new MediaRecorder(stream, { mimeType: selectedMimeType })
        : new MediaRecorder(stream)
      
      mediaRecorderRef.current = mediaRecorder
      audioChunksRef.current = []

      mediaRecorder.ondataavailable = (event) => {
        if (event.data.size > 0) {
          audioChunksRef.current.push(event.data)
        }
      }

      mediaRecorder.onstop = async () => {
        const mimeType = selectedMimeType || mediaRecorder.mimeType || 'audio/webm'
        const audioBlob = new Blob(audioChunksRef.current, { type: mimeType })
        await uploadAudio(audioBlob)
        stream.getTracks().forEach(track => track.stop())
      }

      mediaRecorder.start()
      setIsRecording(true)
      setRecordingTime(0)

      // Play start beep if sound is enabled
      playBeep(800, 100)

      recordingIntervalRef.current = setInterval(() => {
        setRecordingTime(prev => {
          if (prev >= 300) {
            stopRecording()
            return prev
          }
          return prev + 1
        })
      }, 1000)

      toast.success('Recording started')
    } catch (error: any) {
      console.error('Error starting recording:', error)
      
      let errorMessage = 'Could not access microphone. Please check permissions.'
      
      if (error instanceof DOMException) {
        switch (error.name) {
          case 'NotAllowedError':
          case 'PermissionDeniedError':
            errorMessage = 'Microphone permission denied. Please allow microphone access in your browser settings and try again.'
            break
          case 'NotFoundError':
          case 'DevicesNotFoundError':
            errorMessage = 'No microphone found. Please connect a microphone and try again.'
            break
          case 'NotReadableError':
          case 'TrackStartError':
            errorMessage = 'Microphone is already in use by another application. Please close other apps using the microphone and try again.'
            break
          case 'OverconstrainedError':
          case 'ConstraintNotSatisfiedError':
            errorMessage = 'Microphone does not meet the required specifications. Please try a different microphone.'
            break
          case 'NotSupportedError':
            errorMessage = 'Microphone access is not supported in this browser or context. Please use HTTPS or localhost.'
            break
          case 'AbortError':
            errorMessage = 'Microphone access was interrupted. Please try again.'
            break
          case 'SecurityError':
            errorMessage = 'Microphone access blocked for security reasons. Please use HTTPS or localhost.'
            break
          default:
            errorMessage = `Microphone error: ${error.message || error.name || 'Unknown error'}. Please check your browser settings.`
        }
      } else if (error && typeof error === 'object' && 'message' in error) {
        errorMessage = `Microphone error: ${error.message}`
      }
      
      toast.error(errorMessage)
    }
  }, [user, generateDefaultTitle, playBeep])

  const stopRecording = useCallback(() => {
    if (mediaRecorderRef.current && isRecording) {
      // Play stop beep if sound is enabled
      playBeep(600, 150)
      
      mediaRecorderRef.current.stop()
      setIsRecording(false)
      if (recordingIntervalRef.current) {
        clearInterval(recordingIntervalRef.current)
        recordingIntervalRef.current = null
      }
      if (streamRef.current) {
        streamRef.current.getTracks().forEach(track => track.stop())
        streamRef.current = null
      }
      toast.success('Recording stopped')
    }
  }, [isRecording, playBeep])

  const uploadAudio = useCallback(async (audioBlob: Blob) => {
    if (!user) {
      toast.error('You must be logged in to upload audio')
      return
    }

    try {
      const mimeType = audioBlob.type || 'audio/webm'
      const extension = mimeType.split('/')[1].split(';')[0]
      const fileName = `${user.id}/${Date.now()}.${extension}`

      const { data, error } = await supabase.storage
        .from('voice-notes')
        .upload(fileName, audioBlob, {
          contentType: mimeType,
          cacheControl: '3600'
        })

      if (error) throw error

      const { error: dbError } = await supabase
        .from('voice_notes')
        .insert({
          user_id: user.id,
          title: generateDefaultTitle(),
          audio_url: fileName,
          duration: recordingTime,
          file_size: audioBlob.size
        })

      if (dbError) throw dbError

      // Reset recording time after successful upload
      setRecordingTime(0)

      toast.success('Voice note saved successfully')
      loadVoiceNotes()
    } catch (error) {
      console.error('Error uploading audio:', error)
      toast.error('Failed to save voice note')
    }
  }, [user, supabase, generateDefaultTitle, recordingTime, loadVoiceNotes])

  const playAudio = useCallback(async (audioPathOrUrl: string, noteId: string) => {
    if (currentlyPlaying === noteId) {
      audioRef.current?.pause()
      setCurrentlyPlaying(null)
      return
    }

    if (audioRef.current) {
      audioRef.current.pause()
      audioRef.current = null
    }
    
    setCurrentTime(0)

    try {
      let audioUrl: string
      
      if (audioPathOrUrl.startsWith('http://') || audioPathOrUrl.startsWith('https://')) {
        audioUrl = audioPathOrUrl
      } else {
        const { data: { session } } = await supabase.auth.getSession()
        if (!session) {
          toast.error('You must be logged in to play audio files.')
          return
        }
        
        const { data, error } = await supabase.storage
          .from('voice-notes')
          .createSignedUrl(audioPathOrUrl, 3600)

        if (error) {
          toast.error(`Unable to access audio: ${error.message}`)
          return
        }

        if (!data?.signedUrl) {
          toast.error('Failed to generate audio URL')
          return
        }

        audioUrl = data.signedUrl
      }

      const audio = new Audio(audioUrl)
      audioRef.current = audio
      
      setCurrentTime(0)
      
      audio.onloadedmetadata = () => {
        if (audio.duration && !isNaN(audio.duration)) {
          setAudioDuration(prev => ({
            ...prev,
            [noteId]: audio.duration
          }))
        }
      }

      audio.onended = () => {
        setCurrentlyPlaying(null)
        setCurrentTime(0)
      }

      audio.onerror = () => {
        toast.error('Unable to play this audio file')
        setCurrentlyPlaying(null)
        setCurrentTime(0)
      }

      audio.load()
      
      await new Promise<void>((resolve, reject) => {
        const timeout = setTimeout(() => {
          reject(new Error('Timeout waiting for audio metadata'))
        }, 5000)

        if (audio.readyState >= 1 && audio.duration) {
          clearTimeout(timeout)
          resolve()
        } else {
          audio.addEventListener('loadedmetadata', () => {
            clearTimeout(timeout)
            resolve()
          }, { once: true })
          
          audio.addEventListener('error', () => {
            clearTimeout(timeout)
            reject(new Error('Failed to load audio'))
          }, { once: true })
        }
      })

      if (audio.duration && !isNaN(audio.duration)) {
        setAudioDuration(prev => ({
          ...prev,
          [noteId]: audio.duration
        }))
      }

      await audio.play()
      setCurrentlyPlaying(noteId)
      
      const currentNote = voiceNotes.find(n => n.id === noteId)
      const newPlayCount = (currentNote?.play_count || 0) + 1
      
      const { error: playCountError } = await supabase
        .from('voice_notes')
        .update({ play_count: newPlayCount })
        .eq('id', noteId)
      
      if (!playCountError) {
        setVoiceNotes(prev =>
          prev.map(n => n.id === noteId ? { ...n, play_count: newPlayCount } : n)
        )
        setFilteredNotes(prev =>
          prev.map(n => n.id === noteId ? { ...n, play_count: newPlayCount } : n)
        )
      }
    } catch (error) {
      console.error('Error playing audio:', error)
      toast.error('Unable to play audio file')
      setCurrentlyPlaying(null)
    }
  }, [currentlyPlaying, supabase, voiceNotes])

  const handleSeek = useCallback((value: number[], noteId: string) => {
    if (audioRef.current && currentlyPlaying === noteId) {
      const newTime = value[0]
      if (!isNaN(newTime) && isFinite(newTime)) {
        audioRef.current.currentTime = newTime
        setCurrentTime(newTime)
      }
    }
  }, [currentlyPlaying])

  const deleteNote = useCallback(async () => {
    if (!noteToDelete) return

    try {
      const note = voiceNotes.find(n => n.id === noteToDelete)
      if (!note) return

      if (!note.audio_url.startsWith('http')) {
        const { error: storageError } = await supabase.storage
          .from('voice-notes')
          .remove([note.audio_url])

        if (storageError) {
          console.error('Storage delete error:', storageError)
        }
      }

      const { error } = await supabase
        .from('voice_notes')
        .delete()
        .eq('id', noteToDelete)

      if (error) throw error

      toast.success('Voice note deleted')
      setDeleteDialogOpen(false)
      setNoteToDelete(null)
      
      if (currentlyPlaying === noteToDelete) {
        audioRef.current?.pause()
        setCurrentlyPlaying(null)
      }
      
      loadVoiceNotes()
    } catch (error) {
      console.error('Error deleting note:', error)
      toast.error('Failed to delete voice note')
    }
  }, [noteToDelete, voiceNotes, supabase, currentlyPlaying, loadVoiceNotes])

  const startEditing = useCallback((note: VoiceNote) => {
    setEditingId(note.id)
    setEditingTitle(note.title)
  }, [])

  const saveTitle = useCallback(async () => {
    if (!editingId) return

    try {
      const { error } = await supabase
        .from('voice_notes')
        .update({ title: editingTitle })
        .eq('id', editingId)

      if (error) throw error

      setVoiceNotes(notes =>
        notes.map(note =>
          note.id === editingId ? { ...note, title: editingTitle } : note
        )
      )
      setFilteredNotes(notes =>
        notes.map(note =>
          note.id === editingId ? { ...note, title: editingTitle } : note
        )
      )
      setEditingId(null)
      setEditingTitle('')
      toast.success('Title updated')
    } catch (error) {
      console.error('Error updating title:', error)
      toast.error('Failed to update title')
    }
  }, [editingId, editingTitle, supabase])

  const cancelEditing = useCallback(() => {
    setEditingId(null)
    setEditingTitle('')
  }, [])

  const toggleExpanded = useCallback((noteId: string) => {
    setExpandedNotes(prev => {
      const newSet = new Set(prev)
      if (newSet.has(noteId)) {
        newSet.delete(noteId)
      } else {
        newSet.add(noteId)
      }
      return newSet
    })
  }, [])

  const toggleComplete = useCallback(async (noteId: string, currentCompleted: boolean) => {
    try {
      const newCompleted = !currentCompleted
      const { error } = await supabase
        .from('voice_notes')
        .update({ completed: newCompleted })
        .eq('id', noteId)
      
      if (error) throw error

      setVoiceNotes(prev =>
        prev.map(n => n.id === noteId ? { ...n, completed: newCompleted } : n)
      )
      setFilteredNotes(prev =>
        prev.map(n => n.id === noteId ? { ...n, completed: newCompleted } : n)
      )
    } catch (error) {
      console.error('Error toggling complete:', error)
      toast.error('Failed to update note')
    }
  }, [supabase])

  const saveNotes = useCallback(async (noteId: string) => {
    const notesText = editingNotes[noteId] || ''
    setSavingNotes(prev => new Set(prev).add(noteId))
    
    try {
      const { error } = await supabase
        .from('voice_notes')
        .update({ notes: notesText })
        .eq('id', noteId)
      
      if (error) throw error

      setVoiceNotes(prev =>
        prev.map(n => n.id === noteId ? { ...n, notes: notesText } : n)
      )
      setFilteredNotes(prev =>
        prev.map(n => n.id === noteId ? { ...n, notes: notesText } : n)
      )
      
      setEditingNotes(prev => {
        const newState = { ...prev }
        delete newState[noteId]
        return newState
      })
      
      toast.success('Notes saved')
    } catch (error) {
      console.error('Error saving notes:', error)
      toast.error('Failed to save notes')
    } finally {
      setSavingNotes(prev => {
        const newSet = new Set(prev)
        newSet.delete(noteId)
        return newSet
      })
    }
  }, [editingNotes, supabase])

  const formatTime = useCallback((seconds: number) => {
    const mins = Math.floor(seconds / 60)
    const secs = Math.floor(seconds % 60)
    return `${mins}:${secs.toString().padStart(2, '0')}`
  }, [])

  const formatDuration = useCallback((seconds: number) => {
    const mins = Math.floor(seconds / 60)
    const secs = Math.floor(seconds % 60)
    return `${mins}m ${secs}s`
  }, [])

  const formatRelativeTime = useCallback((dateString: string) => {
    const now = currentTimeForRelative
    const date = new Date(dateString)
    const diffInSeconds = Math.floor((now - date.getTime()) / 1000)

    // Handle negative time (future dates) or very recent (less than 1 second)
    if (diffInSeconds < 0) {
      return 'just now'
    }

    if (diffInSeconds < 1) {
      return 'just now'
    }

    if (diffInSeconds < 60) {
      return `${diffInSeconds} second${diffInSeconds !== 1 ? 's' : ''} ago`
    }

    const diffInMinutes = Math.floor(diffInSeconds / 60)
    if (diffInMinutes < 60) {
      return `${diffInMinutes} minute${diffInMinutes !== 1 ? 's' : ''} ago`
    }

    const diffInHours = Math.floor(diffInMinutes / 60)
    if (diffInHours < 24) {
      return `${diffInHours} hour${diffInHours !== 1 ? 's' : ''} ago`
    }

    const diffInDays = Math.floor(diffInHours / 24)
    if (diffInDays < 7) {
      return `${diffInDays} day${diffInDays !== 1 ? 's' : ''} ago`
    }

    const diffInWeeks = Math.floor(diffInDays / 7)
    if (diffInWeeks < 4) {
      return `${diffInWeeks} week${diffInWeeks !== 1 ? 's' : ''} ago`
    }

    const diffInMonths = Math.floor(diffInDays / 30)
    if (diffInMonths < 12) {
      return `${diffInMonths} month${diffInMonths !== 1 ? 's' : ''} ago`
    }

    const diffInYears = Math.floor(diffInDays / 365)
    return `${diffInYears} year${diffInYears !== 1 ? 's' : ''} ago`
  }, [currentTimeForRelative])

  const getUserInitial = useCallback(() => {
    return user?.email?.charAt(0).toUpperCase() || 'U'
  }, [user])

  // Calculate statistics
  const stats = useMemo(() => {
    const totalNotes = voiceNotes.length
    const completedNotes = voiceNotes.filter(n => n.completed).length
    const pendingNotes = totalNotes - completedNotes
    const totalPlayCount = voiceNotes.reduce((sum, n) => sum + (n.play_count || 0), 0)
    return { totalNotes, completedNotes, pendingNotes, totalPlayCount }
  }, [voiceNotes])

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-background">
        <div className="text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-primary mx-auto" aria-label="Loading"></div>
          <p className="mt-4 text-muted-foreground">Loading voice notes...</p>
        </div>
      </div>
    )
  }

  return (
    <div className="min-h-screen bg-background">
      {/* Header */}
      <header className="bg-card border-b sticky top-0 z-50">
        <div className="max-w-6xl mx-auto px-4 py-4 flex justify-between items-center">
          <h1 className="text-2xl font-bold">Cortex</h1>
          
          <div className="flex items-center gap-2">
            <Avatar className="cursor-pointer hover:opacity-80 transition-opacity" aria-label="User avatar">
              <AvatarFallback className="bg-transparent border border-border h-9 w-9 text-sm font-medium">
                {getUserInitial()}
              </AvatarFallback>
            </Avatar>
            <ThemeToggle />
            <Button
              variant="ghost"
              size="icon"
              onClick={() => setSoundEnabled(!soundEnabled)}
              aria-label={soundEnabled ? 'Mute sound' : 'Unmute sound'}
              title={soundEnabled ? 'Mute recording sounds' : 'Enable recording sounds'}
              className="h-9 w-9"
            >
              {soundEnabled ? <Volume2 size={18} /> : <VolumeX size={18} />}
            </Button>
            <Button 
              variant="ghost" 
              size="icon" 
              onClick={signOut}
              className="h-9 w-9"
              aria-label="Sign out"
              title="Sign Out"
            >
              <LogOut size={18} />
            </Button>
          </div>
        </div>
      </header>

      <main className="max-w-6xl mx-auto px-4 py-12 space-y-12">
        {/* Recording Section */}
        <section aria-label="Recording section">
          <CardTitle className="text-2xl mb-6 text-center">Record a New Note</CardTitle>
          <Card className="bg-muted/30">
            <CardContent className="pt-6">
              <div className="text-center space-y-6">
                <div className="text-6xl font-mono font-bold tracking-tighter min-h-[80px] flex items-center justify-center tabular-nums" aria-live="polite" aria-atomic="true">
                  {mounted ? formatTime(recordingTime) : '00:00'}
                </div>

                <div className="flex justify-center">
                  <Button
                    onClick={isRecording ? stopRecording : startRecording}
                    onKeyDown={(e) => {
                      if (e.key === 'Enter' || e.key === ' ') {
                        e.preventDefault()
                        if (isRecording) stopRecording()
                        else startRecording()
                      }
                    }}
                    size="lg"
                    variant={isRecording ? "destructive" : "default"}
                    className={`relative ${isRecording ? 'px-8' : ''}`}
                    aria-label={isRecording ? 'Stop recording' : 'Start recording'}
                    aria-pressed={isRecording}
                  >
                    {isRecording ? (
                      <>
                        <Square size={20} className="mr-2" aria-hidden="true" />
                        Stop Recording
                      </>
                    ) : (
                      <>
                        <Mic size={20} className="mr-2" aria-hidden="true" />
                        Start Recording
                      </>
                    )}
                  </Button>
                </div>
                <p className="text-xs text-muted-foreground">
                  Press <kbd className="px-1.5 py-0.5 bg-muted rounded text-xs">R</kbd> to start/stop recording
                </p>
              </div>
            </CardContent>
          </Card>
        </section>

        <Separator className="my-12" aria-hidden="true" />

        {/* Notes Section */}
        <section aria-label="Voice notes">
          <div className="flex items-center justify-between mb-6">
            <CardTitle className="text-xl">Your Notes</CardTitle>
          </div>
          
          <div className="mb-6">
            <div className="flex flex-col sm:flex-row items-stretch sm:items-center gap-3 sm:gap-4">
              <div className="relative flex-1">
                <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-muted-foreground" size={18} aria-hidden="true" />
                <Input
                  placeholder="Search notes..."
                  value={searchQuery}
                  onChange={(e) => setSearchQuery(e.target.value)}
                  className="pl-10"
                  aria-label="Search voice notes"
                />
              </div>
              
              <div className="flex items-center gap-2 sm:gap-4">
                {/* Stats Dropdown */}
                <div className="flex items-center border rounded-md p-1 bg-background">
                  <DropdownMenu>
                    <DropdownMenuTrigger asChild>
                      <Button variant="ghost" size="sm" className="h-8 gap-2" aria-label="View statistics">
                        <Menu size={16} aria-hidden="true" />
                        <span className="hidden sm:inline">Stats</span>
                      </Button>
                    </DropdownMenuTrigger>
                    <DropdownMenuContent align="end" className="w-56">
                      <DropdownMenuLabel>Statistics</DropdownMenuLabel>
                      <DropdownMenuSeparator />
                      <DropdownMenuItem className="flex items-center justify-between">
                        <span>Total Notes</span>
                        <Badge variant="secondary">{stats.totalNotes}</Badge>
                      </DropdownMenuItem>
                      <DropdownMenuItem className="flex items-center justify-between">
                        <span>Completed</span>
                        <Badge variant="default" className="bg-green-500">{stats.completedNotes}</Badge>
                      </DropdownMenuItem>
                      <DropdownMenuItem className="flex items-center justify-between">
                        <span>Pending</span>
                        <Badge variant="secondary">{stats.pendingNotes}</Badge>
                      </DropdownMenuItem>
                      <DropdownMenuSeparator />
                      <DropdownMenuItem className="flex items-center justify-between">
                        <span>Total Plays</span>
                        <Badge variant="secondary">{stats.totalPlayCount}</Badge>
                      </DropdownMenuItem>
                    </DropdownMenuContent>
                  </DropdownMenu>
                </div>
                
                {/* View Toggle */}
                <div className="flex items-center gap-1 border rounded-md p-1 bg-background" role="group" aria-label="View type">
                  <Button
                    variant={viewType === 'list' ? 'default' : 'ghost'}
                    size="sm"
                    onClick={() => setViewType('list')}
                    className="h-8"
                    aria-label="List view"
                    aria-pressed={viewType === 'list'}
                  >
                    <List size={16} className="sm:mr-2" aria-hidden="true" />
                    <span className="hidden sm:inline">List</span>
                  </Button>
                  <Separator orientation="vertical" className="h-6" aria-hidden="true" />
                  <Button
                    variant={viewType === 'grid' ? 'default' : 'ghost'}
                    size="sm"
                    onClick={() => setViewType('grid')}
                    className="h-8"
                    aria-label="Grid view"
                    aria-pressed={viewType === 'grid'}
                  >
                    <Grid size={16} className="sm:mr-2" aria-hidden="true" />
                    <span className="hidden sm:inline">Grid</span>
                  </Button>
                </div>
              </div>
            </div>
          </div>

          {/* Voice Notes List */}
          {filteredNotes.length === 0 ? (
            <div className="py-20 text-center text-muted-foreground" role="status">
              <div className="mx-auto w-24 h-24 rounded-full bg-muted flex items-center justify-center mb-6">
                <Mic size={48} className="opacity-30" aria-hidden="true" />
              </div>
              <h3 className="text-lg font-medium mb-2">
                {searchQuery ? 'No notes found' : 'No voice notes yet'}
              </h3>
              <p className="text-sm">
                {searchQuery 
                  ? 'Try adjusting your search terms' 
                  : 'Start recording to capture your thoughts!'}
              </p>
            </div>
          ) : (
            <div className={viewType === 'grid' 
              ? 'grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6' 
              : 'space-y-4'
            } role="list">
              {filteredNotes.map((note) => {
                const isPlaying = currentlyPlaying === note.id
                const currentNoteTime = isPlaying ? currentTime : 0
                const actualDuration = audioDuration[note.id] || note.duration
                const maxDuration = actualDuration > 0 ? actualDuration : note.duration
                const isExpanded = expandedNotes.has(note.id)

                return (
                  <Card key={note.id} className={`p-6 transition-all hover:shadow-md hover:border-primary/20 ${viewType === 'grid' ? 'h-full flex flex-col' : ''}`} role="listitem">
                    {viewType === 'grid' ? (
                      // Grid View - Compact Design
                      <div className="flex flex-col h-full">
                        <h3 className={`font-medium mb-2 line-clamp-2 ${note.completed ? 'line-through text-muted-foreground' : ''}`}>
                          {note.title}
                        </h3>
                        
                        <div className="flex items-center gap-2 text-xs text-muted-foreground mb-4">
                          <span>{formatDuration(note.duration)}</span>
                          <span aria-hidden="true">•</span>
                          <span>{formatRelativeTime(note.created_at)}</span>
                        </div>
                        
                        <div className="flex items-center justify-between mt-auto pt-4 border-t gap-2">
                          <div className="flex items-center gap-2 flex-1 min-w-0">
                            <Button
                              size="icon"
                              variant={isPlaying ? "default" : "ghost"}
                              onClick={() => playAudio(note.audio_url, note.id)}
                              className="h-8 w-8 flex-shrink-0"
                              aria-label={isPlaying ? 'Pause audio' : 'Play audio'}
                              title={isPlaying ? 'Pause (Space)' : 'Play (Space)'}
                            >
                              {isPlaying ? <Pause size={16} aria-hidden="true" /> : <Play size={16} aria-hidden="true" />}
                            </Button>
                            
                            {isPlaying && maxDuration > 0 && (
                              <div className="flex-1 min-w-0 max-w-[120px]">
                                <Slider
                                  value={[Math.min(currentNoteTime, maxDuration)]}
                                  max={maxDuration}
                                  step={0.1}
                                  onValueChange={(value) => handleSeek(value, note.id)}
                                  className="w-full"
                                  aria-label="Audio progress"
                                />
                              </div>
                            )}
                          </div>
                          
                          <div className="flex items-center gap-1 flex-shrink-0">
                            <Button
                              size="icon"
                              variant={note.completed ? "default" : "ghost"}
                              onClick={() => toggleComplete(note.id, note.completed || false)}
                              className="h-8 w-8"
                              aria-label={note.completed ? 'Mark as incomplete' : 'Mark as completed'}
                              aria-pressed={note.completed}
                              title={note.completed ? 'Mark as incomplete' : 'Mark as completed'}
                            >
                              <Check size={16} strokeWidth={2.5} aria-hidden="true" />
                            </Button>
                            <Button
                              size="icon"
                              variant="ghost"
                              onClick={() => startEditing(note)}
                              className="h-8 w-8"
                              aria-label="Edit title"
                              title="Edit title"
                            >
                              <Edit2 size={16} aria-hidden="true" />
                            </Button>
                            <Button
                              size="icon"
                              variant="ghost"
                              onClick={() => {
                                setNoteToDelete(note.id)
                                setDeleteDialogOpen(true)
                              }}
                              className="h-8 w-8"
                              aria-label="Delete note"
                              title="Delete"
                            >
                              <Trash2 size={16} className="text-destructive" aria-hidden="true" />
                            </Button>
                          </div>
                        </div>
                      </div>
                    ) : (
                      // List View
                      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-3 sm:gap-4">
                        <div className="flex-1 min-w-0">
                          {editingId === note.id ? (
                            <div className="flex items-center gap-2">
                              <Input
                                value={editingTitle}
                                onChange={(e) => setEditingTitle(e.target.value)}
                                onKeyDown={(e) => {
                                  if (e.key === 'Enter') saveTitle()
                                  if (e.key === 'Escape') cancelEditing()
                                }}
                                className="h-8"
                                autoFocus
                                aria-label="Edit title"
                              />
                              <Button 
                                size="icon" 
                                variant="ghost" 
                                onClick={saveTitle}
                                className="h-8 w-8 sm:h-9 sm:w-9"
                                aria-label="Save title"
                                title="Save (Enter)"
                              >
                                <Check size={16} className="sm:w-[18px] sm:h-[18px]" aria-hidden="true" />
                              </Button>
                              <Button 
                                size="icon" 
                                variant="ghost" 
                                onClick={cancelEditing}
                                className="h-8 w-8 sm:h-9 sm:w-9"
                                aria-label="Cancel editing"
                                title="Cancel (Esc)"
                              >
                                <X size={16} className="sm:w-[18px] sm:h-[18px]" aria-hidden="true" />
                              </Button>
                            </div>
                          ) : (
                            <>
                              <h3 className={`font-medium truncate mb-1 ${note.completed ? 'line-through text-muted-foreground' : ''}`}>
                                {note.title}
                              </h3>
                              <div className="flex items-center gap-2 text-sm text-muted-foreground">
                                <span>{formatDuration(note.duration)}</span>
                                <span aria-hidden="true">•</span>
                                <span>{formatRelativeTime(note.created_at)}</span>
                              </div>
                            </>
                          )}
                        </div>

                        <div className="flex items-center gap-1 sm:gap-2 flex-shrink-0">
                          <Button
                            size="icon"
                            variant={isPlaying ? "default" : "ghost"}
                            onClick={() => playAudio(note.audio_url, note.id)}
                            className={`h-8 w-8 sm:h-9 sm:w-9 ${isPlaying ? 'bg-primary animate-pulse' : ''}`}
                            aria-label={isPlaying ? 'Pause audio' : 'Play audio'}
                            aria-pressed={isPlaying}
                            title={isPlaying ? 'Pause (Space)' : 'Play (Space)'}
                          >
                            {isPlaying ? (
                              <Pause size={16} className="sm:w-[18px] sm:h-[18px]" aria-hidden="true" />
                            ) : (
                              <Play size={16} className="sm:w-[18px] sm:h-[18px]" aria-hidden="true" />
                            )}
                          </Button>

                          <Button
                            size="icon"
                            variant={note.completed ? "default" : "ghost"}
                            onClick={() => toggleComplete(note.id, note.completed || false)}
                            className="h-8 w-8 sm:h-9 sm:w-9"
                            aria-label={note.completed ? 'Mark as incomplete' : 'Mark as completed'}
                            aria-pressed={note.completed}
                            title={note.completed ? 'Mark as incomplete' : 'Mark as completed'}
                          >
                            <Check size={16} className="sm:w-[18px] sm:h-[18px]" strokeWidth={2.5} aria-hidden="true" />
                          </Button>

                          <Button
                            size="icon"
                            variant="ghost"
                            onClick={() => startEditing(note)}
                            className="h-8 w-8 sm:h-9 sm:w-9"
                            aria-label="Edit title"
                            title="Edit title"
                          >
                            <Edit2 size={16} className="sm:w-[18px] sm:h-[18px]" aria-hidden="true" />
                          </Button>

                          <Button
                            size="icon"
                            variant="ghost"
                            onClick={() => {
                              setNoteToDelete(note.id)
                              setDeleteDialogOpen(true)
                            }}
                            className="h-8 w-8 sm:h-9 sm:w-9"
                            aria-label="Delete note"
                            title="Delete"
                          >
                            <Trash2 size={16} className="sm:w-[18px] sm:h-[18px] text-destructive" aria-hidden="true" />
                          </Button>

                          <Button
                            size="icon"
                            variant="ghost"
                            onClick={() => toggleExpanded(note.id)}
                            className="h-8 w-8 sm:h-9 sm:w-9"
                            aria-label={isExpanded ? 'Collapse details' : 'Expand details'}
                            aria-expanded={isExpanded}
                            title={isExpanded ? 'Collapse' : 'Expand'}
                          >
                            <ChevronDown 
                              size={16} 
                              className={`sm:w-[18px] sm:h-[18px] transition-transform ${isExpanded ? 'rotate-180' : ''}`}
                              aria-hidden="true"
                            />
                          </Button>
                        </div>
                      </div>
                    )}

                    {viewType === 'list' && isPlaying && maxDuration > 0 && (
                      <div className="mt-6 pt-6 border-t space-y-3">
                        <div className="flex items-center justify-between text-xs text-muted-foreground mb-2">
                          <span>{formatTime(currentNoteTime)}</span>
                          <span>{formatTime(maxDuration)}</span>
                        </div>
                        <Slider
                          value={[Math.min(currentNoteTime, maxDuration)]}
                          max={maxDuration}
                          step={0.1}
                          onValueChange={(value) => handleSeek(value, note.id)}
                          className="w-full"
                          aria-label="Audio progress"
                        />
                        <div className="flex items-center justify-between text-xs text-muted-foreground pt-2">
                          <span>Duration: {formatDuration(note.duration)}</span>
                          <span>{new Date(note.created_at).toLocaleString()}</span>
                        </div>
                      </div>
                    )}

                    {viewType === 'list' && isExpanded && (
                      <div className="mt-4 pt-4 border-t space-y-6">
                        <div className="flex items-center justify-between text-sm text-muted-foreground">
                          <div className="flex items-center gap-4">
                            <span>Duration: {formatDuration(note.duration)}</span>
                            {note.play_count !== undefined && (
                              <span>Played: {note.play_count} {note.play_count === 1 ? 'time' : 'times'}</span>
                            )}
                          </div>
                          <span>{new Date(note.created_at).toLocaleString()}</span>
                        </div>

                        <Separator aria-hidden="true" />

                        <div className="space-y-3">
                          <div className="flex items-center justify-between">
                            <label htmlFor={`notes-${note.id}`} className="text-sm font-medium">Notes/Annotations</label>
                            {editingNotes[note.id] !== undefined && editingNotes[note.id] !== (note.notes || '') && (
                              <Button
                                size="sm"
                                variant="default"
                                onClick={() => saveNotes(note.id)}
                                disabled={savingNotes.has(note.id)}
                                className="h-7"
                                aria-label="Save notes"
                              >
                                {savingNotes.has(note.id) ? 'Saving...' : 'Save'}
                              </Button>
                            )}
                          </div>
                          <Textarea
                            id={`notes-${note.id}`}
                            placeholder="Add your notes or annotations here..."
                            value={editingNotes[note.id] !== undefined ? editingNotes[note.id] : (note.notes || '')}
                            onChange={(e) => {
                              setEditingNotes(prev => ({
                                ...prev,
                                [note.id]: e.target.value
                              }))
                            }}
                            onBlur={() => {
                              const currentValue = editingNotes[note.id]
                              if (currentValue !== undefined && currentValue !== (note.notes || '')) {
                                saveNotes(note.id)
                              }
                            }}
                            onKeyDown={(e) => {
                              if (e.key === 'Escape') {
                                const currentValue = editingNotes[note.id]
                                if (currentValue !== undefined && currentValue !== (note.notes || '')) {
                                  saveNotes(note.id)
                                }
                              }
                            }}
                            className="min-h-[120px] resize-none"
                            aria-label="Notes and annotations"
                          />
                          {!note.notes && editingNotes[note.id] === undefined && (
                            <p className="text-xs text-muted-foreground">
                              Click to add notes or annotations
                            </p>
                          )}
                        </div>
                      </div>
                    )}
                  </Card>
                )
              })}
            </div>
          )}
        </section>
      </main>

      {/* Delete Confirmation Dialog */}
      <Dialog open={deleteDialogOpen} onOpenChange={setDeleteDialogOpen}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Delete Voice Note</DialogTitle>
            <DialogDescription>
              Are you sure you want to delete this voice note? This action cannot be undone.
            </DialogDescription>
          </DialogHeader>
          <DialogFooter>
            <Button 
              variant="outline" 
              onClick={() => setDeleteDialogOpen(false)}
              onKeyDown={(e) => {
                if (e.key === 'Escape') {
                  setDeleteDialogOpen(false)
                }
              }}
            >
              Cancel
            </Button>
            <Button 
              variant="destructive" 
              onClick={deleteNote}
              onKeyDown={(e) => {
                if (e.key === 'Enter') {
                  deleteNote()
                }
              }}
            >
              Delete
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  )
}
