import { BarChart, Bar, XAxis, YAxis, Tooltip, ResponsiveContainer, CartesianGrid, LineChart, Line, PieChart, Pie, Cell } from 'recharts';

const accuracyData = [
  { subject: 'Linguagens', accuracy: 75 },
  { subject: 'Humanas', accuracy: 82 },
  { subject: 'Natureza', accuracy: 68 },
  { subject: 'Matemática', accuracy: 71 },
];

const performanceData = [
  { month: 'Jan', score: 580 }, { month: 'Fev', score: 620 },
  { month: 'Mar', score: 650 }, { month: 'Abr', score: 700 },
  { month: 'Mai', score: 720 }, { month: 'Jun', score: 750 },
];

const studyTimeData = [
  { name: 'Questões', value: 40 }, { name: 'Simulados', value: 25 },
  { name: 'Redação', value: 20 }, { name: 'Revisão', value: 15 },
];

const COLORS = ['hsl(250 80% 62%)', 'hsl(220 70% 50%)', 'hsl(270 70% 55%)', 'hsl(35 90% 55%)'];
const tooltipStyle = { backgroundColor: 'hsl(230 25% 10%)', border: '1px solid hsl(230 20% 16%)', borderRadius: '8px', color: 'hsl(210 40% 96%)' };

export default function Statistics() {
  return (
    <div className="max-w-5xl mx-auto space-y-6 animate-slide-up">
      <div>
        <h1 className="text-2xl font-display font-bold">Estatísticas</h1>
        <p className="text-muted-foreground text-sm mt-1">Acompanhe sua evolução nos estudos</p>
      </div>

      <div className="grid lg:grid-cols-2 gap-6">
        {/* Accuracy */}
        <div className="rounded-2xl p-6 gradient-card border border-border/50 shadow-card">
          <h2 className="font-display font-semibold mb-4">Acurácia por Área</h2>
          <ResponsiveContainer width="100%" height={250}>
            <BarChart data={accuracyData}>
              <CartesianGrid strokeDasharray="3 3" stroke="hsl(230 20% 16%)" />
              <XAxis dataKey="subject" stroke="hsl(215 20% 55%)" fontSize={12} />
              <YAxis stroke="hsl(215 20% 55%)" fontSize={12} />
              <Tooltip contentStyle={tooltipStyle} />
              <Bar dataKey="accuracy" fill="hsl(250 80% 62%)" radius={[6, 6, 0, 0]} />
            </BarChart>
          </ResponsiveContainer>
        </div>

        {/* Performance over time */}
        <div className="rounded-2xl p-6 gradient-card border border-border/50 shadow-card">
          <h2 className="font-display font-semibold mb-4">Evolução da Nota</h2>
          <ResponsiveContainer width="100%" height={250}>
            <LineChart data={performanceData}>
              <CartesianGrid strokeDasharray="3 3" stroke="hsl(230 20% 16%)" />
              <XAxis dataKey="month" stroke="hsl(215 20% 55%)" fontSize={12} />
              <YAxis stroke="hsl(215 20% 55%)" fontSize={12} />
              <Tooltip contentStyle={tooltipStyle} />
              <Line type="monotone" dataKey="score" stroke="hsl(250 80% 62%)" strokeWidth={3} dot={{ fill: 'hsl(250 80% 62%)', strokeWidth: 2 }} />
            </LineChart>
          </ResponsiveContainer>
        </div>

        {/* Study time distribution */}
        <div className="rounded-2xl p-6 gradient-card border border-border/50 shadow-card">
          <h2 className="font-display font-semibold mb-4">Distribuição de Estudo</h2>
          <ResponsiveContainer width="100%" height={250}>
            <PieChart>
              <Pie data={studyTimeData} cx="50%" cy="50%" outerRadius={90} dataKey="value" label={({ name, percent }) => `${name} ${(percent * 100).toFixed(0)}%`} fontSize={12}>
                {studyTimeData.map((_, i) => <Cell key={i} fill={COLORS[i % COLORS.length]} />)}
              </Pie>
              <Tooltip contentStyle={tooltipStyle} />
            </PieChart>
          </ResponsiveContainer>
        </div>

        {/* Essay evolution */}
        <div className="rounded-2xl p-6 gradient-card border border-border/50 shadow-card">
          <h2 className="font-display font-semibold mb-4">Evolução da Redação</h2>
          <ResponsiveContainer width="100%" height={250}>
            <LineChart data={[
              { essay: '1ª', score: 580 }, { essay: '2ª', score: 640 },
              { essay: '3ª', score: 680 }, { essay: '4ª', score: 740 },
              { essay: '5ª', score: 820 },
            ]}>
              <CartesianGrid strokeDasharray="3 3" stroke="hsl(230 20% 16%)" />
              <XAxis dataKey="essay" stroke="hsl(215 20% 55%)" fontSize={12} />
              <YAxis stroke="hsl(215 20% 55%)" fontSize={12} />
              <Tooltip contentStyle={tooltipStyle} />
              <Line type="monotone" dataKey="score" stroke="hsl(270 70% 55%)" strokeWidth={3} dot={{ fill: 'hsl(270 70% 55%)', strokeWidth: 2 }} />
            </LineChart>
          </ResponsiveContainer>
        </div>
      </div>
    </div>
  );
}
