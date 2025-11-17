import { useState } from "react";
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
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from "@/components/ui/dialog";
import { Badge } from "@/components/ui/badge";
import { Plus, Pencil, Trash2, FolderKanban } from "lucide-react";
import type { Category } from "@shared/schema";
import { insertCategorySchema } from "@shared/schema";
import { useToast } from "@/hooks/use-toast";
import { apiRequest, queryClient } from "@/lib/queryClient";
import { Skeleton } from "@/components/ui/skeleton";
import { useAuth } from "@/hooks/useAuth";
import { z } from "zod";

const formSchema = insertCategorySchema.extend({
  name: z.string().min(1, "Digite o nome da categoria"),
});

type FormValues = z.infer<typeof formSchema>;

const colorOptions = [
  { name: "Azul", value: "#3B82F6" },
  { name: "Verde", value: "#10B981" },
  { name: "Roxo", value: "#8B5CF6" },
  { name: "Rosa", value: "#EC4899" },
  { name: "Laranja", value: "#F59E0B" },
  { name: "Ciano", value: "#06B6D4" },
  { name: "Vermelho", value: "#EF4444" },
  { name: "Índigo", value: "#6366F1" },
  { name: "Amarelo", value: "#F97316" },
  { name: "Cinza", value: "#64748B" },
];

export default function Categories() {
  const { toast } = useToast();
  const { user } = useAuth();
  const [open, setOpen] = useState(false);
  const [editingCategory, setEditingCategory] = useState<Category | null>(null);

  const form = useForm<FormValues>({
    resolver: zodResolver(formSchema),
    defaultValues: {
      name: "",
      color: colorOptions[0].value,
      userId: "",
      isDefault: false,
    },
  });

  const { data: categories, isLoading } = useQuery<Category[]>({
    queryKey: ["/api/categories"],
    retry: false,
  });

  const createMutation = useMutation({
    mutationFn: async (data: any) => {
      await apiRequest("POST", "/api/categories", data);
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["/api/categories"] });
      toast({ title: "Sucesso!", description: "Categoria criada com sucesso." });
      handleClose();
    },
    onError: () => {
      toast({ title: "Erro", description: "Não foi possível criar a categoria.", variant: "destructive" });
    },
  });

  const updateMutation = useMutation({
    mutationFn: async ({ id, data }: { id: string; data: any }) => {
      await apiRequest("PATCH", `/api/categories/${id}`, data);
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["/api/categories"] });
      toast({ title: "Sucesso!", description: "Categoria atualizada com sucesso." });
      handleClose();
    },
    onError: () => {
      toast({ title: "Erro", description: "Não foi possível atualizar a categoria.", variant: "destructive" });
    },
  });

  const deleteMutation = useMutation({
    mutationFn: async (id: string) => {
      await apiRequest("DELETE", `/api/categories/${id}`);
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["/api/categories"] });
      toast({ title: "Sucesso!", description: "Categoria excluída com sucesso." });
    },
    onError: () => {
      toast({ title: "Erro", description: "Não foi possível excluir a categoria.", variant: "destructive" });
    },
  });

  const handleClose = () => {
    setOpen(false);
    setEditingCategory(null);
    form.reset();
  };

  const handleSubmit = (values: FormValues) => {
    const data = {
      ...values,
      userId: user?.id || "",
    };
    
    if (editingCategory) {
      updateMutation.mutate({ id: editingCategory.id, data });
    } else {
      createMutation.mutate(data);
    }
  };

  const handleEdit = (category: Category) => {
    setEditingCategory(category);
    form.reset({
      name: category.name,
      color: category.color || colorOptions[0].value,
      userId: category.userId,
      isDefault: category.isDefault || false,
    });
    setOpen(true);
  };

  const handleDelete = (category: Category) => {
    if (category.isDefault) {
      toast({
        title: "Atenção",
        description: "Categorias padrão não podem ser excluídas.",
        variant: "destructive",
      });
      return;
    }

    if (confirm(`Tem certeza que deseja excluir a categoria "${category.name}"?`)) {
      deleteMutation.mutate(category.id);
    }
  };

  const defaultCategories = categories?.filter((c) => c.isDefault) || [];
  const customCategories = categories?.filter((c) => !c.isDefault) || [];

  if (isLoading) {
    return (
      <div className="p-6 space-y-6">
        <Skeleton className="h-8 w-64" data-testid="skeleton-loading" />
        <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
          {[1, 2, 3, 4, 5, 6].map((i) => (
            <Skeleton key={i} className="h-32" />
          ))}
        </div>
      </div>
    );
  }

  return (
    <div className="p-6 space-y-6 animate-fade-in">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold tracking-tight" data-testid="heading-categories">Categorias</h1>
          <p className="text-muted-foreground">Organize seus gastos com categorias personalizadas</p>
        </div>
        <Dialog open={open} onOpenChange={setOpen}>
          <DialogTrigger asChild>
            <Button data-testid="button-add-category">
              <Plus className="w-4 h-4 mr-2" />
              Nova Categoria
            </Button>
          </DialogTrigger>
          <DialogContent className="sm:max-w-md" data-testid="dialog-category">
            <DialogHeader>
              <DialogTitle>{editingCategory ? "Editar" : "Nova"} Categoria</DialogTitle>
              <DialogDescription>
                {editingCategory ? "Atualize" : "Crie"} uma categoria para organizar suas transações
              </DialogDescription>
            </DialogHeader>
            <Form {...form}>
              <form onSubmit={form.handleSubmit(handleSubmit)} className="space-y-4">
                <FormField
                  control={form.control}
                  name="name"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>Nome da Categoria *</FormLabel>
                      <FormControl>
                        <Input placeholder="Ex: Alimentação, Transporte..." {...field} data-testid="input-category-name" />
                      </FormControl>
                      <FormMessage />
                    </FormItem>
                  )}
                />
                <FormField
                  control={form.control}
                  name="color"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>Cor</FormLabel>
                      <FormControl>
                        <div className="grid grid-cols-5 gap-2">
                          {colorOptions.map((color) => (
                            <button
                              key={color.value}
                              type="button"
                              className={`w-full h-12 rounded-lg border-2 transition-all hover-elevate ${
                                field.value === color.value ? "ring-2 ring-primary ring-offset-2" : ""
                              }`}
                              style={{ backgroundColor: color.value }}
                              onClick={() => field.onChange(color.value)}
                              title={color.name}
                              data-testid={`color-${color.name.toLowerCase()}`}
                            />
                          ))}
                        </div>
                      </FormControl>
                      <FormMessage />
                    </FormItem>
                  )}
                />
                <div className="flex justify-end gap-3 pt-4">
                  <Button type="button" variant="outline" onClick={handleClose} data-testid="button-cancel">
                    Cancelar
                  </Button>
                  <Button
                    type="submit"
                    disabled={createMutation.isPending || updateMutation.isPending}
                    data-testid="button-save-category"
                  >
                    {createMutation.isPending || updateMutation.isPending ? "Salvando..." : "Salvar"}
                  </Button>
                </div>
              </form>
            </Form>
          </DialogContent>
        </Dialog>
      </div>

      {defaultCategories.length > 0 && (
        <div>
          <h2 className="text-lg font-semibold mb-4" data-testid="heading-default-categories">Categorias Padrão</h2>
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
            {defaultCategories.map((category) => (
              <Card key={category.id} className="p-4" data-testid={`card-category-${category.id}`}>
                <div className="flex items-start gap-3">
                  <div
                    className="w-12 h-12 rounded-lg flex items-center justify-center flex-shrink-0"
                    style={{ backgroundColor: `${category.color || '#3B82F6'}20` }}
                    data-testid={`icon-category-${category.id}`}
                  >
                    <FolderKanban className="w-6 h-6" style={{ color: category.color || '#3B82F6' }} />
                  </div>
                  <div className="flex-1 min-w-0">
                    <h3 className="font-semibold truncate" data-testid={`text-name-${category.id}`}>{category.name}</h3>
                    <Badge variant="outline" className="mt-2" data-testid={`badge-default-${category.id}`}>Padrão</Badge>
                  </div>
                </div>
              </Card>
            ))}
          </div>
        </div>
      )}

      <div>
        <h2 className="text-lg font-semibold mb-4" data-testid="heading-custom-categories">Categorias Personalizadas</h2>
        {customCategories.length === 0 ? (
          <Card className="p-12 text-center text-muted-foreground">
            <FolderKanban className="w-12 h-12 mx-auto mb-4 opacity-50" />
            <p className="mb-2" data-testid="text-no-categories">Nenhuma categoria personalizada criada</p>
            <p className="text-sm">Crie categorias que façam sentido para você</p>
          </Card>
        ) : (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
            {customCategories.map((category) => (
              <Card key={category.id} className="p-4 hover-elevate" data-testid={`card-category-${category.id}`}>
                <div className="flex items-start gap-3">
                  <div
                    className="w-12 h-12 rounded-lg flex items-center justify-center flex-shrink-0"
                    style={{ backgroundColor: `${category.color || '#3B82F6'}20` }}
                    data-testid={`icon-category-${category.id}`}
                  >
                    <FolderKanban className="w-6 h-6" style={{ color: category.color || '#3B82F6' }} />
                  </div>
                  <div className="flex-1 min-w-0">
                    <h3 className="font-semibold truncate" data-testid={`text-name-${category.id}`}>{category.name}</h3>
                    <div className="flex gap-2 mt-3">
                      <Button
                        size="sm"
                        variant="outline"
                        onClick={() => handleEdit(category)}
                        data-testid={`button-edit-${category.id}`}
                      >
                        <Pencil className="w-4 h-4" />
                      </Button>
                      <Button
                        size="sm"
                        variant="outline"
                        onClick={() => handleDelete(category)}
                        data-testid={`button-delete-${category.id}`}
                      >
                        <Trash2 className="w-4 h-4 text-destructive" />
                      </Button>
                    </div>
                  </div>
                </div>
              </Card>
            ))}
          </div>
        )}
      </div>
    </div>
  );
}
