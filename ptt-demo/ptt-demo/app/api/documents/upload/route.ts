import { NextRequest, NextResponse } from 'next/server';
import { uploadDocument } from '@/lib/db/documents';
import { writeFile } from 'fs/promises';
import path from 'path';

export async function POST(request: NextRequest) {
  try {
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

    // Convert file to buffer
    const bytes = await file.arrayBuffer();
    const buffer = Buffer.from(bytes);

    // Create uploads directory if it doesn't exist
    const uploadsDir = path.join(process.cwd(), 'public', 'uploads', 'documents');

    // Generate unique filename
    const timestamp = Date.now();
    const fileName = `${timestamp}-${file.name}`;
    const filePath = path.join(uploadsDir, fileName);
    const publicPath = `/uploads/documents/${fileName}`;

    // Save file
    await writeFile(filePath, buffer);

    // Save to database
    const document = await uploadDocument({
      ptt_id,
      uploaded_by_id,
      document_type: document_type as any,
      file_path: publicPath,
      file_name: file.name,
      file_size_kb: Math.round(file.size / 1024),
    });

    return NextResponse.json({
      data: document,
      message: 'Document uploaded successfully',
    }, { status: 201 });
  } catch (error) {
    console.error('Document upload error:', error);
    return NextResponse.json(
      { error: 'Failed to upload document' },
      { status: 500 }
    );
  }
}
