import type { MetadataRoute } from "next";

export default function manifest(): MetadataRoute.Manifest {
  return {
    id: "/dashboard",
    name: "Ja, ik wil! · Bruiloftsplanner",
    short_name: "Ja, ik wil!",
    description: "Plan jullie perfecte bruiloft: taken, gasten, budget, leveranciers en meer.",
    start_url: "/dashboard",
    scope: "/",
    display: "standalone",
    orientation: "portrait",
    background_color: "#fbf7f4",
    theme_color: "#fbf7f4",
    lang: "nl",
    categories: ["lifestyle", "productivity"],
    icons: [
      { src: "/icon/192", sizes: "192x192", type: "image/png", purpose: "any" },
      { src: "/icon/512", sizes: "512x512", type: "image/png", purpose: "any" },
      { src: "/icon/512", sizes: "512x512", type: "image/png", purpose: "maskable" },
    ],
    shortcuts: [
      { name: "Takenlijst", url: "/dashboard/checklist" },
      { name: "Gasten", url: "/dashboard/gasten" },
      { name: "Budget", url: "/dashboard/budget" },
    ],
  };
}
