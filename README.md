# iPhone-like Image Enhancement Pipeline

Implements this on-demand pipeline:

1. Quality Scoring + Adaptive Routing (custom)
2. Preprocess + Lens/Perspective Fix (Cloudinary)
3. Deartifact + Denoise + Deblur (fal.ai)
4. Upscale (Super Resolution) (fal.ai)
5. HDR + Tone Mapping + Color Correction (Stability AI API)
6. Face Enhancement when needed (Replicate CodeFormer)
7. Naturalness Guard + Mild Sharpen (fal.ai)
8. Compression + Delivery (Cloudinary)

## Setup

```bash
npm install
cp .env.example .env
```

Fill all API keys in `.env`.

## Run

```bash
npm run dev
```

### Health

`GET /health`

### Dry run (score + recipe + cost, no provider calls)

`POST /process/dry-run`

```json
{
  "imageUrl": "https://example.com/input.jpg",
  "targetLongEdge": 3024
}
```

### Full process

`POST /process`

```json
{
  "imageUrl": "https://example.com/input.jpg",
  "targetLongEdge": 3024
}
```

## Notes

- Routing is threshold-based and cost-capped using `MAX_COST_PER_IMAGE_USD`.
- Provider model paths can change over time; update model endpoints in provider files if needed.
- Face detection is currently placeholder (`facePresent=false`). Integrate MediaPipe/RetinaFace for production-level gating.
