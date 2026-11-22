import type { MetadataRoute } from "next";
import { siteConfig } from "@/config/site";

export default function manifest(): MetadataRoute.Manifest {
  return {
    name: `${siteConfig.nameBn} — ${siteConfig.name}`,
    short_name: siteConfig.nameBn,
    description: siteConfig.description,
    lang: "bn",
    start_url: "/",
    display: "standalone",
    background_color: "#f8f5ee",
    theme_color: "#0c3b5a",
    icons: [{ src: "/icon.svg", sizes: "any", type: "image/svg+xml" }],
  };
}
