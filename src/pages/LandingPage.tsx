import { Link } from 'react-router-dom';
import { Zap, Brain, Trophy, Swords, PenTool, Bot, BarChart3, Star, ChevronRight, Sparkles, Target, Users, ArrowRight } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { motion } from 'framer-motion';

const features = [
  { icon: Brain, title: 'Questões Inteligentes', desc: 'Milhares de questões do ENEM organizadas por área, dificuldade e tema.' },
  { icon: Target, title: 'Simulados Completos', desc: 'Simulados com timer, navegação e estimativa TRI igual ao ENEM real.' },
  { icon: PenTool, title: 'Redação com IA', desc: 'Envie sua redação e receba correção detalhada por competência em segundos.' },
  { icon: Bot, title: 'Chatbot Educacional', desc: 'Tire dúvidas com um assistente de IA treinado para o ENEM.' },
  { icon: Swords, title: 'Modo PvP', desc: 'Desafie outros estudantes em batalhas de conhecimento em tempo real.' },
  { icon: Trophy, title: 'Ranking & Gamificação', desc: 'Ganhe XP, suba de nível, conquiste badges e domine o ranking.' },
];

const stats = [
  { value: '50k+', label: 'Questões' },
  { value: '10k+', label: 'Estudantes' },
  { value: '98%', label: 'Satisfação' },
  { value: '200+', label: 'Simulados' },
];

const testimonials = [
  { name: 'Ana Clara', score: '920', text: 'Com o MindRush consegui organizar meus estudos e aumentar minha nota em 150 pontos!' },
  { name: 'Pedro Henrique', score: '880', text: 'O modo PvP me motivou a estudar todos os dias. Viciei de um jeito positivo!' },
  { name: 'Mariana Silva', score: '960', text: 'A correção de redação por IA é incrível. Evolui muito nas competências 3 e 4.' },
];

const fadeUp = {
  hidden: { opacity: 0, y: 30 },
  visible: (i: number) => ({ opacity: 1, y: 0, transition: { delay: i * 0.1, duration: 0.5 } }),
};

export default function LandingPage() {
  return (
    <div className="min-h-screen bg-background text-foreground overflow-x-hidden">
      {/* Nav */}
      <nav className="fixed top-0 inset-x-0 z-50 border-b border-border/40 bg-background/80 backdrop-blur-xl">
        <div className="max-w-7xl mx-auto flex items-center justify-between h-16 px-6">
          <Link to="/" className="flex items-center gap-2">
            <div className="w-9 h-9 rounded-xl gradient-primary flex items-center justify-center shadow-glow">
              <Zap className="w-5 h-5 text-primary-foreground" />
            </div>
            <span className="text-xl font-display font-bold text-gradient">MindRush</span>
          </Link>
          <div className="hidden md:flex items-center gap-8 text-sm text-muted-foreground">
            <a href="#features" className="hover:text-foreground transition-colors">Recursos</a>
            <a href="#stats" className="hover:text-foreground transition-colors">Números</a>
            <a href="#testimonials" className="hover:text-foreground transition-colors">Depoimentos</a>
          </div>
          <div className="flex items-center gap-3">
            <Button variant="ghost" asChild className="hidden sm:inline-flex">
              <Link to="/login">Entrar</Link>
            </Button>
            <Button asChild className="gradient-primary text-primary-foreground shadow-glow">
              <Link to="/registro">Começar grátis</Link>
            </Button>
          </div>
        </div>
      </nav>

      {/* Hero */}
      <section className="relative pt-32 pb-20 md:pt-44 md:pb-32 px-6">
        <div className="absolute inset-0 overflow-hidden pointer-events-none">
          <div className="absolute top-20 left-1/2 -translate-x-1/2 w-[600px] h-[600px] rounded-full bg-primary/8 blur-[120px]" />
          <div className="absolute bottom-0 right-0 w-[400px] h-[400px] rounded-full bg-accent/8 blur-[100px]" />
        </div>
        <div className="max-w-4xl mx-auto text-center relative">
          <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} transition={{ duration: 0.6 }}>
            <div className="inline-flex items-center gap-2 px-4 py-1.5 rounded-full border border-primary/30 bg-primary/10 text-primary text-sm font-medium mb-6">
              <Sparkles className="w-4 h-4" />
              Plataforma #1 de estudos para o ENEM
            </div>
          </motion.div>
          <motion.h1
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.6, delay: 0.1 }}
            className="text-4xl sm:text-5xl md:text-7xl font-display font-bold leading-tight"
          >
            Estude para o ENEM{' '}
            <span className="text-gradient">como um jogo</span>
          </motion.h1>
          <motion.p
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.6, delay: 0.2 }}
            className="mt-6 text-lg md:text-xl text-muted-foreground max-w-2xl mx-auto"
          >
            Questões, simulados, redação com IA, modo PvP e gamificação completa.
            Tudo que você precisa para conquistar sua vaga na universidade.
          </motion.p>
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.6, delay: 0.3 }}
            className="mt-10 flex flex-col sm:flex-row items-center justify-center gap-4"
          >
            <Button asChild size="lg" className="gradient-primary text-primary-foreground shadow-glow text-base px-8 h-12">
              <Link to="/registro">
                Começar agora — é grátis
                <ArrowRight className="w-5 h-5 ml-2" />
              </Link>
            </Button>
            <Button asChild variant="outline" size="lg" className="border-border/50 bg-muted/30 text-base px-8 h-12">
              <Link to="/login">Já tenho uma conta</Link>
            </Button>
          </motion.div>
        </div>
      </section>

      {/* Stats */}
      <section id="stats" className="py-16 border-y border-border/40 bg-muted/20">
        <div className="max-w-5xl mx-auto px-6 grid grid-cols-2 md:grid-cols-4 gap-8">
          {stats.map((s, i) => (
            <motion.div
              key={s.label}
              custom={i}
              initial="hidden"
              whileInView="visible"
              viewport={{ once: true }}
              variants={fadeUp}
              className="text-center"
            >
              <div className="text-3xl md:text-4xl font-display font-bold text-gradient">{s.value}</div>
              <div className="text-sm text-muted-foreground mt-1">{s.label}</div>
            </motion.div>
          ))}
        </div>
      </section>

      {/* Features */}
      <section id="features" className="py-20 md:py-28 px-6">
        <div className="max-w-6xl mx-auto">
          <div className="text-center mb-14">
            <h2 className="text-3xl md:text-4xl font-display font-bold">Tudo para sua <span className="text-gradient">aprovação</span></h2>
            <p className="mt-4 text-muted-foreground max-w-xl mx-auto">Ferramentas poderosas que tornam o estudo mais eficiente, divertido e produtivo.</p>
          </div>
          <div className="grid sm:grid-cols-2 lg:grid-cols-3 gap-6">
            {features.map((f, i) => (
              <motion.div
                key={f.title}
                custom={i}
                initial="hidden"
                whileInView="visible"
                viewport={{ once: true }}
                variants={fadeUp}
                className="group rounded-2xl p-6 gradient-card border border-border/50 hover:border-primary/30 transition-all duration-300 hover:shadow-glow/20"
              >
                <div className="w-12 h-12 rounded-xl gradient-primary flex items-center justify-center mb-4 shadow-glow group-hover:scale-110 transition-transform">
                  <f.icon className="w-6 h-6 text-primary-foreground" />
                </div>
                <h3 className="text-lg font-semibold mb-2">{f.title}</h3>
                <p className="text-sm text-muted-foreground leading-relaxed">{f.desc}</p>
              </motion.div>
            ))}
          </div>
        </div>
      </section>

      {/* Testimonials */}
      <section id="testimonials" className="py-20 md:py-28 px-6 bg-muted/20 border-y border-border/40">
        <div className="max-w-6xl mx-auto">
          <div className="text-center mb-14">
            <h2 className="text-3xl md:text-4xl font-display font-bold">Quem usa, <span className="text-gradient">aprova</span></h2>
            <p className="mt-4 text-muted-foreground">Veja o que nossos estudantes estão dizendo.</p>
          </div>
          <div className="grid md:grid-cols-3 gap-6">
            {testimonials.map((t, i) => (
              <motion.div
                key={t.name}
                custom={i}
                initial="hidden"
                whileInView="visible"
                viewport={{ once: true }}
                variants={fadeUp}
                className="rounded-2xl p-6 gradient-card border border-border/50"
              >
                <div className="flex items-center gap-1 mb-4">
                  {[...Array(5)].map((_, j) => (
                    <Star key={j} className="w-4 h-4 fill-yellow-500 text-yellow-500" />
                  ))}
                </div>
                <p className="text-sm text-muted-foreground leading-relaxed mb-4">"{t.text}"</p>
                <div className="flex items-center justify-between">
                  <div>
                    <div className="font-semibold text-sm">{t.name}</div>
                    <div className="text-xs text-muted-foreground">Estudante ENEM</div>
                  </div>
                  <div className="text-xs font-medium text-primary bg-primary/10 px-2 py-1 rounded-full">Nota: {t.score}</div>
                </div>
              </motion.div>
            ))}
          </div>
        </div>
      </section>

      {/* CTA */}
      <section className="py-20 md:py-28 px-6">
        <div className="max-w-3xl mx-auto text-center">
          <motion.div initial={{ opacity: 0, scale: 0.95 }} whileInView={{ opacity: 1, scale: 1 }} viewport={{ once: true }} transition={{ duration: 0.5 }}>
            <div className="rounded-3xl p-10 md:p-14 gradient-card border border-primary/20 shadow-glow/30 relative overflow-hidden">
              <div className="absolute inset-0 bg-primary/5 pointer-events-none" />
              <div className="relative">
                <h2 className="text-3xl md:text-4xl font-display font-bold mb-4">Pronto para <span className="text-gradient">começar</span>?</h2>
                <p className="text-muted-foreground mb-8 max-w-md mx-auto">Crie sua conta gratuita e comece a estudar agora. Sem cartão de crédito.</p>
                <Button asChild size="lg" className="gradient-primary text-primary-foreground shadow-glow text-base px-10 h-12">
                  <Link to="/registro">
                    Criar conta grátis
                    <ChevronRight className="w-5 h-5 ml-1" />
                  </Link>
                </Button>
              </div>
            </div>
          </motion.div>
        </div>
      </section>

      {/* Footer */}
      <footer className="border-t border-border/40 py-10 px-6">
        <div className="max-w-6xl mx-auto flex flex-col md:flex-row items-center justify-between gap-4">
          <div className="flex items-center gap-2">
            <div className="w-7 h-7 rounded-lg gradient-primary flex items-center justify-center">
              <Zap className="w-4 h-4 text-primary-foreground" />
            </div>
            <span className="font-display font-bold text-gradient">MindRush</span>
          </div>
          <p className="text-xs text-muted-foreground">© {new Date().getFullYear()} MindRush. Todos os direitos reservados.</p>
          <div className="flex items-center gap-6 text-sm text-muted-foreground">
            <a href="#" className="hover:text-foreground transition-colors">Termos</a>
            <a href="#" className="hover:text-foreground transition-colors">Privacidade</a>
            <a href="#" className="hover:text-foreground transition-colors">Contato</a>
          </div>
        </div>
      </footer>
    </div>
  );
}
