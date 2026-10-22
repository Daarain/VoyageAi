import type { MetadataRoute } from "next";

export default function sitemap(): MetadataRoute.Sitemap {
  return [
    { url: "https://voyageai.pro", lastModified: new Date() },
    { url: "https://voyageai.pro/login", lastModified: new Date() },
    { url: "https://voyageai.pro/signup", lastModified: new Date() },
  ];
}