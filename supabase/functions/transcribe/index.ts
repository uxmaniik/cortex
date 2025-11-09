import "jsr:@supabase/functions-js/edge-runtime.d.ts"
import { createClient } from 'jsr:@supabase/supabase-js@2'

Deno.serve(async (req) => {
  try {
    const { filePath, supabaseUrl, supabaseAnonKey } = await req.json()

    if (!filePath) {
      return new Response(
        JSON.stringify({ error: 'File path is required' }),
        { status: 400, headers: { 'Content-Type': 'application/json' } }
      )
    }
    
    if (!supabaseUrl || !supabaseAnonKey) {
      return new Response(
        JSON.stringify({ error: 'Supabase configuration missing' }),
        { status: 500, headers: { 'Content-Type': 'application/json' } }
      )
    }

    // Get Gemini API key from Supabase secrets
    const geminiApiKey = Deno.env.get('GEMINI_API_KEY')
    if (!geminiApiKey) {
      return new Response(
        JSON.stringify({ error: 'Gemini API key not configured in Supabase secrets' }),
        { status: 500, headers: { 'Content-Type': 'application/json' } }
      )
    }
    
    // Get the user's access token from the Authorization header
    const authHeader = req.headers.get('Authorization')
    if (!authHeader) {
      return new Response(
        JSON.stringify({ error: 'Authorization required' }),
        { status: 401, headers: { 'Content-Type': 'application/json' } }
      )
    }

    // Create Supabase client with user's token
    const supabase = createClient(supabaseUrl, supabaseAnonKey, {
      global: {
        headers: {
          Authorization: authHeader,
        },
      },
    })

    // Download the audio file from Supabase Storage
    console.log('Attempting to download file:', filePath)
    const { data: audioBlob, error: downloadError } = await supabase.storage
      .from('voice-notes')
      .download(filePath)

    if (downloadError) {
      console.error('Storage download error:', downloadError)
      // Properly serialize the error object
      const errorMessage = downloadError.message || 
                          downloadError.error || 
                          JSON.stringify(downloadError) || 
                          'Unknown storage error'
      return new Response(
        JSON.stringify({ 
          error: `Failed to download audio file: ${errorMessage}`,
          details: {
            filePath,
            error: downloadError
          }
        }),
        { status: 400, headers: { 'Content-Type': 'application/json' } }
      )
    }

    if (!audioBlob) {
      console.error('Audio blob is null for file:', filePath)
      return new Response(
        JSON.stringify({ 
          error: 'Audio file not found',
          details: { filePath }
        }),
        { status: 404, headers: { 'Content-Type': 'application/json' } }
      )
    }
    
    console.log('Successfully downloaded audio file, size:', audioBlob.size)
    const audioArrayBuffer = await audioBlob.arrayBuffer()
    const audioBase64 = btoa(String.fromCharCode(...new Uint8Array(audioArrayBuffer)))

    // Determine MIME type
    const mimeType = audioBlob.type || 'audio/webm'

    // Call Gemini API for transcription
    // Try multiple models in order of preference
    const models = [
      'gemini-1.5-pro-latest',
      'gemini-1.5-pro',
      'gemini-2.0-flash-exp',
      'gemini-pro'
    ]
    
    let geminiResponse: Response | null = null
    let lastError: string = ''
    
    for (const model of models) {
      try {
        geminiResponse = await fetch(
          `https://generativelanguage.googleapis.com/v1beta/models/${model}:generateContent?key=${geminiApiKey}`,
          {
            method: 'POST',
            headers: {
              'Content-Type': 'application/json',
            },
            body: JSON.stringify({
              contents: [{
                parts: [{
                  text: 'Please transcribe this audio file accurately. Return only the transcribed text without any additional commentary.'
                }, {
                  inline_data: {
                    mime_type: mimeType,
                    data: audioBase64
                  }
                }]
              }]
            }),
          }
        )

        if (geminiResponse.ok) {
          break // Success, exit loop
        } else {
          const errorText = await geminiResponse.text()
          lastError = errorText
          console.warn(`Model ${model} failed:`, errorText)
          geminiResponse = null
        }
      } catch (error) {
        lastError = error instanceof Error ? error.message : 'Unknown error'
        console.warn(`Model ${model} error:`, lastError)
        geminiResponse = null
      }
    }

    if (!geminiResponse || !geminiResponse.ok) {
      let errorMessage = 'Failed to transcribe audio with any available model'
      try {
        const errorJson = JSON.parse(lastError)
        errorMessage = errorJson.error?.message || errorJson.error || errorMessage
      } catch {
        errorMessage = lastError || errorMessage
      }
      console.error('All Gemini models failed. Last error:', lastError)
      return new Response(
        JSON.stringify({ error: errorMessage }),
        { status: geminiResponse?.status || 500, headers: { 'Content-Type': 'application/json' } }
      )
    }

    const geminiData = await geminiResponse.json()
    const transcript = geminiData.candidates?.[0]?.content?.parts?.[0]?.text?.trim() || ''

    if (!transcript) {
      return new Response(
        JSON.stringify({ error: 'No transcript generated. The audio might be too short or unclear.' }),
        { status: 500, headers: { 'Content-Type': 'application/json' } }
      )
    }

    return new Response(
      JSON.stringify({ transcript }),
      { headers: { 'Content-Type': 'application/json' } }
    )
  } catch (error) {
    console.error('Transcription error:', error)
    const errorMessage = error instanceof Error ? error.message : 'Internal server error'
    return new Response(
      JSON.stringify({ error: errorMessage }),
      { status: 500, headers: { 'Content-Type': 'application/json' } }
    )
  }
})
