import { useMemo, useState } from "react";
import { useQuery } from "@tanstack/react-query";
import { Card } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Skeleton } from "@/components/ui/skeleton";
import { Calendar, ArrowLeft, ArrowRight } from "lucide-react";
import { Button } from "@/components/ui/button";
import type { Transaction, Category } from "@shared/schema";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";

interface WeekGroup {
  weekNumber: number;
  startDate: Date;
  endDate: Date;
  transactions: Transaction[];
  total: number;
}

export default function WeeklyView() {
  const [selectedMonth, setSelectedMonth] = useState(new Date().getMonth());
  const [selectedYear, setSelectedYear] = useState(new Date().getFullYear());

  const { data: transactions, isLoading } = useQuery<Transaction[]>({
    queryKey: ["/api/transactions"],
    retry: false,
  });

  const { data: categories } = useQuery<Category[]>({
    queryKey: ["/api/categories"],
    retry: false,
  });

  // Group transactions by week
  const weeklyData = useMemo(() => {
    if (!transactions) return [];

    // Filter transactions for selected month/year
    const monthTransactions = transactions.filter((t) => {
      const date = new Date(t.date);
      return date.getMonth() === selectedMonth && date.getFullYear() === selectedYear;
    });

    // Get first and last day of month
    const firstDay = new Date(selectedYear, selectedMonth, 1);
    const lastDay = new Date(selectedYear, selectedMonth + 1, 0);

    // Create weeks
    const weeks: WeekGroup[] = [];
    let currentWeekStart = new Date(firstDay);
    let weekNumber = 1;

    while (currentWeekStart <= lastDay) {
      const weekEnd = new Date(currentWeekStart);
      weekEnd.setDate(weekEnd.getDate() + 6);

      // Ensure week doesn't extend beyond month
      const actualWeekEnd = weekEnd > lastDay ? lastDay : weekEnd;

      const weekTransactions = monthTransactions.filter((t) => {
        const tDate = new Date(t.date);
        return tDate >= currentWeekStart && tDate <= actualWeekEnd;
      });

      const weekTotal = weekTransactions.reduce((sum, t) => sum + Number(t.amount), 0);

      weeks.push({
        weekNumber,
        startDate: new Date(currentWeekStart),
        endDate: actualWeekEnd,
        transactions: weekTransactions,
        total: weekTotal,
      });

      // Move to next week
      currentWeekStart.setDate(currentWeekStart.getDate() + 7);
      weekNumber++;

      // Safety check - max 6 weeks
      if (weekNumber > 6) break;
    }

    return weeks;
  }, [transactions, selectedMonth, selectedYear]);

  const handlePreviousMonth = () => {
    if (selectedMonth === 0) {
      setSelectedMonth(11);
      setSelectedYear(selectedYear - 1);
    } else {
      setSelectedMonth(selectedMonth - 1);
    }
  };

  const handleNextMonth = () => {
    if (selectedMonth === 11) {
      setSelectedMonth(0);
      setSelectedYear(selectedYear + 1);
    } else {
      setSelectedMonth(selectedMonth + 1);
    }
  };

  const monthNames = [
    "Janeiro", "Fevereiro", "Março", "Abril", "Maio", "Junho",
    "Julho", "Agosto", "Setembro", "Outubro", "Novembro", "Dezembro"
  ];

  const monthTotal = weeklyData.reduce((sum, week) => sum + week.total, 0);

  if (isLoading) {
    return (
      <div className="p-6 space-y-6">
        <Skeleton className="h-8 w-64" />
        <div className="grid grid-cols-1 md:grid-cols-5 gap-4">
          {[1, 2, 3, 4, 5].map((i) => (
            <Skeleton key={i} className="h-96" />
          ))}
        </div>
      </div>
    );
  }

  return (
    <div className="p-6 space-y-6 animate-fade-in">
      <div className="flex items-center justify-between flex-wrap gap-4">
        <div>
          <h1 className="text-3xl font-bold tracking-tight">Visualização Semanal</h1>
          <p className="text-muted-foreground">
            Veja seus gastos organizados por semana do mês
          </p>
        </div>

        <div className="flex items-center gap-3">
          <Button
            variant="outline"
            size="sm"
            onClick={handlePreviousMonth}
            data-testid="button-prev-month"
          >
            <ArrowLeft className="w-4 h-4" />
          </Button>
          <div className="flex items-center gap-2 min-w-[200px] justify-center">
            <Calendar className="w-5 h-5 text-muted-foreground" />
            <span className="font-semibold">
              {monthNames[selectedMonth]} {selectedYear}
            </span>
          </div>
          <Button
            variant="outline"
            size="sm"
            onClick={handleNextMonth}
            data-testid="button-next-month"
          >
            <ArrowRight className="w-4 h-4" />
          </Button>
        </div>
      </div>

      {/* Month Summary */}
      <Card className="p-6">
        <div className="flex items-center justify-between">
          <div>
            <p className="text-sm text-muted-foreground">Total do mês</p>
            <h3 className="text-3xl font-bold mt-1">R$ {monthTotal.toFixed(2)}</h3>
          </div>
          <div className="text-right">
            <p className="text-sm text-muted-foreground">Transações</p>
            <h3 className="text-3xl font-bold mt-1">
              {weeklyData.reduce((sum, week) => sum + week.transactions.length, 0)}
            </h3>
          </div>
        </div>
      </Card>

      {/* Weekly Grid */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-5 gap-4">
        {weeklyData.map((week) => (
          <Card key={week.weekNumber} className="p-4" data-testid={`card-week-${week.weekNumber}`}>
            <div className="mb-4">
              <h3 className="font-semibold text-lg">Semana {week.weekNumber}</h3>
              <p className="text-xs text-muted-foreground">
                {week.startDate.getDate()} - {week.endDate.getDate()} de{" "}
                {monthNames[selectedMonth].toLowerCase()}
              </p>
              <div className="mt-2">
                <p className="text-sm text-muted-foreground">Total</p>
                <p className="text-xl font-bold text-primary">
                  R$ {week.total.toFixed(2)}
                </p>
              </div>
            </div>

            <div className="space-y-2">
              {week.transactions.length === 0 ? (
                <p className="text-sm text-muted-foreground text-center py-4">
                  Sem transações
                </p>
              ) : (
                week.transactions
                  .sort((a, b) => new Date(a.date).getTime() - new Date(b.date).getTime())
                  .map((transaction) => {
                    const category = categories?.find((c) => c.id === transaction.categoryId);
                    return (
                      <div
                        key={transaction.id}
                        className="p-3 rounded-lg border bg-card hover-elevate"
                        data-testid={`transaction-${transaction.id}`}
                      >
                        <div className="flex items-start justify-between gap-2">
                          <div className="flex-1 min-w-0">
                            <p className="text-sm font-medium truncate">{transaction.title}</p>
                            <p className="text-xs text-muted-foreground">
                              {new Date(transaction.date).getDate()}/{selectedMonth + 1}
                            </p>
                          </div>
                          <Badge
                            variant={transaction.status === "paid" ? "default" : "secondary"}
                            className="text-xs flex-shrink-0"
                          >
                            {transaction.status === "paid" ? "✓" : "○"}
                          </Badge>
                        </div>
                        <div className="mt-2 flex items-center justify-between gap-2">
                          <span className="text-xs text-muted-foreground truncate">
                            {category?.name || "Sem categoria"}
                          </span>
                          <span className="text-sm font-semibold text-primary flex-shrink-0">
                            R$ {Number(transaction.amount).toFixed(2)}
                          </span>
                        </div>
                      </div>
                    );
                  })
              )}
            </div>
          </Card>
        ))}

        {/* Fill empty weeks if less than 5 */}
        {weeklyData.length < 5 &&
          Array.from({ length: 5 - weeklyData.length }).map((_, idx) => (
            <Card key={`empty-${idx}`} className="p-4 opacity-50">
              <div className="mb-4">
                <h3 className="font-semibold text-lg">Semana {weeklyData.length + idx + 1}</h3>
                <p className="text-xs text-muted-foreground">Não aplicável</p>
              </div>
              <p className="text-sm text-muted-foreground text-center py-8">-</p>
            </Card>
          ))}
      </div>

      {/* Info Box */}
      <Card className="p-6 bg-muted/50">
        <h3 className="font-semibold mb-2">💡 Dica</h3>
        <p className="text-sm text-muted-foreground">
          A visualização semanal ajuda você a identificar padrões de gastos ao longo do mês. 
          Transações recorrentes sempre caem na mesma semana, facilitando o planejamento.
        </p>
      </Card>
    </div>
  );
}
