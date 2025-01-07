
import { useQuery } from "@tanstack/react-query";
import { type Activity } from "@db/schema";
import { queryKeys } from "./queryClient";

export const defaultActivities: Omit<Activity, "id">[] = [
  {
    name: "Frisbee",
    color: "emerald",
    icon: "disc",
  },
  {
    name: "Basketball",
    color: "orange",
    icon: "circle",
  },
  {
    name: "Soccer",
    color: "green",
    icon: "circle-dot",
  },
  {
    name: "Volleyball",
    color: "yellow",
    icon: "circle",
  },
  {
    name: "Poker",
    color: "red",
    icon: "diamond",
  },
  {
    name: "Board Games",
    color: "purple",
    icon: "dice",
  },
  {
    name: "Going Out",
    color: "purple",
    icon: "wine",
  },
];

export const activityColors = {
  emerald: "hsl(152.2 76% 60.6%)",
  orange: "hsl(24.6 95% 53.1%)",
  green: "hsl(142.1 76.2% 36.3%)",
  yellow: "hsl(47.9 95.8% 53.1%)",
  red: "hsl(0 72.2% 50.6%)",
  purple: "hsl(280 68.2% 50.6%)",
};

import { activityConfig } from "../../db/config/activities";

export function useActivities() {
  return {
    data: activityConfig,
    error: null,
    isLoading: false
  };
}
