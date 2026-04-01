import { Button } from '@/components/ui/button';
import { Coins, Palette, User, Award, Zap, ShoppingCart } from 'lucide-react';
import { cn } from '@/lib/utils';

const storeItems = [
  { id: '1', name: 'Tema Neon', description: 'Visual cyberpunk para sua interface', type: 'theme' as const, price: 500, icon: Palette, owned: false, gradient: 'gradient-accent' },
  { id: '2', name: 'Avatar Cientista', description: 'Avatar exclusivo de cientista', type: 'avatar' as const, price: 300, icon: User, owned: true, gradient: 'gradient-primary' },
  { id: '3', name: 'Badge Estrela', description: 'Badge rara de destaque', type: 'badge' as const, price: 800, icon: Award, owned: false, gradient: 'gradient-warm' },
  { id: '4', name: 'Booster XP 2x', description: 'Dobre seu XP por 24h', type: 'booster' as const, price: 200, icon: Zap, owned: false, gradient: 'gradient-success' },
  { id: '5', name: 'Tema Aurora', description: 'Gradientes inspirados na aurora boreal', type: 'theme' as const, price: 600, icon: Palette, owned: false, gradient: 'gradient-primary' },
  { id: '6', name: 'Avatar Astronauta', description: 'Avatar exclusivo espacial', type: 'avatar' as const, price: 400, icon: User, owned: false, gradient: 'gradient-accent' },
];

export default function Store() {
  return (
    <div className="max-w-5xl mx-auto space-y-6 animate-slide-up">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-display font-bold">Loja</h1>
          <p className="text-muted-foreground text-sm mt-1">Use suas moedas para personalizar</p>
        </div>
        <div className="flex items-center gap-2 px-4 py-2 rounded-xl bg-muted/30 border border-border/50">
          <Coins className="w-5 h-5 text-warning" />
          <span className="font-display font-bold">1.250</span>
        </div>
      </div>

      <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-4">
        {storeItems.map((item) => (
          <div key={item.id} className="rounded-xl p-5 gradient-card border border-border/50 shadow-card space-y-4 group hover:shadow-glow transition-all duration-300 hover:border-primary/30">
            <div className={cn('w-14 h-14 rounded-xl flex items-center justify-center group-hover:scale-110 transition-transform', item.gradient)}>
              <item.icon className="w-7 h-7 text-primary-foreground" />
            </div>
            <div>
              <h3 className="font-display font-semibold">{item.name}</h3>
              <p className="text-xs text-muted-foreground mt-1">{item.description}</p>
              <span className="text-[10px] uppercase tracking-wider text-primary font-medium">{item.type}</span>
            </div>
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-1.5">
                <Coins className="w-4 h-4 text-warning" />
                <span className="font-display font-bold text-sm">{item.price}</span>
              </div>
              {item.owned ? (
                <span className="text-xs text-success font-medium px-3 py-1.5 rounded-full bg-success/10">Adquirido</span>
              ) : (
                <Button size="sm" className="gradient-primary text-primary-foreground">
                  <ShoppingCart className="w-3.5 h-3.5 mr-1.5" /> Comprar
                </Button>
              )}
            </div>
          </div>
        ))}
      </div>
    </div>
  );
}
