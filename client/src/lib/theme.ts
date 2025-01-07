import { eventTypeColors } from "./activities";

export function setEventTypeTheme(color: keyof typeof eventTypeColors) {
  document.documentElement.style.setProperty("--primary", eventTypeColors[color]);
}