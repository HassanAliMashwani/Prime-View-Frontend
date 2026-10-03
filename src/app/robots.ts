import type { MetadataRoute } from "next";

export default function robots(): MetadataRoute.Robots {
  return {
    rules: [
      {
        userAgent: "*",
        allow: "/",
        disallow: [
          "/admin",
          "/admin/",
          "/society-members",
          "/society-members/",
          "/api/",
        ],
      },
    ],
    sitemap: "https://prime-view-livid.vercel.app/sitemap.xml",
  };
}
