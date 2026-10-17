import type { MetadataRoute } from "next";

// Lets the administrator add the app to her phone's home screen.
export default function manifest(): MetadataRoute.Manifest {
  return {
    name: "E-skool",
    short_name: "E-skool",
    description: "Gestion de l'école : paiements, reçus, impayés.",
    start_url: "/tableau-de-bord",
    display: "standalone",
    background_color: "#f8fafc",
    theme_color: "#1e40af",
    lang: "fr",
    icons: [{ src: "/icon.svg", sizes: "any", type: "image/svg+xml", purpose: "any" }],
  };
}
