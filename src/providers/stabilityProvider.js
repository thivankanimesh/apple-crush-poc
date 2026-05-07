import { config } from "../config.js";
import { http } from "../utils/http.js";

export async function hdrToneColorStability(imageUrl, toneStrength = 0.25) {
  if (!config.stability.apiKey) {
    return {
      outputUrl: imageUrl,
      skipped: true,
      reason: "stability_not_configured",
    };
  }

  const url = `${config.stability.baseUrl}/v2beta/stable-image/edit/style-transfer`;
  const { data } = await http.post(
    url,
    {
      image: imageUrl,
      style_preset: "photographic",
      prompt: "Balanced HDR tone mapping, natural colors, iPhone-like realism.",
      strength: toneStrength,
    },
    {
      headers: {
        Authorization: `Bearer ${config.stability.apiKey}`,
        "Content-Type": "application/json",
      },
    },
  );

  const outputUrl =
    data?.image?.url ?? data?.output?.[0] ?? data?.artifacts?.[0]?.url ?? imageUrl;
  return { outputUrl, providerResponse: data };
}
