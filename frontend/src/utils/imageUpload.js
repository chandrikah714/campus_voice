import axios from "axios";

const MAX_FILE_BYTES = 5 * 1024 * 1024; // 5MB
const ALLOWED_TYPES = ["image/jpeg", "image/png", "image/webp"];

export function validateImageFile(file) {
  if (!file) return "No file selected.";
  if (!ALLOWED_TYPES.includes(file.type)) return "Please choose a JPG, PNG, or WebP image.";
  if (file.size > MAX_FILE_BYTES) return "Image must be under 5MB.";
  return null;
}

/**
 * Crops the center square out of an image file and returns a new Blob.
 * Used for profile photos so a circular display (border-radius: 50%) always
 * looks right regardless of the source image's aspect ratio, without
 * needing a full drag-to-position cropping UI.
 */
export function cropToCenterSquare(file) {
  return new Promise((resolve, reject) => {
    const img = new Image();
    const url = URL.createObjectURL(file);
    img.onload = () => {
      const size = Math.min(img.width, img.height);
      const canvas = document.createElement("canvas");
      canvas.width = size;
      canvas.height = size;
      const ctx = canvas.getContext("2d");
      ctx.drawImage(
        img,
        (img.width - size) / 2,
        (img.height - size) / 2,
        size,
        size,
        0,
        0,
        size,
        size
      );
      canvas.toBlob(
        (blob) => {
          URL.revokeObjectURL(url);
          blob ? resolve(blob) : reject(new Error("Could not process image."));
        },
        file.type,
        0.92
      );
    };
    img.onerror = () => {
      URL.revokeObjectURL(url);
      reject(new Error("Could not read that image."));
    };
    img.src = url;
  });
}

export async function uploadToCloudinary(fileOrBlob) {
  const cloudName = import.meta.env.VITE_CLOUDINARY_CLOUD_NAME;
  const uploadPreset = import.meta.env.VITE_CLOUDINARY_UPLOAD_PRESET;
  if (!cloudName || !uploadPreset) {
    throw new Error(
      "Image uploads aren't configured yet — add VITE_CLOUDINARY_CLOUD_NAME and VITE_CLOUDINARY_UPLOAD_PRESET to .env."
    );
  }
  const formData = new FormData();
  formData.append("file", fileOrBlob);
  formData.append("upload_preset", uploadPreset);
  const response = await axios.post(
    `https://api.cloudinary.com/v1_1/${cloudName}/image/upload`,
    formData
  );
  return response.data.secure_url;
}
