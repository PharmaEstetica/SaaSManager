import { useState } from "react";
import { Card } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Building2, User, Settings as SettingsIcon } from "lucide-react";
import { useAuth } from "@/hooks/useAuth";
import { Skeleton } from "@/components/ui/skeleton";
import { AccountModeModal } from "@/components/account-mode-modal";

export default function Settings() {
  const { user, isLoading } = useAuth();
  const [showAccountModal, setShowAccountModal] = useState(false);

  if (isLoading) {
    return (
      <div className="p-6 space-y-6">
        <Skeleton className="h-8 w-64" />
        <Skeleton className="h-96" />
      </div>
    );
  }

  return (
    <div className="p-6 space-y-6 animate-fade-in">
      <AccountModeModal
        open={showAccountModal}
        onClose={() => setShowAccountModal(false)}
        currentAccountType={user?.accountType}
      />

      <div>
        <h1 className="text-3xl font-bold tracking-tight">Configurações</h1>
        <p className="text-muted-foreground">Gerencie suas preferências e informações da conta</p>
      </div>

      {/* Account Information */}
      <Card className="p-6">
        <h2 className="text-xl font-semibold mb-4">Informações da Conta</h2>
        <div className="space-y-4">
          <div className="flex items-center justify-between p-4 rounded-lg bg-muted/50">
            <div>
              <p className="text-sm text-muted-foreground">Email</p>
              <p className="font-medium">{user?.email || "Não informado"}</p>
            </div>
          </div>

          <div className="flex items-center justify-between p-4 rounded-lg bg-muted/50">
            <div>
              <p className="text-sm text-muted-foreground">Nome</p>
              <p className="font-medium">
                {user?.firstName && user?.lastName
                  ? `${user.firstName} ${user.lastName}`
                  : user?.firstName || user?.lastName || "Não informado"}
              </p>
            </div>
          </div>

          <div className="flex items-center justify-between p-4 rounded-lg bg-muted/50">
            <div className="flex items-center gap-3">
              <div>
                <p className="text-sm text-muted-foreground">Modo da Conta</p>
                <div className="flex items-center gap-2 mt-1">
                  {user?.accountType === "business" ? (
                    <Building2 className="w-4 h-4" />
                  ) : (
                    <User className="w-4 h-4" />
                  )}
                  <p className="font-medium">
                    {user?.accountType === "business" ? "Empresarial (PJ)" : "Pessoal"}
                  </p>
                </div>
              </div>
            </div>
            <Button
              variant="outline"
              onClick={() => setShowAccountModal(true)}
              data-testid="button-change-account-mode"
            >
              Alterar
            </Button>
          </div>

          {user?.accountType === "business" && (
            <>
              {user.companyName && (
                <div className="flex items-center justify-between p-4 rounded-lg bg-muted/50">
                  <div>
                    <p className="text-sm text-muted-foreground">Nome da Empresa</p>
                    <p className="font-medium">{user.companyName}</p>
                  </div>
                </div>
              )}
              {user.cnpj && (
                <div className="flex items-center justify-between p-4 rounded-lg bg-muted/50">
                  <div>
                    <p className="text-sm text-muted-foreground">CNPJ</p>
                    <p className="font-medium">{user.cnpj}</p>
                  </div>
                </div>
              )}
            </>
          )}
        </div>
      </Card>

      {/* Application Info */}
      <Card className="p-6">
        <h2 className="text-xl font-semibold mb-4">Sobre o Aplicativo</h2>
        <div className="space-y-3">
          <div className="flex items-center justify-between">
            <span className="text-muted-foreground">Versão</span>
            <Badge variant="outline">1.0.0</Badge>
          </div>
          <div className="flex items-center justify-between">
            <span className="text-muted-foreground">Última atualização</span>
            <span className="text-sm">Novembro 2024</span>
          </div>
        </div>
      </Card>

      {/* Help Section */}
      <Card className="p-6 bg-primary/5 border-primary/20">
        <div className="flex items-start gap-3">
          <SettingsIcon className="w-6 h-6 text-primary flex-shrink-0 mt-1" />
          <div>
            <h3 className="font-semibold mb-2">Precisa de ajuda?</h3>
            <p className="text-sm text-muted-foreground">
              Se você tiver dúvidas sobre como usar o FinanceFlow, consulte nossa documentação ou entre em contato com o suporte.
            </p>
          </div>
        </div>
      </Card>
    </div>
  );
}
