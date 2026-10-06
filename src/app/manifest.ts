import type { MetadataRoute } from "next";

export default function manifest(): MetadataRoute.Manifest {
  return {
    id: "/",
    name: "TouchGrass AI — Your outdoor companion",
    short_name: "TouchGrass",
    description: "Prepare an outdoor quest with open AI, then take it offline.",
    start_url: "/",
    scope: "/",
    display: "standalone",
    background_color: "#f2f2eb",
    theme_color: "#f2f2eb",
    icons: [
      {
        src: "/icon.svg",
        sizes: "any",
        type: "image/svg+xml",
        purpose: "any",
      },
    ],
  };
}
