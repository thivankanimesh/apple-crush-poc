import { config } from "../config.js";
import { http } from "../utils/http.js";

async function runFalModel(modelPath, input) {
  if (!config.fal.apiKey) {
    return { outputUrl: input.image_url, skipped: true, reason: "fal_not_configured" };
  }
  const url = `${config.fal.baseUrl}/${modelPath}`;
  const { data } = await http.post(url, input, {
    headers: {
      Authorization: `Key ${config.fal.apiKey}`,
      "Content-Type": "application/json",
    },
  });
  const image =
    data?.images?.[0]?.url ?? data?.image?.url ?? data?.output?.[0] ?? data?.output;
  return { outputUrl: image, providerResponse: data };
}

export async function deartifactDenoiseDeblurFal(imageUrl) {
  return runFalModel("fal-ai/imageutils/restore", {
    image_url: imageUrl,
    prompt: "Natural iPhone-like photo restoration. Avoid oversmoothing.",
  });
}

export async function upscaleFal(imageUrl, factor = 2) {
  return runFalModel("fal-ai/imageutils/upscale", {
    image_url: imageUrl,
    scale: factor,
  });
}

export async function naturalnessSharpenFal(imageUrl, sharpenStrength = 0.18) {
  return runFalModel("fal-ai/imageutils/enhance", {
    image_url: imageUrl,
    sharpen: sharpenStrength,
    preserve_skin_texture: true,
    natural_look: true,
  });
}
