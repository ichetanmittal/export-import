import { NextRequest, NextResponse } from 'next/server';
import { uploadDocument } from '@/lib/db/documents';
import { createClient as createSupabaseClient } from '@supabase/supabase-js';

const BUCKET_NAME = 'ptt-documents';
const MAX_FILE_SIZE = 10 * 1024 * 1024; // 10MB

export async function POST(request: NextRequest) {
  try {
    // Use service role key for server-side storage operations (bypasses RLS)
    const supabase = createSupabaseClient(
      process.env.NEXT_PUBLIC_SUPABASE_URL!,
      process.env.SUPABASE_SERVICE_ROLE_KEY || process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!,
      {
        auth: {
          autoRefreshToken: false,
          persistSession: false
        }
      }
    );

    // Parse form data
    const formData = await request.formData();
    const file = formData.get('file') as File;
    const ptt_id = formData.get('ptt_id') as string;
    const uploaded_by_id = formData.get('uploaded_by_id') as string;
    const document_type = formData.get('document_type') as string;

    if (!file || !ptt_id || !uploaded_by_id || !document_type) {
      return NextResponse.json(
        { error: 'File, PTT ID, uploader ID, and document type are required' },
        { status: 400 }
      );
    }

    // Validate file size
    if (file.size > MAX_FILE_SIZE) {
      return NextResponse.json(
        { error: 'File size exceeds 10MB limit' },
        { status: 400 }
      );
    }

    // Validate file type
    const allowedTypes = [
      'application/pdf',
      'image/jpeg',
      'image/jpg',
      'image/png',
      'application/msword',
      'application/vnd.openxmlformats-officedocument.wordprocessingml.document',
      'application/vnd.ms-excel',
      'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet',
    ];

    if (!allowedTypes.includes(file.type)) {
      return NextResponse.json(
        { error: 'Invalid file type. Allowed: PDF, JPG, PNG, DOC, DOCX, XLS, XLSX' },
        { status: 400 }
      );
    }

    // Generate unique file name
    const timestamp = Date.now();
    const fileExt = file.name.split('.').pop();
    const fileName = `${document_type}_${timestamp}.${fileExt}`;
    const filePath = `${ptt_id}/${fileName}`;

    // Upload to Supabase Storage
    const { data: uploadData, error: uploadError } = await supabase.storage
      .from(BUCKET_NAME)
      .upload(filePath, file, {
        cacheControl: '3600',
        upsert: false,
      });

    if (uploadError) {
      console.error('Storage upload error:', uploadError);
      return NextResponse.json(
        { error: uploadError.message || 'Failed to upload file to storage' },
        { status: 500 }
      );
    }

    // Save document record to database
    const document = await uploadDocument({
      ptt_id,
      uploaded_by_id,
      document_type: document_type as any,
      file_path: uploadData.path,
      file_name: file.name,
      file_size_kb: Math.round(file.size / 1024),
    });

    return NextResponse.json({
      data: document,
      message: 'Document uploaded successfully',
    }, { status: 201 });
  } catch (error: any) {
    console.error('Document upload error:', error);
    return NextResponse.json(
      { error: error.message || 'Failed to upload document' },
      { status: 500 }
    );
  }
}
