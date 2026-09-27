import { ImageResponse } from "next/og";
import { IconArt } from "@/lib/pwa/icon-art";

export function generateImageMetadata() {
  return [
    { id: "32", size: { width: 32, height: 32 }, contentType: "image/png" },
    { id: "192", size: { width: 192, height: 192 }, contentType: "image/png" },
    { id: "512", size: { width: 512, height: 512 }, contentType: "image/png" },
  ];
}

export default async function Icon({ id }: { id: Promise<string> | string }) {
  const size = Number(await id);
  return new ImageResponse(<IconArt size={size} padding={size <= 32 ? 0.04 : 0.2} />, { width: size, height: size });
}
