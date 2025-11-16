import { useMemo, useState } from "react";
import { useQuery } from "@tanstack/react-query";
import { Card } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Skeleton } from "@/components/ui/skeleton";
import { Calendar, ArrowLeft, ArrowRight } from "lucide-react";
import { Button } from "@/components/ui/button";
import type { WeeklyData, Transaction, Category } from "@shared/schema";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";

export default function WeeklyView() {
  const [selectedMonth, setSelectedMonth] = useState(new Date().getMonth() + 1);
  const [selectedYear, setSelectedYear] = useState(new Date().getFullYear());

  const { data: weeklyData, isLoading } = useQuery<WeeklyData>({
    queryKey: ["/api/reports/weekly", { year: selectedYear, month: selectedMonth }],
    retry: false,
  });

  const { data: categories } = useQuery<Category[]>({
    queryKey: ["/api/categories"],
    retry: false,
  });


  const handlePreviousMonth = () => {
    if (selectedMonth === 1) {
      setSelectedMonth(12);
      setSelectedYear(selectedYear - 1);
    } else {
      setSelectedMonth(selectedMonth - 1);
    }
  };

  const handleNextMonth = () => {
    if (selectedMonth === 12) {
      setSelectedMonth(1);
      setSelectedYear(selectedYear + 1);
    } else {
      setSelectedMonth(selectedMonth + 1);
    }
  };

  const monthNames = [
    "Janeiro", "Fevereiro", "Março", "Abril", "Maio", "Junho",
    "Julho", "Agosto", "Setembro", "Outubro", "Novembro", "Dezembro"
  ];

  const monthTotal = weeklyData?.monthTotal || 0;
  const weeks = weeklyData?.weeks || [];

  if (isLoading || !weeklyData) {
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
              {monthNames[selectedMonth - 1]} {selectedYear}
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
              {weeks.reduce((sum, week) => sum + week.transactionCount, 0)}
            </h3>
          </div>
        </div>
      </Card>

      {/* Weekly Grid */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-5 gap-4">
        {weeks.map((week) => (
          <Card key={week.weekNumber} className="p-4" data-testid={`card-week-${week.weekNumber}`}>
            <div className="mb-4">
              <h3 className="font-semibold text-lg">Semana {week.weekNumber}</h3>
              <p className="text-xs text-muted-foreground">
                {new Date(week.startDate).getDate()} - {new Date(week.endDate).getDate()} de{" "}
                {monthNames[selectedMonth - 1].toLowerCase()}
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
                              {new Date(transaction.date).getDate()}/{new Date(transaction.date).getMonth() + 1}
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
        {weeks.length < 5 &&
          Array.from({ length: 5 - weeks.length }).map((_, idx) => (
            <Card key={`empty-${idx}`} className="p-4 opacity-50">
              <div className="mb-4">
                <h3 className="font-semibold text-lg">Semana {weeks.length + idx + 1}</h3>
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
