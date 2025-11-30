import { createClient } from '@/lib/supabase/client';

const BUCKET_NAME = 'ptt-documents';

export interface FileUploadResult {
  success: boolean;
  filePath?: string;
  publicUrl?: string;
  error?: string;
}

/**
 * Upload a file to Supabase Storage
 * @param file - The file to upload
 * @param pttId - The PTT ID for organizing files
 * @param documentType - Type of document (invoice, bill_of_lading, etc.)
 * @returns Upload result with file path and URL
 */
export async function uploadFile(
  file: File,
  pttId: string,
  documentType: string
): Promise<FileUploadResult> {
  try {
    const supabase = createClient();

    // Generate unique file name with timestamp
    const timestamp = Date.now();
    const fileExt = file.name.split('.').pop();
    const fileName = `${documentType}_${timestamp}.${fileExt}`;
    const filePath = `${pttId}/${fileName}`;

    // Upload file to storage
    const { data, error } = await supabase.storage
      .from(BUCKET_NAME)
      .upload(filePath, file, {
        cacheControl: '3600',
        upsert: false,
      });

    if (error) {
      console.error('Upload error:', error);
      return {
        success: false,
        error: error.message,
      };
    }

    // Get public URL (even though bucket is private, we'll use signed URLs later)
    const { data: urlData } = supabase.storage
      .from(BUCKET_NAME)
      .getPublicUrl(filePath);

    return {
      success: true,
      filePath: data.path,
      publicUrl: urlData.publicUrl,
    };
  } catch (error: any) {
    console.error('Upload exception:', error);
    return {
      success: false,
      error: error.message || 'Failed to upload file',
    };
  }
}

/**
 * Upload multiple files
 * @param files - Array of files to upload
 * @param pttId - The PTT ID
 * @param documentType - Type of document
 * @returns Array of upload results
 */
export async function uploadMultipleFiles(
  files: File[],
  pttId: string,
  documentType: string
): Promise<FileUploadResult[]> {
  const uploadPromises = files.map((file) =>
    uploadFile(file, pttId, documentType)
  );
  return Promise.all(uploadPromises);
}

/**
 * Get a signed URL for downloading a file (valid for 1 hour)
 * @param filePath - The file path in storage
 * @returns Signed URL
 */
export async function getSignedUrl(filePath: string): Promise<string | null> {
  try {
    const supabase = createClient();

    const { data, error } = await supabase.storage
      .from(BUCKET_NAME)
      .createSignedUrl(filePath, 3600); // Valid for 1 hour

    if (error) {
      console.error('Signed URL error:', error);
      return null;
    }

    return data.signedUrl;
  } catch (error) {
    console.error('Signed URL exception:', error);
    return null;
  }
}

/**
 * Delete a file from storage
 * @param filePath - The file path to delete
 * @returns Success status
 */
export async function deleteFile(filePath: string): Promise<boolean> {
  try {
    const supabase = createClient();

    const { error } = await supabase.storage
      .from(BUCKET_NAME)
      .remove([filePath]);

    if (error) {
      console.error('Delete error:', error);
      return false;
    }

    return true;
  } catch (error) {
    console.error('Delete exception:', error);
    return false;
  }
}

/**
 * List all files for a PTT
 * @param pttId - The PTT ID
 * @returns Array of file objects
 */
export async function listFilesForPTT(pttId: string) {
  try {
    const supabase = createClient();

    const { data, error } = await supabase.storage
      .from(BUCKET_NAME)
      .list(pttId);

    if (error) {
      console.error('List files error:', error);
      return [];
    }

    return data || [];
  } catch (error) {
    console.error('List files exception:', error);
    return [];
  }
}

/**
 * Download a file
 * @param filePath - The file path
 * @returns File blob
 */
export async function downloadFile(filePath: string): Promise<Blob | null> {
  try {
    const supabase = createClient();

    const { data, error } = await supabase.storage
      .from(BUCKET_NAME)
      .download(filePath);

    if (error) {
      console.error('Download error:', error);
      return null;
    }

    return data;
  } catch (error) {
    console.error('Download exception:', error);
    return null;
  }
}

/**
 * Validate file before upload
 * @param file - File to validate
 * @param maxSizeMB - Maximum file size in MB (default 10MB)
 * @returns Validation result
 */
export function validateFile(
  file: File,
  maxSizeMB: number = 10
): { valid: boolean; error?: string } {
  // Check file size
  const maxSizeBytes = maxSizeMB * 1024 * 1024;
  if (file.size > maxSizeBytes) {
    return {
      valid: false,
      error: `File size exceeds ${maxSizeMB}MB limit`,
    };
  }

  // Check file type - allow common document types
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
    return {
      valid: false,
      error: 'Invalid file type. Allowed: PDF, JPG, PNG, DOC, DOCX, XLS, XLSX',
    };
  }

  return { valid: true };
}
