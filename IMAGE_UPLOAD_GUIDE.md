# Campus Voice — Image Upload & Display: Implementation Guide

This app already implements image upload in two places — the Report Issue
photo attachment and the Account Settings profile picture. Both share one
underlying pattern (`src/utils/imageUpload.js`), so this guide documents
that pattern as a reusable recipe rather than two separate one-offs.

## The five steps

### 1. File selection
A plain HTML file input, scoped to image types at the browser level so the
OS file picker itself filters what's selectable:

```jsx
<input
  type="file"
  accept="image/jpeg,image/png,image/webp"
  onChange={(e) => handleFileChange(e.target.files[0])}
/>
```

`accept` is a UX hint, not a security boundary — a user can still bypass it
(drag-and-drop, renamed extension), so validation in step 2 is mandatory,
not optional.

### 2. Validation — type and size
Done immediately on selection, before any upload attempt, so bad files
fail fast with zero network cost:

```js
// src/utils/imageUpload.js
const MAX_FILE_BYTES = 5 * 1024 * 1024; // 5MB
const ALLOWED_TYPES = ["image/jpeg", "image/png", "image/webp"];

export function validateImageFile(file) {
  if (!file) return "No file selected.";
  if (!ALLOWED_TYPES.includes(file.type)) return "Please choose a JPG, PNG, or WebP image.";
  if (file.size > MAX_FILE_BYTES) return "Image must be under 5MB.";
  return null; // null = valid
}
```

Call it right in the change handler:

```js
const handleFileChange = (file) => {
  const validationError = validateImageFile(file);
  if (validationError) {
    setError(validationError);
    return;
  }
  setError("");
  setSelectedFile(file);
};
```

Checking `file.type` (the browser-reported MIME type) is a reasonable
client-side gate for a student project, but it's still just a header the
browser sends — a determined attacker can forge it. If this ever needs to
be hardened, real type-sniffing (checking the file's actual magic bytes)
has to happen server-side, e.g. in a Cloud Function.

### 3. Preview rendering
Two approaches are used depending on whether the image needs processing
first:

**Simple preview** (no processing needed) — `URL.createObjectURL` turns
the in-memory file into a displayable URL instantly, no upload required:

```js
const previewUrl = URL.createObjectURL(file);
// <img src={previewUrl} />
```

Remember to revoke it when done (`URL.revokeObjectURL(previewUrl)`) or the
browser holds that memory until the page unloads.

**Cropped preview** (profile pictures) — the app center-crops to a square
via canvas *before* generating the preview, so what you see is exactly
what gets uploaded:

```js
// src/utils/imageUpload.js
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
      ctx.drawImage(img, (img.width - size) / 2, (img.height - size) / 2, size, size, 0, 0, size, size);
      canvas.toBlob((blob) => {
        URL.revokeObjectURL(url);
        blob ? resolve(blob) : reject(new Error("Could not process image."));
      }, file.type, 0.92);
    };
    img.onerror = () => reject(new Error("Could not read that image."));
    img.src = url;
  });
}
```

### 4. Storage handling
Uploads go to Cloudinary (a hosted image CDN) rather than Firebase Storage
— this app was already using Cloudinary before this pattern was
formalized, so it stays consistent rather than mixing two storage
providers:

```js
// src/utils/imageUpload.js
export async function uploadToCloudinary(fileOrBlob) {
  const cloudName = import.meta.env.VITE_CLOUDINARY_CLOUD_NAME;
  const uploadPreset = import.meta.env.VITE_CLOUDINARY_UPLOAD_PRESET;
  if (!cloudName || !uploadPreset) {
    throw new Error("Image uploads aren't configured — add the Cloudinary env vars.");
  }
  const formData = new FormData();
  formData.append("file", fileOrBlob);
  formData.append("upload_preset", uploadPreset);
  const response = await axios.post(
    `https://api.cloudinary.com/v1_1/${cloudName}/image/upload`,
    formData
  );
  return response.data.secure_url; // save this URL to Firestore
}
```

Setup required once: create a Cloudinary account (free tier is plenty for
a student project), create an **unsigned** upload preset (Settings →
Upload → Add upload preset → Signing Mode: Unsigned), then set
`VITE_CLOUDINARY_CLOUD_NAME` and `VITE_CLOUDINARY_UPLOAD_PRESET` in
`.env`. Unsigned presets are appropriate here because the upload happens
directly from the browser with no backend in the loop — there's no secret
key exposed, only the public cloud name and preset name.

The returned `secure_url` is what actually gets stored — not the image
itself. Firestore holds a `photo: "https://res.cloudinary.com/..."` string
field on the user or complaint document; the actual bytes live on
Cloudinary's CDN.

### 5. Error handling
Three failure points, each handled distinctly:

```js
try {
  const url = await uploadToCloudinary(file);
  await updateDoc(doc(db, "users", uid), { photo: url });
  setSuccess("Photo updated.");
} catch (err) {
  // err.message is human-readable here on purpose — validateImageFile and
  // uploadToCloudinary's config-check both throw plain, displayable text
  // rather than raw error objects, so this can go straight to the UI.
  setError(err.message || "Something went wrong uploading that image.");
}
```

- **Unsupported format / too large** → caught in step 2, before any
  network call — cheapest and fastest failure path.
- **Upload fails** (network drop, Cloudinary misconfigured, quota) →
  caught in the `try/catch` around `uploadToCloudinary`.
- **Firestore write fails** after a successful upload → the image exists
  on Cloudinary but never got attached to the document. This is a real
  edge case worth knowing about: it doesn't corrupt anything (the orphaned
  image is harmless and just sits unused on Cloudinary), but the user sees
  a failure and needs to retry — the retry re-uploads rather than reusing
  the orphaned URL, which is simpler at the cost of an occasional unused
  file. Not worth solving for a project this size; flagging it in case
  storage costs ever matter enough to add cleanup.

## Where this is actually used

- `src/Components/pages/ReportIssue.jsx` — complaint photo, straightforward
  (no cropping, since it's illustrating an issue, not a portrait).
- `src/Components/pages/AccountSettings.jsx`'s `ProfilePictureCard` —
  profile picture, with the center-crop step and a circular CSS display
  (`border-radius: 50%`) on top of the square crop.

To add image upload somewhere new, import the three functions from
`src/utils/imageUpload.js` and follow steps 1–5 above — that's the entire
reusable surface.
