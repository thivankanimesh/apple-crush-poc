import { config } from "../config.js";
import { buildAdaptiveRecipe } from "./adaptiveRouting.js";
import { scoreImageFromUrl } from "./qualityScoring.js";
import {
  deliverWithCloudinary,
  preprocessWithCloudinary,
} from "../providers/cloudinaryProvider.js";
import {
  deartifactDenoiseDeblurFal,
  naturalnessSharpenFal,
  upscaleFal,
} from "../providers/falProvider.js";
import { hdrToneColorStability } from "../providers/stabilityProvider.js";
import { faceEnhanceReplicateCodeFormer } from "../providers/replicateProvider.js";

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
      "deartifact_denoise_deblur_fal",
      deartifactDenoiseDeblurFal,
      workingUrl,
      steps,
    );
  }
  if (recipe.steps.upscale) {
    workingUrl = await runStep(
      "upscale_fal",
      (url) => upscaleFal(url, recipe.params.upscaleFactor),
      workingUrl,
      steps,
    );
  }
  if (recipe.steps.hdrToneColor) {
    workingUrl = await runStep(
      "hdr_tone_color_stability",
      (url) => hdrToneColorStability(url, recipe.params.toneStrength),
      workingUrl,
      steps,
    );
  }
  if (recipe.steps.faceEnhance) {
    workingUrl = await runStep(
      "face_enhance_replicate_codeformer",
      faceEnhanceReplicateCodeFormer,
      workingUrl,
      steps,
    );
  }
  if (recipe.steps.naturalnessSharpen) {
    workingUrl = await runStep(
      "naturalness_sharpen_fal",
      (url) => naturalnessSharpenFal(url, recipe.params.sharpenStrength),
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
