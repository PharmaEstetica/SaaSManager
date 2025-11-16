import { useEffect, useState } from "react";
import { useQuery } from "@tanstack/react-query";
import { Card } from "@/components/ui/card";
import { Skeleton } from "@/components/ui/skeleton";
import {
  TrendingUp,
  TrendingDown,
  DollarSign,
  Receipt,
  Calendar,
  AlertCircle,
} from "lucide-react";
import type { AdvancedReport, Transaction, Category } from "@shared/schema";
import { useAuth } from "@/hooks/useAuth";
import { useToast } from "@/hooks/use-toast";
import { isUnauthorizedError } from "@/lib/authUtils";
import {
  ChartContainer,
  ChartTooltip,
  ChartTooltipContent,
} from "@/components/ui/chart";
import { PieChart, Pie, Cell, ResponsiveContainer, BarChart, Bar, XAxis, YAxis } from "recharts";
import { Badge } from "@/components/ui/badge";
import { AccountModeModal } from "@/components/account-mode-modal";

export default function Dashboard() {
  const { user, isLoading: authLoading } = useAuth();
  const { toast } = useToast();
  const [showAccountModal, setShowAccountModal] = useState(false);

  const currentMonth = new Date().getMonth() + 1;
  const currentYear = new Date().getFullYear();

  const { data: advancedReport, isLoading: reportLoading, error } = useQuery<AdvancedReport>({
    queryKey: ['/api/reports/advanced', { year: currentYear, month: currentMonth }],
    retry: false,
  });

  const { data: transactions } = useQuery<Transaction[]>({
    queryKey: ["/api/transactions"],
    retry: false,
  });

  const { data: categories } = useQuery<Category[]>({
    queryKey: ["/api/categories"],
    retry: false,
  });

  // Show account mode selection modal if user hasn't chosen yet
  useEffect(() => {
    if (user && !user.accountType) {
      setShowAccountModal(true);
    }
  }, [user]);

  useEffect(() => {
    const checkAuth = () => {
      if (!authLoading && !user) {
        toast({
          title: "Não autorizado",
          description: "Você foi desconectado. Redirecionando...",
          variant: "destructive",
        });
        setTimeout(() => {
          window.location.href = "/api/login";
        }, 500);
      }
    };
    checkAuth();
  }, [user, authLoading, toast]);

  // Get recent transactions for display
  const recentTransactions = transactions
    ?.filter((t) => {
      const date = new Date(t.date);
      return date.getMonth() === currentMonth - 1 && date.getFullYear() === currentYear;
    })
    .sort((a, b) => new Date(b.date).getTime() - new Date(a.date).getTime())
    .slice(0, 5) || [];

  if (authLoading || reportLoading || !advancedReport) {
    return (
      <div className="p-6 space-y-6">
        <Skeleton className="h-8 w-64" />
        <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
          <Skeleton className="h-32" />
          <Skeleton className="h-32" />
          <Skeleton className="h-32" />
        </div>
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
          <Skeleton className="h-96" />
          <Skeleton className="h-96" />
        </div>
      </div>
    );
  }

  // Extract data from advancedReport
  const totalThisMonth = advancedReport.overview.totalExpenses;
  const monthlyChange = advancedReport.trends.monthOverMonthChangePercent;
  
  // Calculate paid/unpaid counts from transactions
  const thisMonthTransactions = transactions?.filter((t) => {
    const date = new Date(t.date);
    return date.getMonth() === currentMonth - 1 && date.getFullYear() === currentYear;
  }) || [];
  
  const paidThisMonth = thisMonthTransactions.filter((t) => t.status === "paid").length;
  const unpaidThisMonth = thisMonthTransactions.filter((t) => t.status === "unpaid").length;
  
  const categoryData = advancedReport.categoryRankings.slice(0, 5).map(cat => ({
    name: cat.categoryName,
    value: cat.total,
    color: cat.categoryColor,
  }));

  return (
    <div className="p-6 space-y-6 animate-fade-in">
      <AccountModeModal
        open={showAccountModal}
        onClose={() => setShowAccountModal(false)}
        currentAccountType={user?.accountType}
      />

      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold tracking-tight">Dashboard</h1>
          <p className="text-muted-foreground">
            Visão geral das suas finanças
          </p>
        </div>
        <Badge variant="outline" className="text-sm">
          {user?.accountType === "business" ? "Modo Empresarial" : "Modo Pessoal"}
        </Badge>
      </div>

      {/* Stats Cards */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
        <Card className="p-6">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm text-muted-foreground">Total este mês</p>
              <h3 className="text-2xl font-bold mt-1">
                R$ {totalThisMonth.toFixed(2)}
              </h3>
              <div className="flex items-center gap-1 mt-2">
                {monthlyChange >= 0 ? (
                  <TrendingUp className="w-4 h-4 text-destructive" />
                ) : (
                  <TrendingDown className="w-4 h-4 text-success" />
                )}
                <span
                  className={`text-sm ${
                    monthlyChange >= 0 ? "text-destructive" : "text-success"
                  }`}
                >
                  {Math.abs(monthlyChange).toFixed(1)}% vs mês anterior
                </span>
              </div>
            </div>
            <div className="w-12 h-12 rounded-full bg-primary/10 flex items-center justify-center">
              <DollarSign className="w-6 h-6 text-primary" />
            </div>
          </div>
        </Card>

        <Card className="p-6">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm text-muted-foreground">Transações pagas</p>
              <h3 className="text-2xl font-bold mt-1">{paidThisMonth}</h3>
              <p className="text-sm text-muted-foreground mt-2">
                {unpaidThisMonth} pendentes
              </p>
            </div>
            <div className="w-12 h-12 rounded-full bg-success/10 flex items-center justify-center">
              <Receipt className="w-6 h-6 text-success" />
            </div>
          </div>
        </Card>

        <Card className="p-6">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm text-muted-foreground">Categorias ativas</p>
              <h3 className="text-2xl font-bold mt-1">{categoryData.length}</h3>
              <p className="text-sm text-muted-foreground mt-2">
                de {categories?.length || 0} total
              </p>
            </div>
            <div className="w-12 h-12 rounded-full bg-chart-2/10 flex items-center justify-center">
              <Calendar className="w-6 h-6 text-chart-2" />
            </div>
          </div>
        </Card>
      </div>

      {/* Charts Row */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* Category Breakdown */}
        <Card className="p-6">
          <h3 className="text-lg font-semibold mb-4">Gastos por Categoria</h3>
          {categoryData.length > 0 ? (
            <div className="h-64">
              <ResponsiveContainer width="100%" height="100%">
                <PieChart>
                  <Pie
                    data={categoryData}
                    cx="50%"
                    cy="50%"
                    labelLine={false}
                    outerRadius={80}
                    fill="#8884d8"
                    dataKey="value"
                  >
                    {categoryData.map((entry, index) => (
                      <Cell key={`cell-${index}`} fill={entry.color} />
                    ))}
                  </Pie>
                  <ChartTooltip content={<ChartTooltipContent />} />
                </PieChart>
              </ResponsiveContainer>
              <div className="mt-4 space-y-2">
                {categoryData.slice(0, 5).map((cat, idx) => (
                  <div key={idx} className="flex items-center justify-between text-sm">
                    <div className="flex items-center gap-2">
                      <div
                        className="w-3 h-3 rounded-full"
                        style={{ backgroundColor: cat.color }}
                      />
                      <span>{cat.name}</span>
                    </div>
                    <span className="font-medium">R$ {cat.value.toFixed(2)}</span>
                  </div>
                ))}
              </div>
            </div>
          ) : (
            <div className="h-64 flex flex-col items-center justify-center text-muted-foreground">
              <AlertCircle className="w-12 h-12 mb-2" />
              <p>Nenhuma transação este mês</p>
            </div>
          )}
        </Card>

        {/* Recent Transactions */}
        <Card className="p-6">
          <h3 className="text-lg font-semibold mb-4">Transações Recentes</h3>
          {recentTransactions.length > 0 ? (
            <div className="space-y-4">
              {recentTransactions.map((transaction) => {
                const category = categories?.find((c) => c.id === transaction.categoryId);
                return (
                  <div
                    key={transaction.id}
                    className="flex items-center justify-between p-3 rounded-lg hover-elevate"
                  >
                    <div className="flex items-center gap-3">
                      <div
                        className="w-10 h-10 rounded-full flex items-center justify-center"
                        style={{
                          backgroundColor: category?.color
                            ? `${category.color}20`
                            : "#10B98120",
                        }}
                      >
                        <Receipt className="w-5 h-5" style={{ color: category?.color || "#10B981" }} />
                      </div>
                      <div>
                        <p className="font-medium">{transaction.title}</p>
                        <p className="text-sm text-muted-foreground">
                          {category?.name || "Sem categoria"}
                        </p>
                      </div>
                    </div>
                    <div className="text-right">
                      <p className="font-semibold">R$ {Number(transaction.amount).toFixed(2)}</p>
                      <Badge
                        variant={transaction.status === "paid" ? "default" : "secondary"}
                        className="text-xs mt-1"
                      >
                        {transaction.status === "paid" ? "Pago" : "Pendente"}
                      </Badge>
                    </div>
                  </div>
                );
              })}
            </div>
          ) : (
            <div className="h-64 flex flex-col items-center justify-center text-muted-foreground">
              <AlertCircle className="w-12 h-12 mb-2" />
              <p>Nenhuma transação encontrada</p>
              <a href="/transactions" className="text-primary hover:underline mt-2">
                Criar primeira transação
              </a>
            </div>
          )}
        </Card>
      </div>
    </div>
  );
}
