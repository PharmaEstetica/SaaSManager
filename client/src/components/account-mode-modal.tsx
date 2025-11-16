import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import {
  Form,
  FormControl,
  FormField,
  FormItem,
  FormLabel,
  FormMessage,
} from "@/components/ui/form";
import { Card } from "@/components/ui/card";
import { Building2, User, CheckCircle2 } from "lucide-react";
import { useMutation, useQueryClient } from "@tanstack/react-query";
import { apiRequest } from "@/lib/queryClient";
import { useToast } from "@/hooks/use-toast";
import { updateAccountTypeSchema } from "@shared/schema";
import { z } from "zod";

const formSchema = updateAccountTypeSchema.extend({
  companyName: z.string().optional(),
  cnpj: z.string().optional(),
});

type FormValues = z.infer<typeof formSchema>;

interface AccountModeModalProps {
  open: boolean;
  onClose: () => void;
  currentAccountType?: "personal" | "business" | null;
}

export function AccountModeModal({ open, onClose, currentAccountType }: AccountModeModalProps) {
  const queryClient = useQueryClient();
  const { toast } = useToast();

  const form = useForm<FormValues>({
    resolver: zodResolver(formSchema),
    defaultValues: {
      accountType: currentAccountType || "personal",
      companyName: "",
      cnpj: "",
    },
  });

  const selectedMode = form.watch("accountType");

  const updateAccountMutation = useMutation({
    mutationFn: async (data: FormValues) => {
      await apiRequest("PATCH", "/api/account-settings", data);
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["/api/auth/user"] });
      toast({
        title: "Sucesso!",
        description: "Modo de conta atualizado com sucesso.",
      });
      onClose();
    },
    onError: () => {
      toast({
        title: "Erro",
        description: "Não foi possível atualizar o modo da conta.",
        variant: "destructive",
      });
    },
  });

  const handleSubmit = (values: FormValues) => {
    if (values.accountType === "business" && (!values.companyName?.trim() || !values.cnpj?.trim())) {
      toast({
        title: "Atenção",
        description: "Por favor, preencha o nome da empresa e CNPJ.",
        variant: "destructive",
      });
      return;
    }

    updateAccountMutation.mutate(values);
  };

  return (
    <Dialog open={open} onOpenChange={(isOpen) => !isOpen && onClose()}>
      <DialogContent className="sm:max-w-2xl" data-testid="dialog-account-mode">
        <DialogHeader>
          <DialogTitle className="text-2xl font-bold">Escolha seu Modo de Gestão</DialogTitle>
          <DialogDescription>
            Selecione como você deseja gerenciar suas finanças. Você pode alterar isso depois nas configurações.
          </DialogDescription>
        </DialogHeader>

        <Form {...form}>
          <form onSubmit={form.handleSubmit(handleSubmit)} className="space-y-6">
            <FormField
              control={form.control}
              name="accountType"
              render={({ field }) => (
                <FormItem>
                  <FormControl>
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                      <Card
                        className={`p-6 cursor-pointer transition-all hover-elevate ${
                          field.value === "personal" ? "ring-2 ring-primary" : ""
                        }`}
                        onClick={() => field.onChange("personal")}
                        data-testid="card-mode-personal"
                      >
                        <div className="flex flex-col items-center text-center gap-4">
                          <div className="w-16 h-16 rounded-full bg-primary/10 flex items-center justify-center">
                            <User className="w-8 h-8 text-primary" />
                          </div>
                          <div>
                            <h3 className="font-semibold text-lg mb-2 flex items-center justify-center gap-2">
                              Pessoal
                              {field.value === "personal" && (
                                <CheckCircle2 className="w-5 h-5 text-primary" data-testid="icon-selected-personal" />
                              )}
                            </h3>
                            <p className="text-sm text-muted-foreground">
                              Ideal para controle de finanças pessoais, gastos do dia a dia e orçamento familiar.
                            </p>
                          </div>
                        </div>
                      </Card>

                      <Card
                        className={`p-6 cursor-pointer transition-all hover-elevate ${
                          field.value === "business" ? "ring-2 ring-primary" : ""
                        }`}
                        onClick={() => field.onChange("business")}
                        data-testid="card-mode-business"
                      >
                        <div className="flex flex-col items-center text-center gap-4">
                          <div className="w-16 h-16 rounded-full bg-primary/10 flex items-center justify-center">
                            <Building2 className="w-8 h-8 text-primary" />
                          </div>
                          <div>
                            <h3 className="font-semibold text-lg mb-2 flex items-center justify-center gap-2">
                              Empresarial (PJ)
                              {field.value === "business" && (
                                <CheckCircle2 className="w-5 h-5 text-primary" data-testid="icon-selected-business" />
                              )}
                            </h3>
                            <p className="text-sm text-muted-foreground">
                              Perfeito para empresas, com folha de pagamento, despesas operacionais e muito mais.
                            </p>
                          </div>
                        </div>
                      </Card>
                    </div>
                  </FormControl>
                  <FormMessage />
                </FormItem>
              )}
            />

            {selectedMode === "business" && (
              <div className="space-y-4 animate-fade-in">
                <FormField
                  control={form.control}
                  name="companyName"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>Nome da Empresa</FormLabel>
                      <FormControl>
                        <Input placeholder="Minha Empresa Ltda" {...field} data-testid="input-company-name" />
                      </FormControl>
                      <FormMessage />
                    </FormItem>
                  )}
                />
                <FormField
                  control={form.control}
                  name="cnpj"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>CNPJ</FormLabel>
                      <FormControl>
                        <Input placeholder="00.000.000/0000-00" {...field} data-testid="input-cnpj" />
                      </FormControl>
                      <FormMessage />
                    </FormItem>
                  )}
                />
              </div>
            )}

            <div className="flex justify-end gap-3 pt-4">
              {currentAccountType && (
                <Button type="button" variant="outline" onClick={onClose} data-testid="button-cancel">
                  Cancelar
                </Button>
              )}
              <Button
                type="submit"
                disabled={updateAccountMutation.isPending}
                data-testid="button-save-mode"
              >
                {updateAccountMutation.isPending ? "Salvando..." : "Continuar"}
              </Button>
            </div>
          </form>
        </Form>
      </DialogContent>
    </Dialog>
  );
}
