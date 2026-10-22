import { apiPost } from '../api';
import { getActiveSession, handleMemberSessionExpired } from '../dal/auth';
import { getActiveAdminSession } from '../dal/adminAuth';

export interface ProfilePhotoUploadResult {
  ok: boolean;
  fileUrl?: string;
  error?: string;
}

/**
 * Resize image so longest dimension is at most 320px and export as JPEG blob.
 */
function shrinkImageTo320Jpeg(file: File): Promise<Blob> {
  return new Promise((resolve, reject) => {
    if (!file.type.startsWith('image/')) {
      return reject(new Error('Selected file is not a valid image.'));
    }

    const reader = new FileReader();
    reader.onerror = () => reject(new Error('Failed to read image file.'));
    reader.onload = (event) => {
      const rawDataUrl = event.target?.result as string;
      if (!rawDataUrl) {
        return reject(new Error('Failed to read image content.'));
      }

      const img = new window.Image();
      img.onerror = () => reject(new Error('Failed to decode image data.'));
      img.onload = () => {
        const canvas = document.createElement('canvas');
        const maxDim = 320;
        let width = img.width;
        let height = img.height;

        if (width > height) {
          if (width > maxDim) {
            height = Math.round((height * maxDim) / width);
            width = maxDim;
          }
        } else {
          if (height > maxDim) {
            width = Math.round((width * maxDim) / height);
            height = maxDim;
          }
        }

        canvas.width = Math.max(1, width);
        canvas.height = Math.max(1, height);

        const ctx = canvas.getContext('2d');
        if (!ctx) {
          return reject(new Error('Canvas 2D context unavailable.'));
        }

        ctx.drawImage(img, 0, 0, canvas.width, canvas.height);

        canvas.toBlob(
          (blob) => {
            if (blob) {
              resolve(blob);
            } else {
              reject(new Error('Failed to compress image to JPEG.'));
            }
          },
          'image/jpeg',
          0.88
        );
      };
      img.src = rawDataUrl;
    };
    reader.readAsDataURL(file);
  });
}

/**
 * Upload an admin or member profile picture:
 * 1. Shrinks image to max 320px JPEG.
 * 2. Obtains presigned upload authorization for the public 'public-media' bucket.
 * 3. Uploads via HTTP PUT/POST directly to storage provider.
 * 4. Returns the permanent HTTPS public link.
 *
 * On 401 from step 2 (presigned URL): signs the member out and redirects to login.
 * On other failures: returns a specific message indicating which step failed.
 */
export async function uploadProfilePhoto(file: File): Promise<ProfilePhotoUploadResult> {
  try {
    const token = getActiveSession()?.token || getActiveAdminSession()?.token;
    if (!token) {
      return { ok: false, error: 'You must be logged in to upload a profile picture.' };
    }

    // Step 1 — Resize
    let jpegBlob: Blob;
    try {
      jpegBlob = await shrinkImageTo320Jpeg(file);
    } catch (err: any) {
      return { ok: false, error: `Could not prepare image for upload: ${err?.message || 'Unknown error.'}` };
    }
    const sizeKb = Math.max(1, Math.ceil(jpegBlob.size / 1024));

    // Step 2 — Request presigned upload URL for 'public-media' bucket
    const presignedRes = await apiPost<any>(
      '/storage/presigned-url',
      {
        bucket: 'public-media',
        fileName: 'profile_avatar.jpg',
        fileType: 'image/jpeg',
        fileSizeKb: sizeKb,
      },
      token
    );

    if (!presignedRes.ok || !presignedRes.data?.uploadUrl) {
      // 401 → session expired, sign out and redirect
      if (presignedRes.status === 401) {
        handleMemberSessionExpired();
        return { ok: false, error: 'Your session has expired. Please sign in again.' };
      }
      return {
        ok: false,
        error: `Could not get upload permission: ${presignedRes.error || presignedRes.message || 'Please try again.'}`,
      };
    }

    const { uploadUrl, fileUrl, method, fields, headers } = presignedRes.data;

    // Step 3 — Perform direct binary upload to storage provider
    let uploadOk = false;
    let uploadStatus = 0;
    try {
      if (method === 'POST' && fields) {
        const formData = new FormData();
        for (const [k, v] of Object.entries(fields)) {
          formData.append(k, v as string);
        }
        formData.append('file', jpegBlob, 'profile_avatar.jpg');

        const uploadRes = await fetch(uploadUrl, {
          method: 'POST',
          body: formData,
        });
        uploadOk = uploadRes.ok;
        uploadStatus = uploadRes.status;
      } else {
        const uploadRes = await fetch(uploadUrl, {
          method: 'PUT',
          headers: {
            'Content-Type': 'image/jpeg',
            ...(headers || {}),
          },
          body: jpegBlob,
        });
        uploadOk = uploadRes.ok;
        uploadStatus = uploadRes.status;
      }
    } catch (err: any) {
      return {
        ok: false,
        error: `Image upload failed: ${err?.message || 'Network error. Please check your connection.'}`,
      };
    }

    if (!uploadOk) {
      return {
        ok: false,
        error: `Image upload failed (status ${uploadStatus}). Please try again.`,
      };
    }

    // Step 4 — Return permanent HTTPS file link
    return {
      ok: true,
      fileUrl,
    };
  } catch (err: any) {
    return {
      ok: false,
      error: err?.message || 'Unexpected error while processing profile picture.',
    };
  }
}
