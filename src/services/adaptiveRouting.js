function round2(n) {
  return Math.round(n * 100) / 100;
}

const COST = {
  preprocessCloudinary: 0.002,
  deartifactDenoiseDeblurCloudinary: 0.008,
  upscaleCloudinary: 0.012,
  hdrColorCloudinary: 0.01,
  faceEnhanceCloudinary: 0.009,
  naturalnessSharpenCloudinary: 0.006,
  deliveryCloudinary: 0.003,
};

function estimateCost(recipe) {
  let total = 0;
  if (recipe.steps.preprocess) total += COST.preprocessCloudinary;
  if (recipe.steps.deartifactDenoiseDeblur) total += COST.deartifactDenoiseDeblurCloudinary;
  if (recipe.steps.upscale) total += COST.upscaleCloudinary;
  if (recipe.steps.hdrToneColor) total += COST.hdrColorCloudinary;
  if (recipe.steps.faceEnhance) total += COST.faceEnhanceCloudinary;
  if (recipe.steps.naturalnessSharpen) total += COST.naturalnessSharpenCloudinary;
  if (recipe.steps.delivery) total += COST.deliveryCloudinary;
  return round2(total);
}

export function buildAdaptiveRecipe(scores, { maxCostPerImageUsd }) {
  const recipe = {
    steps: {
      preprocess: true,
      deartifactDenoiseDeblur:
        scores.jpegArtifactScore > 0.35 ||
        scores.noiseScore > 0.3 ||
        scores.blurScore > 0.4,
      upscale: scores.upscaleRatio > 1.25,
      hdrToneColor:
        scores.exposureScore > 0.3 || scores.dynamicRangeScore < 0.25,
      faceEnhance:
        scores.facePresent &&
        scores.faceAreaRatio > 0.03 &&
        scores.faceBlurScore > 0.35,
      naturalnessSharpen: true,
      delivery: true,
    },
    params: {
      upscaleFactor: scores.upscaleRatio > 2 ? 2 : 1.5,
      sharpenStrength:
        scores.blurScore > 0.6 ? 0.28 : scores.blurScore > 0.4 ? 0.22 : 0.16,
      toneStrength: scores.exposureScore > 0.5 ? 0.35 : 0.2,
    },
  };

  let estimatedCost = estimateCost(recipe);

  if (estimatedCost > maxCostPerImageUsd) {
    recipe.steps.hdrToneColor = false;
    estimatedCost = estimateCost(recipe);
  }
  if (estimatedCost > maxCostPerImageUsd) {
    recipe.steps.faceEnhance = false;
    estimatedCost = estimateCost(recipe);
  }
  if (estimatedCost > maxCostPerImageUsd && recipe.params.upscaleFactor > 1.5) {
    recipe.params.upscaleFactor = 1.5;
    estimatedCost = estimateCost(recipe);
  }
  if (estimatedCost > maxCostPerImageUsd) {
    recipe.steps.deartifactDenoiseDeblur = false;
    estimatedCost = estimateCost(recipe);
  }

  return {
    recipe,
    estimatedCostUsd: estimatedCost,
  };
}
