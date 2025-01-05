import { activityColors } from "./activities";

export function setActivityTheme(color: keyof typeof activityColors) {
  document.documentElement.style.setProperty("--primary", activityColors[color]);
}
