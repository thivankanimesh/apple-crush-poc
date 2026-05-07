import sharp from "sharp";
import { downloadImageBuffer } from "../utils/http.js";

function clamp01(v) {
  if (Number.isNaN(v)) return 0;
  if (v < 0) return 0;
  if (v > 1) return 1;
  return v;
}

function variance(values) {
  if (values.length === 0) return 0;
  const mean = values.reduce((a, b) => a + b, 0) / values.length;
  const sq = values.reduce((a, b) => a + (b - mean) ** 2, 0) / values.length;
  return sq;
}

function laplacianApprox(gray, width, height) {
  const vals = [];
  for (let y = 1; y < height - 1; y += 1) {
    for (let x = 1; x < width - 1; x += 1) {
      const i = y * width + x;
      const center = gray[i];
      const top = gray[i - width];
      const bottom = gray[i + width];
      const left = gray[i - 1];
      const right = gray[i + 1];
      const lap = top + bottom + left + right - 4 * center;
      vals.push(lap);
    }
  }
  return variance(vals);
}

function blockinessScore(gray, width, height) {
  let boundaryDiff = 0;
  let nonBoundaryDiff = 0;
  let boundaryCount = 0;
  let nonBoundaryCount = 0;

  for (let y = 0; y < height; y += 1) {
    for (let x = 1; x < width; x += 1) {
      const diff = Math.abs(gray[y * width + x] - gray[y * width + x - 1]);
      const isBoundary = x % 8 === 0;
      if (isBoundary) {
        boundaryDiff += diff;
        boundaryCount += 1;
      } else {
        nonBoundaryDiff += diff;
        nonBoundaryCount += 1;
      }
    }
  }

  const bAvg = boundaryCount ? boundaryDiff / boundaryCount : 0;
  const nAvg = nonBoundaryCount ? nonBoundaryDiff / nonBoundaryCount : 1;
  return clamp01((bAvg - nAvg) / 40);
}

export async function scoreImageFromUrl(imageUrl, { targetLongEdge }) {
  const buffer = await downloadImageBuffer(imageUrl);
  const img = sharp(buffer, { failOn: "none" });
  const metadata = await img.metadata();
  const stats = await img.stats();

  const width = metadata.width ?? 0;
  const height = metadata.height ?? 0;
  const longEdge = Math.max(width, height) || 1;
  const upscaleRatio = targetLongEdge / longEdge;

  const thumbWidth = Math.max(1, Math.min(width || 1, 512));
  const thumbHeight = Math.max(
    1,
    Math.round(((height || 1) / (width || 1)) * thumbWidth),
  );
  const grayBuffer = await img
    .resize({
      width: thumbWidth,
      height: thumbHeight,
      fit: "fill",
      withoutEnlargement: true,
    })
    .greyscale()
    .raw()
    .toBuffer();
  const tw = thumbWidth;
  const th = thumbHeight;
  const lapVar = laplacianApprox(grayBuffer, tw, th);
  const blurScore = clamp01(1 - Math.min(lapVar / 800, 1));
  const jpegArtifactScore = blockinessScore(grayBuffer, tw, th);

  const ch = stats.channels;
  const rgb = ch.length >= 3 ? ch.slice(0, 3) : [ch[0], ch[0], ch[0]];
  const stdev = (rgb[0].stdev + rgb[1].stdev + rgb[2].stdev) / 3;
  const noiseScore = clamp01(stdev / 64);

  const overExposed = rgb.reduce((acc, c) => acc + (c.max > 245 ? 0.33 : 0), 0);
  const underExposed = rgb.reduce((acc, c) => acc + (c.min < 10 ? 0.33 : 0), 0);
  const exposureScore = clamp01(overExposed + underExposed);
  const dynamicRangeScore = clamp01((rgb[0].max - rgb[0].min) / 255);

  return {
    metadata: {
      width,
      height,
      format: metadata.format,
      hasAlpha: Boolean(metadata.hasAlpha),
    },
    scores: {
      blurScore,
      noiseScore,
      jpegArtifactScore,
      exposureScore,
      dynamicRangeScore,
      upscaleRatio,
      facePresent: false,
      faceAreaRatio: 0,
      faceBlurScore: 0,
    },
  };
}
