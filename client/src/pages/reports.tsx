import { useMemo } from "react";
import { useQuery } from "@tanstack/react-query";
import { Card } from "@/components/ui/card";
import { Skeleton } from "@/components/ui/skeleton";
import { Badge } from "@/components/ui/badge";
import { TrendingUp, TrendingDown, AlertCircle, Lightbulb } from "lucide-react";
import type { Transaction, Category } from "@shared/schema";
import {
  ChartContainer,
  ChartTooltip,
  ChartTooltipContent,
} from "@/components/ui/chart";
import { 
  BarChart, 
  Bar, 
  XAxis, 
  YAxis, 
  ResponsiveContainer, 
  LineChart, 
  Line,
  CartesianGrid
} from "recharts";

export default function Reports() {
  const { data: transactions, isLoading } = useQuery<Transaction[]>({
    queryKey: ["/api/transactions"],
    retry: false,
  });

  const { data: categories } = useQuery<Category[]>({
    queryKey: ["/api/categories"],
    retry: false,
  });

  const reportData = useMemo(() => {
    if (!transactions || !categories) return null;

    const now = new Date();
    const currentMonth = now.getMonth();
    const currentYear = now.getFullYear();
    const lastMonth = currentMonth === 0 ? 11 : currentMonth - 1;
    const lastMonthYear = currentMonth === 0 ? currentYear - 1 : currentYear;

    // Current month transactions
    const currentMonthTx = transactions.filter((t) => {
      const date = new Date(t.date);
      return date.getMonth() === currentMonth && date.getFullYear() === currentYear;
    });

    // Last month transactions
    const lastMonthTx = transactions.filter((t) => {
      const date = new Date(t.date);
      return date.getMonth() === lastMonth && date.getFullYear() === lastMonthYear;
    });

    const currentTotal = currentMonthTx.reduce((sum, t) => sum + Number(t.amount), 0);
    const lastTotal = lastMonthTx.reduce((sum, t) => sum + Number(t.amount), 0);
    const percentChange = lastTotal > 0 ? ((currentTotal - lastTotal) / lastTotal) * 100 : 0;

    // Category comparison
    const categoryComparison = categories.map((cat) => {
      const currentCatTotal = currentMonthTx
        .filter((t) => t.categoryId === cat.id)
        .reduce((sum, t) => sum + Number(t.amount), 0);
      const lastCatTotal = lastMonthTx
        .filter((t) => t.categoryId === cat.id)
        .reduce((sum, t) => sum + Number(t.amount), 0);
      const catChange = lastCatTotal > 0
        ? ((currentCatTotal - lastCatTotal) / lastCatTotal) * 100
        : 0;

      return {
        name: cat.name,
        current: currentCatTotal,
        last: lastCatTotal,
        change: catChange,
        color: cat.color,
      };
    }).filter((c) => c.current > 0 || c.last > 0);

    // Ranking - top spending categories
    const ranking = categoryComparison
      .sort((a, b) => b.current - a.current)
      .slice(0, 5);

    // Monthly evolution (last 6 months)
    const monthlyEvolution = [];
    for (let i = 5; i >= 0; i--) {
      const targetMonth = currentMonth - i;
      const targetYear = currentYear + Math.floor(targetMonth / 12);
      const adjustedMonth = ((targetMonth % 12) + 12) % 12;

      const monthTx = transactions.filter((t) => {
        const date = new Date(t.date);
        return date.getMonth() === adjustedMonth && date.getFullYear() === targetYear;
      });

      const total = monthTx.reduce((sum, t) => sum + Number(t.amount), 0);

      monthlyEvolution.push({
        month: new Date(targetYear, adjustedMonth).toLocaleDateString("pt-BR", {
          month: "short",
        }),
        value: total,
      });
    }

    // Recommendations
    const recommendations = [];
    
    // Top 3 increased categories
    const increased = categoryComparison
      .filter((c) => c.change > 10)
      .sort((a, b) => b.change - a.change)
      .slice(0, 3);

    increased.forEach((cat) => {
      const potentialSaving = cat.current * 0.1; // 10% reduction
      recommendations.push({
        category: cat.name,
        message: `Você gastou ${cat.change.toFixed(1)}% a mais em ${cat.name} este mês.`,
        suggestion: `Se reduzir 10%, você economiza R$ ${potentialSaving.toFixed(2)}/mês.`,
      });
    });

    return {
      currentTotal,
      lastTotal,
      percentChange,
      categoryComparison,
      ranking,
      monthlyEvolution,
      recommendations,
    };
  }, [transactions, categories]);

  if (isLoading || !reportData) {
    return (
      <div className="p-6 space-y-6">
        <Skeleton className="h-8 w-64" />
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
          <Skeleton className="h-96" />
          <Skeleton className="h-96" />
        </div>
      </div>
    );
  }

  const monthNames = ["Jan", "Fev", "Mar", "Abr", "Mai", "Jun", "Jul", "Ago", "Set", "Out", "Nov", "Dez"];
  const currentMonthName = monthNames[new Date().getMonth()];
  const lastMonthName = monthNames[new Date().getMonth() === 0 ? 11 : new Date().getMonth() - 1];

  return (
    <div className="p-6 space-y-6 animate-fade-in">
      <div>
        <h1 className="text-3xl font-bold tracking-tight">Relatórios</h1>
        <p className="text-muted-foreground">Análise comparativa e insights sobre seus gastos</p>
      </div>

      {/* Comparison Header */}
      <Card className="p-6">
        <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
          <div>
            <p className="text-sm text-muted-foreground">Mês Atual ({currentMonthName})</p>
            <h3 className="text-3xl font-bold mt-1">R$ {reportData.currentTotal.toFixed(2)}</h3>
          </div>
          <div>
            <p className="text-sm text-muted-foreground">Mês Anterior ({lastMonthName})</p>
            <h3 className="text-3xl font-bold mt-1">R$ {reportData.lastTotal.toFixed(2)}</h3>
          </div>
          <div>
            <p className="text-sm text-muted-foreground">Variação</p>
            <div className="flex items-center gap-2 mt-1">
              <h3 className={`text-3xl font-bold ${reportData.percentChange >= 0 ? "text-destructive" : "text-success"}`}>
                {reportData.percentChange >= 0 ? "+" : ""}
                {reportData.percentChange.toFixed(1)}%
              </h3>
              {reportData.percentChange >= 0 ? (
                <TrendingUp className="w-6 h-6 text-destructive" />
              ) : (
                <TrendingDown className="w-6 h-6 text-success" />
              )}
            </div>
          </div>
        </div>
      </Card>

      {/* Charts */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* Category Comparison */}
        <Card className="p-6">
          <h3 className="text-lg font-semibold mb-4">Comparação por Categoria</h3>
          {reportData.categoryComparison.length > 0 ? (
            <div className="h-80">
              <ResponsiveContainer width="100%" height="100%">
                <BarChart data={reportData.categoryComparison}>
                  <CartesianGrid strokeDasharray="3 3" opacity={0.1} />
                  <XAxis dataKey="name" angle={-45} textAnchor="end" height={80} fontSize={12} />
                  <YAxis fontSize={12} />
                  <ChartTooltip content={<ChartTooltipContent />} />
                  <Bar dataKey="last" fill="hsl(var(--muted))" name={lastMonthName} />
                  <Bar dataKey="current" fill="hsl(var(--primary))" name={currentMonthName} />
                </BarChart>
              </ResponsiveContainer>
            </div>
          ) : (
            <div className="h-80 flex items-center justify-center text-muted-foreground">
              <AlertCircle className="w-12 h-12 mb-2" />
              <p>Sem dados suficientes</p>
            </div>
          )}
        </Card>

        {/* Monthly Evolution */}
        <Card className="p-6">
          <h3 className="text-lg font-semibold mb-4">Evolução Mensal (Últimos 6 Meses)</h3>
          {reportData.monthlyEvolution.length > 0 ? (
            <div className="h-80">
              <ResponsiveContainer width="100%" height="100%">
                <LineChart data={reportData.monthlyEvolution}>
                  <CartesianGrid strokeDasharray="3 3" opacity={0.1} />
                  <XAxis dataKey="month" fontSize={12} />
                  <YAxis fontSize={12} />
                  <ChartTooltip content={<ChartTooltipContent />} />
                  <Line
                    type="monotone"
                    dataKey="value"
                    stroke="hsl(var(--primary))"
                    strokeWidth={2}
                    dot={{ fill: "hsl(var(--primary))", r: 4 }}
                  />
                </LineChart>
              </ResponsiveContainer>
            </div>
          ) : (
            <div className="h-80 flex items-center justify-center text-muted-foreground">
              <AlertCircle className="w-12 h-12 mb-2" />
              <p>Sem dados suficientes</p>
            </div>
          )}
        </Card>
      </div>

      {/* Ranking */}
      <Card className="p-6">
        <h3 className="text-lg font-semibold mb-4">Top 5 Categorias - {currentMonthName}</h3>
        <div className="space-y-4">
          {reportData.ranking.map((cat, idx) => (
            <div key={cat.name} className="flex items-center gap-4">
              <div className="w-8 h-8 rounded-full bg-muted flex items-center justify-center font-bold">
                {idx + 1}
              </div>
              <div className="flex-1">
                <div className="flex items-center justify-between mb-1">
                  <span className="font-medium">{cat.name}</span>
                  <span className="font-semibold">R$ {cat.current.toFixed(2)}</span>
                </div>
                <div className="flex items-center gap-2">
                  <div className="flex-1 h-2 bg-muted rounded-full overflow-hidden">
                    <div
                      className="h-full bg-primary transition-all"
                      style={{
                        width: `${(cat.current / reportData.currentTotal) * 100}%`,
                      }}
                    />
                  </div>
                  <span className="text-xs text-muted-foreground">
                    {((cat.current / reportData.currentTotal) * 100).toFixed(1)}%
                  </span>
                </div>
              </div>
              <Badge
                variant={cat.change >= 0 ? "destructive" : "default"}
                className="min-w-[60px] justify-center"
              >
                {cat.change >= 0 ? "+" : ""}
                {cat.change.toFixed(0)}%
              </Badge>
            </div>
          ))}
        </div>
      </Card>

      {/* Recommendations */}
      {reportData.recommendations.length > 0 && (
        <Card className="p-6 bg-warning/5 border-warning/20">
          <div className="flex items-start gap-3">
            <Lightbulb className="w-6 h-6 text-warning flex-shrink-0 mt-1" />
            <div className="flex-1">
              <h3 className="text-lg font-semibold mb-3">Recomendações de Economia</h3>
              <div className="space-y-3">
                {reportData.recommendations.map((rec, idx) => (
                  <div key={idx} className="p-4 rounded-lg bg-card">
                    <p className="font-medium mb-1">{rec.message}</p>
                    <p className="text-sm text-muted-foreground">{rec.suggestion}</p>
                  </div>
                ))}
              </div>
            </div>
          </div>
        </Card>
      )}
    </div>
  );
}
