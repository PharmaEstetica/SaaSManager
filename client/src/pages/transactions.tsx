import { useState, useEffect } from "react";
import { useQuery, useMutation } from "@tanstack/react-query";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { Button } from "@/components/ui/button";
import { Card } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import {
  Form,
  FormControl,
  FormField,
  FormItem,
  FormLabel,
  FormMessage,
} from "@/components/ui/form";
import { Textarea } from "@/components/ui/textarea";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from "@/components/ui/dialog";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import { Badge } from "@/components/ui/badge";
import { Plus, Pencil, Trash2, Search } from "lucide-react";
import type { Transaction, Category } from "@shared/schema";
import { insertTransactionSchema } from "@shared/schema";
import { useToast } from "@/hooks/use-toast";
import { apiRequest, queryClient } from "@/lib/queryClient";
import { Skeleton } from "@/components/ui/skeleton";
import { useAuth } from "@/hooks/useAuth";
import { z } from "zod";
import { formatCurrencyInput, parseCurrencyInput, formatCurrencyDisplay } from "@/lib/formatCurrency";

const formSchema = insertTransactionSchema.extend({
  categoryId: z.string().min(1, "Selecione uma categoria"),
  amount: z.string().min(1, "Digite um valor"),
});

type FormValues = z.infer<typeof formSchema>;

export default function Transactions() {
  const { toast } = useToast();
  const { user } = useAuth();
  const [open, setOpen] = useState(false);
  const [editingTransaction, setEditingTransaction] = useState<Transaction | null>(null);
  const [searchTerm, setSearchTerm] = useState("");
  const [filterCategory, setFilterCategory] = useState<string>("all");
  const [filterStatus, setFilterStatus] = useState<string>("all");

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

  const { data: transactions, isLoading: transactionsLoading } = useQuery<Transaction[]>({
    queryKey: ["/api/transactions"],
    retry: false,
  });

  const { data: categories } = useQuery<Category[]>({
    queryKey: ["/api/categories"],
    retry: false,
  });

  const createMutation = useMutation({
    mutationFn: async (data: any) => {
      await apiRequest("POST", "/api/transactions", data);
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["/api/transactions"] });
      queryClient.invalidateQueries({ 
        predicate: (query) => Boolean(query.queryKey[0]?.toString().startsWith('/api/reports'))
      });
      toast({ title: "Sucesso!", description: "Transação criada com sucesso." });
      handleClose();
    },
    onError: () => {
      toast({ title: "Erro", description: "Não foi possível criar a transação.", variant: "destructive" });
    },
  });

  const updateMutation = useMutation({
    mutationFn: async ({ id, data }: { id: string; data: any }) => {
      await apiRequest("PATCH", `/api/transactions/${id}`, data);
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["/api/transactions"] });
      queryClient.invalidateQueries({ 
        predicate: (query) => Boolean(query.queryKey[0]?.toString().startsWith('/api/reports'))
      });
      toast({ title: "Sucesso!", description: "Transação atualizada com sucesso." });
      handleClose();
    },
    onError: () => {
      toast({ title: "Erro", description: "Não foi possível atualizar a transação.", variant: "destructive" });
    },
  });

  const deleteMutation = useMutation({
    mutationFn: async (id: string) => {
      await apiRequest("DELETE", `/api/transactions/${id}`);
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["/api/transactions"] });
      queryClient.invalidateQueries({ 
        predicate: (query) => Boolean(query.queryKey[0]?.toString().startsWith('/api/reports'))
      });
      toast({ title: "Sucesso!", description: "Transação excluída com sucesso." });
    },
    onError: () => {
      toast({ title: "Erro", description: "Não foi possível excluir a transação.", variant: "destructive" });
    },
  });

  const handleClose = () => {
    setOpen(false);
    setEditingTransaction(null);
    form.reset();
  };

  const handleSubmit = (values: FormValues) => {
    const data = {
      ...values,
      amount: parseCurrencyInput(values.amount),
      isRecurring: values.recurrenceType !== "none",
    };

    if (editingTransaction) {
      updateMutation.mutate({ id: editingTransaction.id, data });
    } else {
      createMutation.mutate(data);
    }
  };

  const handleEdit = (transaction: Transaction) => {
    setEditingTransaction(transaction);
    const amountInCents = Math.round(Number(transaction.amount) * 100);
    form.reset({
      title: transaction.title,
      amount: formatCurrencyInput(amountInCents.toString()),
      date: new Date(transaction.date).toISOString().split("T")[0],
      categoryId: transaction.categoryId || "",
      status: transaction.status as "paid" | "unpaid",
      notes: transaction.notes || "",
      recurrenceType: transaction.recurrenceType as any,
      recurrenceDay: transaction.recurrenceDay,
    });
    setOpen(true);
  };

  const filteredTransactions = transactions?.filter((t) => {
    const matchesSearch = t.title.toLowerCase().includes(searchTerm.toLowerCase());
    const matchesCategory = filterCategory === "all" || t.categoryId === filterCategory;
    const matchesStatus = filterStatus === "all" || t.status === filterStatus;
    return matchesSearch && matchesCategory && matchesStatus;
  }) || [];

  if (transactionsLoading) {
    return (
      <div className="p-6 space-y-6">
        <Skeleton className="h-8 w-64" data-testid="skeleton-loading" />
        <Skeleton className="h-96" />
      </div>
    );
  }

  return (
    <div className="p-6 space-y-6 animate-fade-in">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold tracking-tight" data-testid="heading-transactions">Transações</h1>
          <p className="text-muted-foreground">Gerencie todas as suas transações financeiras</p>
        </div>
        <Dialog open={open} onOpenChange={setOpen}>
          <DialogTrigger asChild>
            <Button data-testid="button-add-transaction">
              <Plus className="w-4 h-4 mr-2" />
              Nova Transação
            </Button>
          </DialogTrigger>
          <DialogContent className="sm:max-w-md" data-testid="dialog-transaction">
            <DialogHeader>
              <DialogTitle>{editingTransaction ? "Editar" : "Nova"} Transação</DialogTitle>
              <DialogDescription>
                {editingTransaction ? "Atualize" : "Adicione"} os detalhes da transação
              </DialogDescription>
            </DialogHeader>
            <Form {...form}>
              <form onSubmit={form.handleSubmit(handleSubmit)} className="space-y-4">
                <FormField
                  control={form.control}
                  name="title"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>Título *</FormLabel>
                      <FormControl>
                        <Input placeholder="Ex: Aluguel, Conta de Luz..." {...field} data-testid="input-title" />
                      </FormControl>
                      <FormMessage />
                    </FormItem>
                  )}
                />
                <div className="grid grid-cols-2 gap-4">
                  <FormField
                    control={form.control}
                    name="amount"
                    render={({ field }) => (
                      <FormItem>
                        <FormLabel>Valor (R$) *</FormLabel>
                        <FormControl>
                          <Input
                            type="text"
                            inputMode="numeric"
                            placeholder="46.000.00"
                            value={field.value || ''}
                            onChange={(e) => {
                              const formatted = formatCurrencyInput(e.target.value);
                              field.onChange(formatted);
                            }}
                            onBlur={field.onBlur}
                            name={field.name}
                            ref={field.ref}
                            data-testid="input-amount"
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
                        <FormLabel>Data *</FormLabel>
                        <FormControl>
                          <Input 
                            type="date" 
                            {...field}
                            value={typeof field.value === 'string' ? field.value : new Date(field.value).toISOString().split('T')[0]}
                            data-testid="input-date" 
                          />
                        </FormControl>
                        <FormMessage />
                      </FormItem>
                    )}
                  />
                </div>
                <FormField
                  control={form.control}
                  name="categoryId"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>Categoria *</FormLabel>
                      <Select onValueChange={field.onChange} value={field.value}>
                        <FormControl>
                          <SelectTrigger data-testid="select-category">
                            <SelectValue placeholder="Selecione uma categoria" />
                          </SelectTrigger>
                        </FormControl>
                        <SelectContent>
                          {categories?.map((cat) => (
                            <SelectItem key={cat.id} value={cat.id}>
                              {cat.name}
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
                  render={({ field}) => (
                    <FormItem>
                      <FormLabel>Status</FormLabel>
                      <Select onValueChange={field.onChange} value={field.value || "unpaid"}>
                        <FormControl>
                          <SelectTrigger data-testid="select-status">
                            <SelectValue />
                          </SelectTrigger>
                        </FormControl>
                        <SelectContent>
                          <SelectItem value="unpaid">Não Pago</SelectItem>
                          <SelectItem value="paid">Pago</SelectItem>
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
                          <SelectItem value="none">Sem Recorrência</SelectItem>
                          <SelectItem value="monthly">Mensal</SelectItem>
                          <SelectItem value="weekly">Semanal</SelectItem>
                          <SelectItem value="biweekly">Quinzenal</SelectItem>
                          <SelectItem value="monthly_variable">Mensal (Valor Variável)</SelectItem>
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
                      <FormLabel>Observações</FormLabel>
                      <FormControl>
                        <Textarea placeholder="Notas adicionais..." {...field} value={field.value || ""} data-testid="textarea-notes" />
                      </FormControl>
                      <FormMessage />
                    </FormItem>
                  )}
                />
                <div className="flex justify-end gap-3">
                  <Button type="button" variant="outline" onClick={handleClose} data-testid="button-cancel">
                    Cancelar
                  </Button>
                  <Button type="submit" disabled={createMutation.isPending || updateMutation.isPending} data-testid="button-save">
                    {createMutation.isPending || updateMutation.isPending ? "Salvando..." : "Salvar"}
                  </Button>
                </div>
              </form>
            </Form>
          </DialogContent>
        </Dialog>
      </div>

      <Card className="p-4">
        <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
          <div className="relative">
            <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-muted-foreground w-4 h-4" />
            <Input
              placeholder="Buscar transações..."
              className="pl-10"
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              data-testid="input-search"
            />
          </div>
          <Select value={filterCategory} onValueChange={setFilterCategory}>
            <SelectTrigger data-testid="filter-category">
              <SelectValue placeholder="Todas as categorias" />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="all">Todas as categorias</SelectItem>
              {categories?.map((cat) => (
                <SelectItem key={cat.id} value={cat.id}>
                  {cat.name}
                </SelectItem>
              ))}
            </SelectContent>
          </Select>
          <Select value={filterStatus} onValueChange={setFilterStatus}>
            <SelectTrigger data-testid="filter-status">
              <SelectValue placeholder="Todos os status" />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="all">Todos os status</SelectItem>
              <SelectItem value="paid">Pagos</SelectItem>
              <SelectItem value="unpaid">Não Pagos</SelectItem>
            </SelectContent>
          </Select>
        </div>
      </Card>

      <Card>
        <Table>
          <TableHeader>
            <TableRow>
              <TableHead data-testid="header-title">Título</TableHead>
              <TableHead data-testid="header-category">Categoria</TableHead>
              <TableHead data-testid="header-date">Data</TableHead>
              <TableHead data-testid="header-amount">Valor</TableHead>
              <TableHead data-testid="header-status">Status</TableHead>
              <TableHead className="text-right" data-testid="header-actions">Ações</TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            {filteredTransactions.length === 0 ? (
              <TableRow>
                <TableCell colSpan={6} className="text-center py-8 text-muted-foreground" data-testid="text-no-transactions">
                  Nenhuma transação encontrada
                </TableCell>
              </TableRow>
            ) : (
              filteredTransactions.map((transaction) => {
                const category = categories?.find((c) => c.id === transaction.categoryId);
                return (
                  <TableRow key={transaction.id} data-testid={`row-transaction-${transaction.id}`}>
                    <TableCell className="font-medium" data-testid={`text-title-${transaction.id}`}>{transaction.title}</TableCell>
                    <TableCell data-testid={`text-category-${transaction.id}`}>
                      <Badge variant="outline" style={{ borderColor: category?.color || undefined }}>
                        {category?.name || "Sem categoria"}
                      </Badge>
                    </TableCell>
                    <TableCell data-testid={`text-date-${transaction.id}`}>{new Date(transaction.date).toLocaleDateString("pt-BR")}</TableCell>
                    <TableCell className="font-semibold" data-testid={`text-amount-${transaction.id}`}>{formatCurrencyDisplay(Number(transaction.amount))}</TableCell>
                    <TableCell data-testid={`badge-status-${transaction.id}`}>
                      <Badge variant={transaction.status === "paid" ? "default" : "secondary"}>
                        {transaction.status === "paid" ? "Pago" : "Pendente"}
                      </Badge>
                    </TableCell>
                    <TableCell className="text-right">
                      <div className="flex justify-end gap-2">
                        <Button
                          size="sm"
                          variant="ghost"
                          onClick={() => handleEdit(transaction)}
                          data-testid={`button-edit-${transaction.id}`}
                        >
                          <Pencil className="w-4 h-4" />
                        </Button>
                        <Button
                          size="sm"
                          variant="ghost"
                          onClick={() => {
                            if (confirm("Tem certeza que deseja excluir esta transação?")) {
                              deleteMutation.mutate(transaction.id);
                            }
                          }}
                          data-testid={`button-delete-${transaction.id}`}
                        >
                          <Trash2 className="w-4 h-4 text-destructive" />
                        </Button>
                      </div>
                    </TableCell>
                  </TableRow>
                );
              })
            )}
          </TableBody>
        </Table>
      </Card>
    </div>
  );
}
