import { useMemo, useState } from "react";
import { useQuery, useMutation } from "@tanstack/react-query";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { Card } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Skeleton } from "@/components/ui/skeleton";
import { Calendar as CalendarIcon, ArrowLeft, ArrowRight, Plus } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import {
  Form,
  FormControl,
  FormField,
  FormItem,
  FormLabel,
  FormMessage,
} from "@/components/ui/form";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import type { WeeklyData, Transaction, Category } from "@shared/schema";
import { insertTransactionSchema } from "@shared/schema";
import { useToast } from "@/hooks/use-toast";
import { apiRequest, queryClient } from "@/lib/queryClient";
import { z } from "zod";

const formSchema = insertTransactionSchema.extend({
  categoryId: z.string().min(1, "Selecione uma categoria"),
  amount: z.string().min(1, "Digite um valor"),
});

type FormValues = z.infer<typeof formSchema>;

export default function WeeklyView() {
  const { toast } = useToast();
  const [selectedMonth, setSelectedMonth] = useState(new Date().getMonth() + 1);
  const [selectedYear, setSelectedYear] = useState(new Date().getFullYear());
  const [open, setOpen] = useState(false);
  const [selectedDate, setSelectedDate] = useState<Date | null>(null);

  const form = useForm<FormValues>({
    resolver: zodResolver(formSchema),
    defaultValues: {
      title: "",
      amount: "",
      date: new Date().toISOString().split("T")[0],
      categoryId: "",
      status: "unpaid",
      notes: "",
      recurrenceType: "none",
      recurrenceDay: null,
    },
  });

  const { data: weeklyData, isLoading } = useQuery<WeeklyData>({
    queryKey: ["/api/reports/weekly", { year: selectedYear, month: selectedMonth }],
    retry: false,
  });

  const { data: categories } = useQuery<Category[]>({
    queryKey: ["/api/categories"],
    retry: false,
  });

  const { data: transactions } = useQuery<Transaction[]>({
    queryKey: ["/api/transactions"],
    retry: false,
  });

  const createMutation = useMutation({
    mutationFn: async (data: any) => {
      await apiRequest("POST", "/api/transactions", data);
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["/api/transactions"] });
      queryClient.invalidateQueries({ queryKey: ["/api/reports/weekly"] });
      toast({ title: "Sucesso!", description: "Transação criada com sucesso." });
      handleClose();
    },
    onError: () => {
      toast({ 
        variant: "destructive",
        title: "Erro", 
        description: "Falha ao criar transação." 
      });
    },
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

  const handleDayClick = (day: number) => {
    const date = new Date(selectedYear, selectedMonth - 1, day);
    setSelectedDate(date);
    form.reset({
      title: "",
      amount: "",
      date: date.toISOString().split("T")[0],
      categoryId: "",
      status: "unpaid",
      notes: "",
      recurrenceType: "none",
      recurrenceDay: null,
    });
    setOpen(true);
  };

  const handleClose = () => {
    setOpen(false);
    setSelectedDate(null);
    form.reset();
  };

  const onSubmit = async (data: FormValues) => {
    // Keep date as local date string (YYYY-MM-DD) to avoid timezone shifts
    const dateParts = data.date.split('-');
    const year = parseInt(dateParts[0]);
    const month = parseInt(dateParts[1]) - 1;
    const day = parseInt(dateParts[2]);
    const localDate = new Date(year, month, day, 12, 0, 0);
    
    const payload = {
      ...data,
      amount: parseFloat(data.amount),
      date: localDate.toISOString(),
      recurrenceDay: data.recurrenceType === "monthly" || data.recurrenceType === "quarterly" 
        ? day 
        : null,
    };
    createMutation.mutate(payload);
  };

  const monthNames = [
    "Janeiro", "Fevereiro", "Março", "Abril", "Maio", "Junho",
    "Julho", "Agosto", "Setembro", "Outubro", "Novembro", "Dezembro"
  ];

  const dayNames = ["Dom", "Seg", "Ter", "Qua", "Qui", "Sex", "Sáb"];

  // Generate calendar days
  const calendarDays = useMemo(() => {
    const firstDay = new Date(selectedYear, selectedMonth - 1, 1);
    const lastDay = new Date(selectedYear, selectedMonth, 0);
    const daysInMonth = lastDay.getDate();
    const startingDayOfWeek = firstDay.getDay();

    const days = [];
    
    // Add empty cells for days before month starts
    for (let i = 0; i < startingDayOfWeek; i++) {
      days.push(null);
    }
    
    // Add actual days
    for (let day = 1; day <= daysInMonth; day++) {
      days.push(day);
    }
    
    return days;
  }, [selectedMonth, selectedYear]);

  // Get transactions for specific day (timezone-safe)
  const getTransactionsForDay = (day: number | null) => {
    if (!day || !transactions) return [];
    
    return transactions.filter(t => {
      const dateStr = typeof t.date === 'string' ? t.date : new Date(t.date).toISOString();
      const dateParts = dateStr.split('T')[0].split('-');
      const txYear = parseInt(dateParts[0]);
      const txMonth = parseInt(dateParts[1]);
      const txDay = parseInt(dateParts[2]);
      
      return (
        txYear === selectedYear &&
        txMonth === selectedMonth &&
        txDay === day
      );
    });
  };

  const monthTotal = weeklyData?.monthTotal || 0;
  const weeks = weeklyData?.weeks || [];

  if (isLoading || !weeklyData) {
    return (
      <div className="p-6 space-y-6">
        <Skeleton className="h-8 w-64" />
        <Skeleton className="h-[600px] w-full" />
      </div>
    );
  }

  return (
    <div className="p-6 space-y-6 animate-fade-in">
      <div className="flex items-center justify-between flex-wrap gap-4">
        <div>
          <h1 className="text-3xl font-bold tracking-tight">Visualização Semanal</h1>
          <p className="text-muted-foreground">
            Clique em qualquer dia para cadastrar uma nova transação
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
            <CalendarIcon className="w-5 h-5 text-muted-foreground" />
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

      {/* Calendar Grid */}
      <Card className="p-6">
        <h2 className="text-xl font-semibold mb-4">Calendário do Mês</h2>
        
        {/* Day Headers */}
        <div className="grid grid-cols-7 gap-2 mb-2">
          {dayNames.map((dayName) => (
            <div
              key={dayName}
              className="text-center text-sm font-semibold text-muted-foreground py-2"
            >
              {dayName}
            </div>
          ))}
        </div>

        {/* Calendar Days */}
        <div className="grid grid-cols-7 gap-2">
          {calendarDays.map((day, index) => {
            const dayTransactions = getTransactionsForDay(day);
            const dayTotal = dayTransactions.reduce((sum, t) => sum + Number(t.amount), 0);
            const today = new Date();
            const isToday = day && 
              today.getDate() === day &&
              today.getMonth() === selectedMonth - 1 &&
              today.getFullYear() === selectedYear;

            return (
              <button
                key={index}
                onClick={() => day && handleDayClick(day)}
                disabled={!day}
                className={`
                  relative min-h-[100px] p-2 rounded-lg border transition-all
                  ${day ? 'hover-elevate active-elevate-2 cursor-pointer' : 'cursor-default opacity-50'}
                  ${isToday ? 'ring-2 ring-primary' : ''}
                  ${dayTransactions.length > 0 ? 'bg-primary/5' : ''}
                `}
                data-testid={day ? `calendar-day-${day}` : undefined}
              >
                {day && (
                  <>
                    <div className="flex items-center justify-between mb-1">
                      <span className={`text-sm font-semibold ${isToday ? 'text-primary' : ''}`}>
                        {day}
                      </span>
                      {dayTransactions.length > 0 && (
                        <Badge variant="secondary" className="h-5 min-w-5 text-xs px-1">
                          {dayTransactions.length}
                        </Badge>
                      )}
                    </div>
                    
                    {dayTotal > 0 && (
                      <div className="text-xs font-semibold text-primary mt-1">
                        R$ {dayTotal.toFixed(2)}
                      </div>
                    )}
                    
                    {dayTransactions.slice(0, 2).map((t) => {
                      const category = categories?.find(c => c.id === t.categoryId);
                      return (
                        <div
                          key={t.id}
                          className="text-[10px] text-left truncate mt-1 px-1 py-0.5 rounded"
                          style={{ 
                            backgroundColor: category?.color ? `${category.color}20` : undefined,
                            borderLeft: `2px solid ${category?.color || '#10B981'}`
                          }}
                        >
                          {t.title}
                        </div>
                      );
                    })}
                    
                    {dayTransactions.length > 2 && (
                      <div className="text-[10px] text-muted-foreground mt-1">
                        +{dayTransactions.length - 2} mais
                      </div>
                    )}
                  </>
                )}
              </button>
            );
          })}
        </div>
      </Card>

      {/* Dialog for Creating Transaction */}
      <Dialog open={open} onOpenChange={setOpen}>
        <DialogContent className="max-w-md">
          <DialogHeader>
            <DialogTitle>Nova Transação</DialogTitle>
            <DialogDescription>
              {selectedDate && `Criar transação para ${selectedDate.getDate()}/${selectedDate.getMonth() + 1}/${selectedDate.getFullYear()}`}
            </DialogDescription>
          </DialogHeader>

          <Form {...form}>
            <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-4">
              <FormField
                control={form.control}
                name="title"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Título</FormLabel>
                    <FormControl>
                      <Input 
                        placeholder="Ex: Aluguel, Energia, Alimentação..." 
                        data-testid="input-transaction-title"
                        {...field} 
                      />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />

              <FormField
                control={form.control}
                name="amount"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Valor (R$)</FormLabel>
                    <FormControl>
                      <Input 
                        type="number" 
                        step="0.01"
                        placeholder="0.00"
                        data-testid="input-transaction-amount"
                        {...field} 
                      />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />

              <FormField
                control={form.control}
                name="date"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Data</FormLabel>
                    <FormControl>
                      <Input 
                        type="date"
                        data-testid="input-transaction-date"
                        {...field} 
                      />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />

              <FormField
                control={form.control}
                name="categoryId"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Categoria</FormLabel>
                    <Select onValueChange={field.onChange} value={field.value || ""}>
                      <FormControl>
                        <SelectTrigger data-testid="select-category">
                          <SelectValue placeholder="Selecione uma categoria" />
                        </SelectTrigger>
                      </FormControl>
                      <SelectContent>
                        {categories?.map((category) => (
                          <SelectItem 
                            key={category.id} 
                            value={category.id}
                            data-testid={`category-option-${category.id}`}
                          >
                            <div className="flex items-center gap-2">
                              <div 
                                className="w-3 h-3 rounded-full" 
                                style={{ backgroundColor: category.color }}
                              />
                              {category.name}
                            </div>
                          </SelectItem>
                        ))}
                      </SelectContent>
                    </Select>
                    <FormMessage />
                  </FormItem>
                )}
              />

              <FormField
                control={form.control}
                name="status"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Status</FormLabel>
                    <Select onValueChange={field.onChange} value={field.value || "unpaid"}>
                      <FormControl>
                        <SelectTrigger data-testid="select-status">
                          <SelectValue />
                        </SelectTrigger>
                      </FormControl>
                      <SelectContent>
                        <SelectItem value="paid">Pago</SelectItem>
                        <SelectItem value="unpaid">Não Pago</SelectItem>
                      </SelectContent>
                    </Select>
                    <FormMessage />
                  </FormItem>
                )}
              />

              <FormField
                control={form.control}
                name="recurrenceType"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Recorrência</FormLabel>
                    <Select onValueChange={field.onChange} value={field.value || "none"}>
                      <FormControl>
                        <SelectTrigger data-testid="select-recurrence">
                          <SelectValue />
                        </SelectTrigger>
                      </FormControl>
                      <SelectContent>
                        <SelectItem value="none">Não recorrente</SelectItem>
                        <SelectItem value="weekly">Semanal</SelectItem>
                        <SelectItem value="biweekly">Quinzenal</SelectItem>
                        <SelectItem value="monthly">Mensal</SelectItem>
                        <SelectItem value="quarterly">Trimestral</SelectItem>
                      </SelectContent>
                    </Select>
                    <FormMessage />
                  </FormItem>
                )}
              />

              <FormField
                control={form.control}
                name="notes"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Observações (Opcional)</FormLabel>
                    <FormControl>
                      <Textarea 
                        placeholder="Adicione observações..."
                        data-testid="input-transaction-notes"
                        {...field}
                        value={field.value || ""}
                      />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />

              <div className="flex gap-2 justify-end">
                <Button 
                  type="button" 
                  variant="outline" 
                  onClick={handleClose}
                  data-testid="button-cancel"
                >
                  Cancelar
                </Button>
                <Button 
                  type="submit"
                  disabled={createMutation.isPending}
                  data-testid="button-save-transaction"
                >
                  {createMutation.isPending ? "Salvando..." : "Salvar"}
                </Button>
              </div>
            </form>
          </Form>
        </DialogContent>
      </Dialog>

      {/* Info Box */}
      <Card className="p-6 bg-muted/50">
        <h3 className="font-semibold mb-2">💡 Dica</h3>
        <p className="text-sm text-muted-foreground">
          Clique em qualquer dia do calendário para criar uma nova transação. 
          O sistema já preenche a data automaticamente! Transações recorrentes serão criadas 
          automaticamente nos próximos meses.
        </p>
      </Card>
    </div>
  );
}
