import dotenv from "dotenv";

dotenv.config();

function mustGet(name, fallback = "") {
  return process.env[name] ?? fallback;
}

export const config = {
  port: Number(process.env.PORT ?? 3000),
  apiBaseUrl: mustGet("API_BASE_URL", "http://localhost:3000"),
  cloudinary: {
    cloudName: mustGet("CLOUDINARY_CLOUD_NAME"),
    apiKey: mustGet("CLOUDINARY_API_KEY"),
    apiSecret: mustGet("CLOUDINARY_API_SECRET"),
    uploadPreset: mustGet("CLOUDINARY_UPLOAD_PRESET"),
  },
  routing: {
    maxCostPerImageUsd: Number(process.env.MAX_COST_PER_IMAGE_USD ?? 0.2),
    defaultTargetLongEdge: Number(process.env.DEFAULT_TARGET_LONG_EDGE ?? 3024),
  },
};
