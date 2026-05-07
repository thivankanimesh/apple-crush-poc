import { config } from "../config.js";
import { http } from "../utils/http.js";

export async function faceEnhanceReplicateCodeFormer(imageUrl) {
  if (!config.replicate.apiKey || !config.replicate.codeformerVersion) {
    return {
      outputUrl: imageUrl,
      skipped: true,
      reason: "replicate_not_configured",
    };
  }

  const url = `${config.replicate.baseUrl}/predictions`;
  const { data } = await http.post(
    url,
    {
      version: config.replicate.codeformerVersion,
      input: {
        image: imageUrl,
        fidelity: 0.8,
      },
    },
    {
      headers: {
        Authorization: `Token ${config.replicate.apiKey}`,
        "Content-Type": "application/json",
      },
    },
  );

  const outputUrl = data?.output?.[0] ?? data?.output ?? imageUrl;
  return { outputUrl, providerResponse: data };
}
