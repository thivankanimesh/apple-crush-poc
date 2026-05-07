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
  fal: {
    apiKey: mustGet("FAL_API_KEY"),
    baseUrl: mustGet("FAL_BASE_URL", "https://fal.run"),
  },
  stability: {
    apiKey: mustGet("STABILITY_API_KEY"),
    baseUrl: mustGet("STABILITY_BASE_URL", "https://api.stability.ai"),
  },
  replicate: {
    apiKey: mustGet("REPLICATE_API_TOKEN"),
    baseUrl: mustGet("REPLICATE_BASE_URL", "https://api.replicate.com/v1"),
    codeformerVersion: mustGet("REPLICATE_CODEFORMER_VERSION"),
  },
  routing: {
    maxCostPerImageUsd: Number(process.env.MAX_COST_PER_IMAGE_USD ?? 0.2),
    defaultTargetLongEdge: Number(process.env.DEFAULT_TARGET_LONG_EDGE ?? 3024),
  },
};
