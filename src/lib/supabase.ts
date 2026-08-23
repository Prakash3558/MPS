import { createClient } from '@supabase/supabase-js';

const SUPABASE_URL = (typeof import.meta !== 'undefined' && (import.meta as any).env?.VITE_SUPABASE_URL) || process.env.VITE_SUPABASE_URL || process.env.NEXT_PUBLIC_SUPABASE_URL || process.env.SUPABASE_URL || 'https://neakvyuddcftatlpabmf.supabase.co';
const SUPABASE_KEY = (typeof import.meta !== 'undefined' && (import.meta as any).env?.VITE_SUPABASE_ANON_KEY) || process.env.VITE_SUPABASE_PUBLISHABLE_KEY || process.env.NEXT_PUBLIC_SUPABASE_PUBLISHABLE_KEY || process.env.SUPABASE_ANON_KEY || 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6Im5lYWt2eXVkZGNmdGF0bHBhYm1mIiwicm9sZSI6ImFub24iLCJpYXQiOjE3ODY0ODQwOTUsImV4cCI6MjEwMjA2MDA5NX0.j8L635xo0JaHqIbmqnCRND1bTDu1A5AWHWL-q9TWjVU';

export const supabase = createClient(SUPABASE_URL, SUPABASE_KEY);

export async function uploadImageToSupabaseStorage(
  fileInput: File | Blob | string,
  category: string = 'general',
  filenameHint?: string
): Promise<string> {
  if (!fileInput) return '';

  // If already a non-base64 URL, return as-is
  if (typeof fileInput === 'string' && !fileInput.startsWith('data:')) {
    return fileInput;
  }

  try {
    const timestamp = Date.now();
    const cleanHint = (filenameHint || 'asset').replace(/[^a-z0-9_-]/gi, '_').substring(0, 20);

    let blobToUpload: Blob;
    let fileName = `${timestamp}_${cleanHint}.png`;

    if (typeof fileInput === 'string' && fileInput.startsWith('data:')) {
      const response = await fetch(fileInput);
      blobToUpload = await response.blob();
    } else if (fileInput instanceof File) {
      blobToUpload = fileInput;
      const cleanName = fileInput.name.replace(/[^a-z0-9._-]/gi, '_');
      fileName = `${timestamp}_${cleanName}`;
    } else if (fileInput instanceof Blob) {
      blobToUpload = fileInput;
    } else {
      return '';
    }

    const path = `uploads/${category}/${fileName}`;
    const { data, error } = await supabase.storage.from('school-uploads').upload(path, blobToUpload, {
      cacheControl: '3600',
      upsert: true
    });

    if (error) {
      console.info('[Supabase Storage note]:', error.message || error);
    } else if (data) {
      const { data: publicUrlData } = supabase.storage.from('school-uploads').getPublicUrl(data.path);
      if (publicUrlData?.publicUrl) {
        return publicUrlData.publicUrl;
      }
    }
  } catch (err) {
    console.info('[Supabase Storage note]: Upload falling back to server');
  }

  // Fallback to server /api/upload endpoint
  if (typeof fileInput === 'string') {
    try {
      const res = await fetch('/api/upload', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ fileData: fileInput, fileName: filenameHint })
      });
      if (res.ok) {
        const data = await res.json();
        if (data && data.url) return data.url;
      }
    } catch (e) {
      console.warn('File upload fallback failed:', e);
    }
  }

  return typeof fileInput === 'string' ? fileInput : '';
}

// Alias for backwards compatibility with any existing components
export const uploadImageToFirebaseStorage = uploadImageToSupabaseStorage;
