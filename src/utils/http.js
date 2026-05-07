import axios from "axios";

export const http = axios.create({
  timeout: 90_000,
});

export async function downloadImageBuffer(url) {
  const { data } = await http.get(url, { responseType: "arraybuffer" });
  return Buffer.from(data);
}
