import type { MetadataRoute } from "next";
import { sectionPages, siteConfig } from "@/config/site";

export default function sitemap(): MetadataRoute.Sitemap {
  return ["", ...Object.keys(sectionPages).map((s) => `/${s}`)].map((path) => ({
    url: `${siteConfig.url}${path}`,
    changeFrequency: path === "" ? "daily" : "weekly",
    priority: path === "" ? 1 : 0.7,
  }));
}
