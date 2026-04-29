import type { MetadataRoute } from "next";

export default function manifest(): MetadataRoute.Manifest {
  return {
    name: "Coach de Estudo",
    short_name: "Coach",
    description:
      "Notas, trabalhos de casa, plano de estudos e dificuldades para o 1.º ao 9.º ano.",
    start_url: "/",
    display: "standalone",
    background_color: "#f8fafc",
    theme_color: "#0f766e",
    lang: "pt-PT",
    orientation: "portrait-primary",
  };
}
