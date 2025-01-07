import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { useAuth } from "@/components/AuthProvider";
import { useLocation } from "wouter";
import { useEffect } from "react";

interface AuthDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  redirectTo?: string;
}

export default function AuthDialog({ open, onOpenChange, redirectTo }: AuthDialogProps) {
  const { user, signInWithGoogle } = useAuth();
  const [, setLocation] = useLocation();

  // Close dialog and redirect when user signs in
  useEffect(() => {
    if (user && open) {
      onOpenChange(false);
      if (redirectTo) {
        setLocation(redirectTo);
      }
    }
  }, [user, open, onOpenChange, redirectTo, setLocation]);

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent>
        <DialogHeader>
          <DialogTitle>Sign in Required</DialogTitle>
        </DialogHeader>
        <p className="text-sm text-muted-foreground">
          You need to sign in to create a game. You can still join existing games without signing in.
        </p>
        <div className="flex justify-end gap-2 mt-4">
          <Button onClick={signInWithGoogle}>
            Sign in with Google
          </Button>
        </div>
      </DialogContent>
    </Dialog>
  );
}