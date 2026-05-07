import crypto from "crypto";
import { config } from "../config.js";
import { http } from "../utils/http.js";

function cloudinaryAuthSignature(params) {
  const sorted = Object.keys(params)
    .sort()
    .map((k) => `${k}=${params[k]}`)
    .join("&");
  return crypto
    .createHash("sha1")
    .update(`${sorted}${config.cloudinary.apiSecret}`)
    .digest("hex");
}

function uploadEndpoint() {
  return `https://api.cloudinary.com/v1_1/${config.cloudinary.cloudName}/image/upload`;
}

function requireCloudinary(imageUrl) {
  if (!config.cloudinary.cloudName || !config.cloudinary.apiKey) {
    return { outputUrl: imageUrl, skipped: true, reason: "cloudinary_not_configured" };
  }
  return null;
}

async function uploadWithTransformation(imageUrl, transformation) {
  const missing = requireCloudinary(imageUrl);
  if (missing) return missing;

  const timestamp = Math.floor(Date.now() / 1000);
  const params = {
    file: imageUrl,
    timestamp,
    transformation,
    upload_preset: config.cloudinary.uploadPreset || undefined,
  };
  const toSign = {};
  if (params.upload_preset) toSign.upload_preset = params.upload_preset;
  toSign.timestamp = timestamp;
  toSign.transformation = transformation;
  const signature = cloudinaryAuthSignature(toSign);

  const form = new URLSearchParams();
  Object.entries(params).forEach(([k, v]) => {
    if (v !== undefined) form.append(k, String(v));
  });
  form.append("api_key", config.cloudinary.apiKey);
  form.append("signature", signature);

  const { data } = await http.post(uploadEndpoint(), form, {
    headers: { "Content-Type": "application/x-www-form-urlencoded" },
  });

  return { outputUrl: data.secure_url, providerResponse: data };
}

export async function preprocessWithCloudinary(imageUrl) {
  return uploadWithTransformation(
    imageUrl,
    "c_limit,w_3000,h_3000,q_auto,f_auto,fl_strip_profile,e_improve:outdoor",
  );
}

export async function deartifactDenoiseDeblurWithCloudinary(imageUrl) {
  return uploadWithTransformation(
    imageUrl,
    "e_enhance,e_auto_brightness,e_auto_contrast,e_sharpen:50",
  );
}

export async function upscaleWithCloudinary(imageUrl, factor = 1.5) {
  const width = factor >= 2 ? 4096 : 3024;
  return uploadWithTransformation(
    imageUrl,
    `c_limit,w_${width},e_upscale,q_auto:best,f_auto`,
  );
}

export async function hdrToneColorWithCloudinary(imageUrl, toneStrength = 0.25) {
  const contrast = toneStrength > 0.3 ? 35 : 22;
  const saturation = toneStrength > 0.3 ? 18 : 10;
  return uploadWithTransformation(
    imageUrl,
    `e_hdr,e_auto_color,e_auto_brightness,e_contrast:${contrast},e_saturation:${saturation}`,
  );
}

export async function faceEnhanceWithCloudinary(imageUrl) {
  return uploadWithTransformation(
    imageUrl,
    "g_faces,c_thumb,w_2048,e_enhance,e_sharpen:30,c_limit,w_4096",
  );
}

export async function naturalnessSharpenWithCloudinary(
  imageUrl,
  sharpenStrength = 0.18,
) {
  const sharpen = Math.max(12, Math.min(45, Math.round(sharpenStrength * 100)));
  return uploadWithTransformation(
    imageUrl,
    `e_enhance,e_sharpen:${sharpen},e_saturation:6,e_auto_color`,
  );
}

export async function deliverWithCloudinary(imageUrl) {
  if (!config.cloudinary.cloudName) {
    return { outputUrl: imageUrl, skipped: true, reason: "cloudinary_not_configured" };
  }
  const encoded = encodeURIComponent(imageUrl);
  const outputUrl = `https://res.cloudinary.com/${config.cloudinary.cloudName}/image/fetch/f_auto,q_auto,dpr_auto/${encoded}`;
  return { outputUrl };
}
