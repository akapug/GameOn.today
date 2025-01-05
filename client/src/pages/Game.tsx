import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { useRoute, useLocation } from "wouter";
import { type Game as GameType, type Player, type Activity } from "@db/schema";
import { Spinner } from "@/components/ui/spinner";
import { Card, CardContent, CardHeader } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import {
  Calendar,
  MapPin,
  Users,
  ArrowLeft,
  Share2,
  LinkIcon,
  Facebook,
  Twitter,
  MessageSquare,
  Trash2,
  Edit2
} from "lucide-react";
import { format } from "date-fns";
import { useState, useEffect } from "react";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from "@/components/ui/dialog";
import { Input } from "@/components/ui/input";
import { useToast } from "@/hooks/use-toast";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import { useAuth } from "@/components/AuthProvider";
import { Form, FormControl, FormField, FormItem, FormLabel } from "@/components/ui/form";
import { useForm } from "react-hook-form";
import { Slider } from "@/components/ui/slider";
import { RadioGroup, RadioGroupItem } from "@/components/ui/radio-group";
import { Label } from "@/components/ui/label";
import { queryKeys } from "@/lib/queryClient";
import WeatherDisplay from "@/components/WeatherDisplay";
import type { WeatherInfo } from "../../../server/services/weather";
import GameCard from "@/components/GameCard";
import {Select, SelectContent, SelectItem, SelectTrigger, SelectValue} from "@/components/ui/select"

interface GameWithDetails extends GameType {
  players: Player[];
  activity: Activity;
  weather: WeatherInfo | null;
}

export default function Game() {
  const [, params] = useRoute("/games/:hash");
  const [, setLocation] = useLocation();
  const [playerName, setPlayerName] = useState("");
  const [playerEmail, setPlayerEmail] = useState("");
  const [isOpen, setIsOpen] = useState(false);
  const [showDeleteConfirm, setShowDeleteConfirm] = useState(false);
  const [showEditDialog, setShowEditDialog] = useState(false);
  const queryClient = useQueryClient();
  const { toast } = useToast();
  const { user } = useAuth();
  const [joinType, setJoinType] = useState<"yes" | "maybe">("yes");
  const [likelihood, setLikelihood] = useState(0.5);

  const { data: game, isLoading, error } = useQuery<GameWithDetails>({
    queryKey: params?.hash ? ['games', params.hash] : undefined,
    enabled: !!params?.hash,
    retry: 1,
  });

  const form = useForm<Partial<GameType>>({
    defaultValues: {
      title: game?.title || "",
      location: game?.location || "",
      date: game?.date || "",
      endTime: game?.endTime || "",
      timezone: game?.timezone || "",
      playerThreshold: game?.playerThreshold || 2,
      notes: game?.notes || "",
      webLink: game?.webLink || "",
      isRecurring: game?.isRecurring || false,
      recurrenceFrequency: game?.recurrenceFrequency || undefined,
    },
  });

  useEffect(() => {
    if (error) {
      toast({
        title: "Error",
        description: error instanceof Error ? error.message : "Failed to load game details",
        variant: "destructive",
      });
      setLocation("/");
    }
  }, [error, toast, setLocation]);

  useEffect(() => {
    if (game) {
      form.reset({
        title: game.title,
        location: game.location,
        date: game.date,
        playerThreshold: game.playerThreshold,
        isRecurring: game.isRecurring,
        recurrenceFrequency: game.recurrenceFrequency,
      });
    }
  }, [game, form]);

  const joinGame = useMutation({
    mutationFn: async () => {
      const res = await fetch(`/api/games/${params?.hash}/join`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          name: playerName,
          email: playerEmail,
          likelihood: joinType === "yes" ? 1 : likelihood
        }),
      });

      if (!res.ok) {
        const error = await res.text();
        throw new Error(error || "Failed to join game");
      }

      return res.json();
    },
    onSuccess: () => {
      // Invalidate both the individual game and the games list
      queryClient.invalidateQueries({ queryKey: queryKeys.games.all });
      queryClient.invalidateQueries({
        queryKey: params?.id ? queryKeys.games.single(parseInt(params.id, 10)) : undefined
      });
      toast({
        title: "Success",
        description: "You've successfully joined the game!",
      });
      setIsOpen(false);
      setPlayerName("");
      setPlayerEmail("");
      setJoinType("yes");
      setLikelihood(0.5);
    },
    onError: (error) => {
      toast({
        title: "Error",
        description: error.message,
        variant: "destructive",
      });
    },
  });

  const editGame = useMutation({
    mutationFn: async (values: Partial<GameType>) => {
      const res = await fetch(`/api/games/${params?.id}`, {
        method: "PUT",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          ...values,
          creatorId: game?.creatorId,
        }),
      });

      if (!res.ok) {
        const error = await res.text();
        throw new Error(error || "Failed to update game");
      }

      return res.json();
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: params?.id ? queryKeys.games.single(parseInt(params.id, 10)) : undefined });
      toast({
        title: "Success",
        description: "Game updated successfully",
      });
      setShowEditDialog(false);
    },
    onError: (error) => {
      toast({
        title: "Error",
        description: error.message,
        variant: "destructive",
      });
    },
  });

  const deleteGame = useMutation({
    mutationFn: async () => {
      const res = await fetch(`/api/games/${params?.id}`, {
        method: "DELETE",
        headers: { "Content-Type": "application/json" },
      });

      if (!res.ok) {
        const error = await res.text();
        throw new Error(error || "Failed to delete game");
      }

      return res.json();
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: queryKeys.games.all });
      toast({
        title: "Success",
        description: "Game deleted successfully",
      });
      setLocation("/");
    },
    onError: (error) => {
      toast({
        title: "Error",
        description: error.message,
        variant: "destructive",
      });
    },
  });

  if (isLoading) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <Spinner className="w-8 h-8" />
      </div>
    );
  }

  if (!game) {
    return null;
  }

  const shareGame = async (method: 'copy' | 'facebook' | 'twitter' | 'sms') => {
    const gameUrl = `${window.location.origin}/games/${game.id}`;
    const text = `Join our ${game.activity.name} game: ${game.title} at ${game.location}`;

    switch (method) {
      case 'copy':
        await navigator.clipboard.writeText(gameUrl);
        toast({
          title: "Link Copied",
          description: "Game link copied to clipboard!",
        });
        break;
      case 'facebook':
        window.open(
          `https://www.facebook.com/sharer/sharer.php?u=${encodeURIComponent(gameUrl)}`,
          '_blank'
        );
        break;
      case 'twitter':
        window.open(
          `https://twitter.com/intent/tweet?url=${encodeURIComponent(gameUrl)}&text=${encodeURIComponent(text)}`,
          '_blank'
        );
        break;
      case 'sms':
        window.open(
          `sms:?body=${encodeURIComponent(`${text}\n${gameUrl}`)}`,
          '_blank'
        );
        break;
    }
  };

  const openInGoogleMaps = (location: string) => {
    window.open(`https://www.google.com/maps/search/?api=1&query=${encodeURIComponent(location)}`, '_blank');
  };

  const calculateProgress = () => {
    const total = game.players.reduce((sum, player) => {
      const likelihood = player.likelihood ? Number(player.likelihood) : 1;
      return sum + likelihood;
    }, 0);
    return (total / game.playerThreshold) * 100;
  };

  const progressPercentage = calculateProgress();
  const hasMinimumPlayers = progressPercentage >= 100;
  const canDelete = user && game.creatorId === user.uid;

  return (
    <div className="min-h-screen bg-background">
      <header className="p-4 border-b">
        <div className="container flex items-center justify-between">
          <div className="flex items-center">
            <Button variant="ghost" onClick={() => setLocation("/")}>
              <ArrowLeft className="mr-2 h-4 w-4" />
              Back
            </Button>
            <h1 className="text-2xl font-bold ml-4">{game.title}</h1>
          </div>
          <Button variant="ghost" onClick={() => setLocation("/")}>
            <ArrowLeft className="mr-2 h-4 w-4" />
            Back
          </Button>
        </div>
      </header>

      <main className="container py-6 px-4">
        <GameCard game={game} fullscreen={true} />
          </main>
    </div>
  );
}