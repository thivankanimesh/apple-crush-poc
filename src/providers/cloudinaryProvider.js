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

export async function preprocessWithCloudinary(imageUrl) {
  if (!config.cloudinary.cloudName || !config.cloudinary.apiKey) {
    return { outputUrl: imageUrl, skipped: true, reason: "cloudinary_not_configured" };
  }

  const timestamp = Math.floor(Date.now() / 1000);
  const transformation = "c_limit,w_4096,q_auto,f_auto,fl_strip_profile";
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

export async function deliverWithCloudinary(imageUrl) {
  if (!config.cloudinary.cloudName) {
    return { outputUrl: imageUrl, skipped: true, reason: "cloudinary_not_configured" };
  }
  const encoded = encodeURIComponent(imageUrl);
  const outputUrl = `https://res.cloudinary.com/${config.cloudinary.cloudName}/image/fetch/f_auto,q_auto,dpr_auto/${encoded}`;
  return { outputUrl };
}
