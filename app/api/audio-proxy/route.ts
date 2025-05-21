import { NextResponse } from 'next/server';

// This API route serves as a proxy for audio files that browsers have trouble with directly
export async function GET(request: Request) {
  try {
    const url = new URL(request.url);
    const audioUrl = url.searchParams.get('url');
    
    if (!audioUrl) {
      return new NextResponse('Audio URL is required', { status: 400 });
    }
    
    // Fetch the audio file from the source URL (typically Supabase storage)
    const response = await fetch(audioUrl, {
      headers: {
        'Accept': '*/*',
      },
    });
    
    if (!response.ok) {
      return new NextResponse(`Failed to fetch audio: ${response.statusText}`, { 
        status: response.status 
      });
    }
    
    // Get audio content as array buffer
    const audioData = await response.arrayBuffer();
    
    // Determine the content type based on the file extension
    let contentType = 'audio/mpeg'; // Default to MP3
    if (audioUrl.toLowerCase().endsWith('.wav')) {
      contentType = 'audio/wav';
    } else if (audioUrl.toLowerCase().endsWith('.ogg')) {
      contentType = 'audio/ogg';
    }
    
    // Create a new response with the audio data and proper headers
    return new NextResponse(audioData, {
      headers: {
        'Content-Type': contentType,
        'Content-Length': audioData.byteLength.toString(),
        'Cache-Control': 'public, max-age=31536000', // Cache for 1 year
        'Accept-Ranges': 'bytes',
        'Access-Control-Allow-Origin': '*', // Enable CORS
      },
    });
    
  } catch (error) {
    console.error('Audio proxy error:', error);
    return new NextResponse(`Audio proxy error: ${error instanceof Error ? error.message : 'Unknown error'}`, { 
      status: 500 
    });
  }
} 