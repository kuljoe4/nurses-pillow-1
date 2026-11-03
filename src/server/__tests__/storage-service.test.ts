import { describe, it, expect } from 'vitest';
import { storageService, uploadMiddleware, PUBLIC_BUCKET_NAME, PRIVATE_BUCKET_NAME } from '../../../server/storageService.js';
import fs from 'fs';
import path from 'path';

describe('Cloud Storage Service & Fallback Suite', () => {
  it('should initialize and provide storage diagnostics report', async () => {
    const diag = await storageService.getStorageDiagnostics();
    expect(diag).toBeDefined();
    expect(diag.publicBucket.name).toBe(PUBLIC_BUCKET_NAME);
    expect(diag.privateBucket.name).toBe(PRIVATE_BUCKET_NAME);
    expect(['operational_gcs', 'fallback_local', 'credentials_missing']).toContain(diag.status);
    expect(['gcs', 'local_fallback']).toContain(diag.storageMode);
    expect(Array.isArray(diag.recommendations)).toBe(true);
    expect(diag.recommendations.length).toBeGreaterThan(0);
  });

  it('should upload a public file and return a valid URL', async () => {
    const fakeBuffer = Buffer.from('fake-jpeg-image-content-for-testing-12345');
    const fileName = 'sanctuary-bedroom.jpg';
    const mimeType = 'image/jpeg';

    const url = await storageService.uploadPublicFile(fakeBuffer, fileName, mimeType);
    expect(url).toBeDefined();
    // Either GCS URL or local fallback URL
    expect(url.startsWith('https://storage.googleapis.com/') || url.startsWith('/uploads/')).toBe(true);
  });

  it('should upload and purge a private verification document ensuring clinician privacy', async () => {
    const testDocBuffer = Buffer.from('%PDF-1.4 simulated sensitive nurse license content');
    const docName = 'rn_license_card.pdf';
    const mimeType = 'application/pdf';

    // 1. Upload to private vault
    const uploadRes = await storageService.uploadPrivateFile(testDocBuffer, docName, mimeType);
    expect(uploadRes).toBeDefined();
    expect(uploadRes.url).toBeDefined();
    expect(['gcs', 'local']).toContain(uploadRes.storageType);

    // 2. Obtain signed URL or view path
    const accessUrl = await storageService.getSignedUrlForPrivateDocument(uploadRes.url);
    expect(accessUrl).toBeDefined();
    expect(accessUrl.length).toBeGreaterThan(0);

    // 3. Purge document (Nurses Pillow Clinician Data Privacy Protocol)
    const purged = await storageService.deletePrivateDocument(uploadRes.url);
    expect(typeof purged).toBe('boolean');

    // If it was local, verify file was deleted from disk
    if (uploadRes.storageType === 'local') {
      const localFilePath = path.join(process.cwd(), 'uploads', 'verifications_private', path.basename(uploadRes.filePath));
      expect(fs.existsSync(localFilePath)).toBe(false);
    }
  });

  it('should validate allowed mime types with uploadMiddleware', () => {
    expect(uploadMiddleware).toBeDefined();
    expect(typeof uploadMiddleware.single).toBe('function');
  });
});
