import { sportColors } from "./sports";

export function setSportTheme(color: keyof typeof sportColors) {
  document.documentElement.style.setProperty("--primary", sportColors[color]);
}
