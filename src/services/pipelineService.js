import { config } from "../config.js";
import { buildAdaptiveRecipe } from "./adaptiveRouting.js";
import { scoreImageFromUrl } from "./qualityScoring.js";
import {
  deartifactDenoiseDeblurWithCloudinary,
  deliverWithCloudinary,
  faceEnhanceWithCloudinary,
  hdrToneColorWithCloudinary,
  naturalnessSharpenWithCloudinary,
  preprocessWithCloudinary,
  upscaleWithCloudinary,
} from "../providers/cloudinaryProvider.js";

async function runStep(stepName, fn, currentUrl, stepsLog) {
  const startedAt = Date.now();
  const result = await fn(currentUrl);
  const endedAt = Date.now();
  stepsLog.push({
    step: stepName,
    inputUrl: currentUrl,
    outputUrl: result.outputUrl ?? currentUrl,
    durationMs: endedAt - startedAt,
    skipped: Boolean(result.skipped),
    reason: result.reason ?? null,
  });
  return result.outputUrl ?? currentUrl;
}

export async function runPipeline({
  imageUrl,
  targetLongEdge = config.routing.defaultTargetLongEdge,
  dryRun = false,
}) {
  const quality = await scoreImageFromUrl(imageUrl, { targetLongEdge });
  const { recipe, estimatedCostUsd } = buildAdaptiveRecipe(quality.scores, {
    maxCostPerImageUsd: config.routing.maxCostPerImageUsd,
  });

  if (dryRun) {
    return {
      inputUrl: imageUrl,
      quality,
      recipe,
      estimatedCostUsd,
      finalImageUrl: imageUrl,
      steps: [],
    };
  }

  const steps = [];
  let workingUrl = imageUrl;

  if (recipe.steps.preprocess) {
    workingUrl = await runStep(
      "preprocess_cloudinary",
      preprocessWithCloudinary,
      workingUrl,
      steps,
    );
  }
  if (recipe.steps.deartifactDenoiseDeblur) {
    workingUrl = await runStep(
      "deartifact_denoise_deblur_cloudinary",
      deartifactDenoiseDeblurWithCloudinary,
      workingUrl,
      steps,
    );
  }
  if (recipe.steps.upscale) {
    workingUrl = await runStep(
      "upscale_cloudinary",
      (url) => upscaleWithCloudinary(url, recipe.params.upscaleFactor),
      workingUrl,
      steps,
    );
  }
  if (recipe.steps.hdrToneColor) {
    workingUrl = await runStep(
      "hdr_tone_color_cloudinary",
      (url) => hdrToneColorWithCloudinary(url, recipe.params.toneStrength),
      workingUrl,
      steps,
    );
  }
  if (recipe.steps.faceEnhance) {
    workingUrl = await runStep(
      "face_enhance_cloudinary",
      faceEnhanceWithCloudinary,
      workingUrl,
      steps,
    );
  }
  if (recipe.steps.naturalnessSharpen) {
    workingUrl = await runStep(
      "naturalness_sharpen_cloudinary",
      (url) => naturalnessSharpenWithCloudinary(url, recipe.params.sharpenStrength),
      workingUrl,
      steps,
    );
  }
  if (recipe.steps.delivery) {
    workingUrl = await runStep(
      "delivery_cloudinary",
      deliverWithCloudinary,
      workingUrl,
      steps,
    );
  }

  return {
    inputUrl: imageUrl,
    quality,
    recipe,
    estimatedCostUsd,
    finalImageUrl: workingUrl,
    steps,
  };
}
