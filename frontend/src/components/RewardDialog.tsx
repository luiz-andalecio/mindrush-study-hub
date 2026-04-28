import { Coins, Sparkles, Flame } from "lucide-react";
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { cn } from "@/lib/utils";

type RewardDialogProps = {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  title?: string;
  xpEarned: number;
  coinsEarned: number;
  streak?: number | null;
  className?: string;
};

export function RewardDialog({
  open,
  onOpenChange,
  title = "Recompensa desbloqueada!",
  xpEarned,
  coinsEarned,
  streak,
  className,
}: RewardDialogProps) {
  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className={cn("sm:max-w-md", className)}>
        <DialogHeader>
          <DialogTitle className="font-display flex items-center gap-2">
            <span className="inline-flex w-9 h-9 rounded-xl gradient-primary items-center justify-center">
              <Sparkles className="w-5 h-5 text-primary-foreground" />
            </span>
            {title}
          </DialogTitle>
        </DialogHeader>

        <div className="rounded-2xl p-5 gradient-card border border-border/50 shadow-card">
          <div className="grid grid-cols-2 gap-3">
            <div className="rounded-xl p-4 bg-muted/20 border border-border/40">
              <p className="text-xs text-muted-foreground">XP ganho</p>
              <p className="mt-1 text-2xl font-display font-bold text-gradient">+{xpEarned}</p>
            </div>

            <div className="rounded-xl p-4 bg-muted/20 border border-border/40">
              <p className="text-xs text-muted-foreground">Moedas</p>
              <div className="mt-1 flex items-end gap-2">
                <Coins className="w-5 h-5 text-warning" />
                <p className="text-2xl font-display font-bold">+{coinsEarned}</p>
              </div>
            </div>
          </div>

          {typeof streak === "number" ? (
            <div className="mt-4 rounded-xl p-4 bg-muted/20 border border-border/40 flex items-center justify-between">
              <div>
                <p className="text-xs text-muted-foreground">Streak</p>
                <p className="text-sm font-medium mt-1">Sequência atual</p>
              </div>
              <div className="flex items-center gap-2 text-warning font-display font-bold">
                <Flame className="w-5 h-5" />
                <span className="text-lg">{streak} dias</span>
              </div>
            </div>
          ) : null}
        </div>

        <div className="flex justify-end">
          <Button onClick={() => onOpenChange(false)} className="gradient-primary text-primary-foreground">
            Continuar
          </Button>
        </div>
      </DialogContent>
    </Dialog>
  );
}
