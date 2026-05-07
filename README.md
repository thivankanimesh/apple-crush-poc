# iPhone-like Image Enhancement Pipeline

Implements this on-demand pipeline:

1. Quality Scoring + Adaptive Routing (custom)
2. Preprocess + Lens/Perspective Fix (Cloudinary)
3. Deartifact + Denoise + Deblur (Cloudinary)
4. Upscale (Super Resolution) (Cloudinary)
5. HDR + Tone Mapping + Color Correction (Cloudinary)
6. Face Enhancement when needed (Cloudinary)
7. Naturalness Guard + Mild Sharpen (Cloudinary)
8. Compression + Delivery (Cloudinary)

## Setup

```bash
npm install
cp .env.example .env
```

Fill Cloudinary variables in `.env`.

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
- Face detection is currently placeholder (`facePresent=false`). Integrate MediaPipe/RetinaFace for production-level gating.
