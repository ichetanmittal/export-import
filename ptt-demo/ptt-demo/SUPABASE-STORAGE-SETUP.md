# Supabase Storage Setup Guide

This guide walks you through setting up Supabase Storage for file uploads in the PTT Demo application.

## Prerequisites

- A Supabase project already created
- Database tables already set up (from `database-schema.sql`)
- Admin access to your Supabase project

---

## Step 1: Create Storage Bucket

### Option A: Using Supabase Dashboard (Recommended)

1. Go to your Supabase project dashboard
2. Navigate to **Storage** in the left sidebar
3. Click **New bucket**
4. Configure the bucket:
   - **Name:** `trade-documents`
   - **Public bucket:** ❌ **UNCHECKED** (Keep private)
   - **File size limit:** 10 MB (or as desired)
   - **Allowed MIME types:** Leave empty or specify: `application/pdf, image/jpeg, image/png, application/msword, application/vnd.openxmlformats-officedocument.wordprocessingml.document`
5. Click **Create bucket**

### Option B: Using SQL Editor

1. Go to **SQL Editor** in your Supabase dashboard
2. Run the SQL from `database-storage-setup.sql`:

```sql
INSERT INTO storage.buckets (id, name, public)
VALUES ('trade-documents', 'trade-documents', false)
ON CONFLICT (id) DO NOTHING;
```

---

## Step 2: Set Up Storage Policies

### Using SQL Editor

1. Go to **SQL Editor** in your Supabase dashboard
2. Create a new query
3. Paste and run the following policies:

```sql
-- Allow authenticated users to upload files
CREATE POLICY "Allow authenticated uploads"
ON storage.objects FOR INSERT
TO authenticated
WITH CHECK (bucket_id = 'trade-documents');

-- Allow authenticated users to read files
CREATE POLICY "Allow authenticated reads"
ON storage.objects FOR SELECT
TO authenticated
USING (bucket_id = 'trade-documents');

-- Allow users to update their files
CREATE POLICY "Allow authenticated updates"
ON storage.objects FOR UPDATE
TO authenticated
USING (bucket_id = 'trade-documents');

-- Allow users to delete their files
CREATE POLICY "Allow authenticated deletes"
ON storage.objects FOR DELETE
TO authenticated
USING (bucket_id = 'trade-documents');
```

### Alternative: Using Dashboard

1. Navigate to **Storage** → **Policies**
2. Select the `trade-documents` bucket
3. Click **New Policy**
4. For each operation (SELECT, INSERT, UPDATE, DELETE):
   - **Policy name:** Descriptive name (e.g., "Allow authenticated uploads")
   - **Allowed operation:** SELECT / INSERT / UPDATE / DELETE
   - **Target roles:** `authenticated`
   - **USING expression:** `bucket_id = 'trade-documents'`
   - **WITH CHECK expression (for INSERT):** `bucket_id = 'trade-documents'`

---

## Step 3: Verify Setup

### Check Bucket Creation

1. Go to **Storage** in your Supabase dashboard
2. You should see `trade-documents` bucket listed
3. Click on it to verify it's private (not public)

### Check Policies

1. Go to **Storage** → **Policies**
2. Select `trade-documents` bucket
3. Verify you see 4 policies:
   - ✅ INSERT policy for authenticated users
   - ✅ SELECT policy for authenticated users
   - ✅ UPDATE policy for authenticated users
   - ✅ DELETE policy for authenticated users

---

## Step 4: Test File Upload (Optional)

### Using Supabase Dashboard

1. Go to **Storage** → `trade-documents` bucket
2. Click **Upload file**
3. Select any test file (PDF, image, etc.)
4. Click **Upload**
5. If successful, you should see the file listed
6. Delete the test file

### Using Application

1. Start your Next.js dev server: `npm run dev`
2. Login as **Exporter**: `exporter@asia.com / password123`
3. Make sure you have a transferred PTT (if not, complete the transfer flow first)
4. Go to **Upload Documents** page
5. Select a PTT, document type, and file
6. Click **Upload Document**
7. You should see success message and the file listed

---

## Step 5: Update Environment Variables

Ensure your `.env.local` file has the correct Supabase credentials:

```env
NEXT_PUBLIC_SUPABASE_URL=https://your-project.supabase.co
NEXT_PUBLIC_SUPABASE_ANON_KEY=your-anon-key-here
```

**Note:** The anon key is safe to use in the browser for authenticated operations.

---

## File Upload Flow in the Application

### 1. Exporter Uploads Document

**Page:** `/exporter/upload-documents`

**Flow:**
1. Exporter selects a transferred PTT
2. Chooses document type (Commercial Invoice, Bill of Lading, etc.)
3. Selects file from computer (max 10MB)
4. Clicks "Upload Document"
5. File is uploaded to Supabase Storage at path: `{ptt_id}/{document_type}_{timestamp}.{ext}`
6. Document record is saved to database with file path
7. Success message displayed

### 2. Importer Reviews Documents

**Page:** `/importer/review-documents`

**Flow:**
1. Importer sees list of PTTs with transferred status
2. Clicks "View Docs" to see uploaded documents
3. Modal opens showing all documents for that PTT
4. Each document shows:
   - File name
   - Document type
   - File size
   - Upload date
   - Approval status
   - **Download button** (generates signed URL)
5. Importer can download files to review
6. Clicks "Approve All Documents" to mark PTT as redeemable

---

## Storage Structure

Files are organized in Supabase Storage as follows:

```
trade-documents/
├── {ptt_id_1}/
│   ├── commercial_invoice_1234567890.pdf
│   ├── bill_of_lading_1234567891.pdf
│   └── packing_list_1234567892.pdf
├── {ptt_id_2}/
│   ├── commercial_invoice_1234567893.pdf
│   └── certificate_of_origin_1234567894.pdf
└── ...
```

Each PTT gets its own folder for organization.

---

## File Type Restrictions

The application only accepts the following file types:

- **PDF:** `.pdf`
- **Images:** `.jpg`, `.jpeg`, `.png`
- **Word:** `.doc`, `.docx`
- **Excel:** `.xls`, `.xlsx`

**Maximum file size:** 10 MB

---

## Security Considerations

### Current Setup (Development)

- ✅ Bucket is **private** (not publicly accessible)
- ✅ Only authenticated users can upload/download
- ✅ Files are accessed via **signed URLs** (1-hour expiry)
- ⚠️ Any authenticated user can access any file

### Production Recommendations

For production, you should implement stricter policies:

```sql
-- Only allow users to access files for PTTs they own or are involved with
CREATE POLICY "Users can only access their PTT documents"
ON storage.objects FOR SELECT
TO authenticated
USING (
  bucket_id = 'trade-documents'
  AND (
    -- Check if user owns the PTT or is the exporter
    auth.uid()::text IN (
      SELECT owner_id FROM ptt_tokens WHERE id::text = (storage.foldername(name))[1]
      UNION
      SELECT current_owner_id FROM ptt_tokens WHERE id::text = (storage.foldername(name))[1]
      UNION
      SELECT original_importer_id FROM ptt_tokens WHERE id::text = (storage.foldername(name))[1]
    )
  )
);
```

**Note:** This requires integrating Supabase Auth with your JWT authentication system.

---

## Troubleshooting

### Upload Fails with "Storage bucket not found"

**Solution:**
- Verify bucket exists in Supabase dashboard
- Check bucket name is exactly `trade-documents`
- Ensure environment variables are correct

### Upload Fails with "Permission denied"

**Solution:**
- Check storage policies are created correctly
- Verify user is authenticated (check localStorage for token)
- Make sure bucket is set to **private** (not public)

### Download Button Shows Error

**Solution:**
- Verify signed URL generation is working
- Check file path is stored correctly in database
- Ensure file actually exists in storage bucket

### File Not Appearing After Upload

**Solution:**
- Check browser console for errors
- Verify API route `/api/documents/upload` is working
- Check database `documents` table for the record
- Verify Supabase Storage shows the file

---

## API Endpoints Related to File Upload

### Upload Document

```
POST /api/documents/upload
Content-Type: multipart/form-data

Body (FormData):
- file: File
- ptt_id: string
- uploaded_by_id: string
- document_type: string
```

### Get Documents for PTT

```
GET /api/documents?ptt_id={ptt_id}

Response:
{
  "documents": [
    {
      "id": "uuid",
      "document_type": "commercial_invoice",
      "file_name": "invoice.pdf",
      "file_path": "ptt_id/commercial_invoice_123.pdf",
      "file_size_kb": 245,
      "approval_status": "pending",
      "created_at": "2025-11-30T..."
    }
  ]
}
```

---

## Complete Testing Checklist

- [ ] Supabase bucket `trade-documents` created
- [ ] Bucket is set to **private** (not public)
- [ ] All 4 storage policies created (INSERT, SELECT, UPDATE, DELETE)
- [ ] Environment variables configured correctly
- [ ] Can login as exporter
- [ ] Can see transferred PTTs in upload page
- [ ] Can select file and upload successfully
- [ ] File appears in uploaded documents list
- [ ] Can login as importer
- [ ] Can see PTTs in review documents page
- [ ] Can click "View Docs" and see uploaded files
- [ ] Can click "Download" and file opens in new tab
- [ ] Can approve documents and PTT status changes to "redeemable"

---

## Quick Start Commands

```bash
# 1. Ensure dependencies are installed
npm install

# 2. Set up environment variables
# Create .env.local with your Supabase credentials

# 3. Run the storage setup SQL
# Copy contents of database-storage-setup.sql
# Paste in Supabase SQL Editor and run

# 4. Start development server
npm run dev

# 5. Test upload flow
# Login as exporter → Upload Documents → Select file → Upload
# Login as importer → Review Documents → View Docs → Download
```

---

## Additional Resources

- [Supabase Storage Documentation](https://supabase.com/docs/guides/storage)
- [Storage Policies Guide](https://supabase.com/docs/guides/storage/security/access-control)
- [Signed URLs Documentation](https://supabase.com/docs/guides/storage/serving/downloads)

---

**Last Updated:** 2025-11-30
**Version:** 1.0
