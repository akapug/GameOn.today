
import { useQuery } from "@tanstack/react-query";
import { type Sport } from "@db/schema";
import { queryKeys } from "./queryClient";

export const defaultSports: Omit<Sport, "id">[] = [
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
];

export const sportColors = {
  emerald: "hsl(152.2 76% 60.6%)",
  orange: "hsl(24.6 95% 53.1%)",
  green: "hsl(142.1 76.2% 36.3%)",
  yellow: "hsl(47.9 95.8% 53.1%)",
};

export function useSports() {
  return useQuery<Sport[]>({
    queryKey: queryKeys.sports,
    queryFn: () => fetch("/api/sports").then(res => res.json()),
  });
}
