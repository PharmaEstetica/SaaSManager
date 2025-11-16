import { Button } from "@/components/ui/button";
import { Card } from "@/components/ui/card";
import { useLocation } from "wouter";
import { 
  TrendingUp, 
  PieChart, 
  Calendar, 
  Shield,
  Sparkles,
  BarChart3,
  ArrowRight,
  LogIn
} from "lucide-react";

export default function Landing() {
  const [_, setLocation] = useLocation();

  return (
    <div className="min-h-screen bg-gradient-to-b from-background via-background to-card">
      {/* Hero Section */}
      <div className="container mx-auto px-4 py-20">
        <div className="max-w-4xl mx-auto text-center space-y-8">
          <div className="inline-flex items-center gap-2 px-4 py-2 rounded-full bg-primary/10 text-primary text-sm font-medium mb-4">
            <Sparkles className="w-4 h-4" />
            <span>Gestão Financeira Inteligente</span>
          </div>
          
          <h1 className="text-5xl md:text-6xl font-bold tracking-tight animate-fade-in">
            Controle Total das suas{" "}
            <span className="bg-gradient-to-r from-primary to-chart-2 bg-clip-text text-transparent">
              Finanças
            </span>
          </h1>
          
          <p className="text-xl text-muted-foreground max-w-2xl mx-auto animate-fade-in">
            Visualize gastos semanais, crie relatórios comparativos e tome decisões financeiras mais inteligentes. 
            Seja para sua vida pessoal ou empresa.
          </p>

          <div className="flex flex-col sm:flex-row gap-4 justify-center items-center animate-fade-in">
            <Button 
              size="lg" 
              className="w-full sm:w-auto"
              onClick={() => setLocation("/register")}
              data-testid="button-register-cta"
            >
              Criar Conta Grátis
              <ArrowRight className="ml-2 w-4 h-4" />
            </Button>
            <Button 
              size="lg" 
              variant="outline"
              className="w-full sm:w-auto"
              onClick={() => setLocation("/login")}
              data-testid="button-login-cta"
            >
              <LogIn className="mr-2 w-4 h-4" />
              Entrar
            </Button>
          </div>
        </div>

        {/* Features Grid */}
        <div className="grid grid-cols-1 md:grid-cols-3 gap-6 mt-24 max-w-5xl mx-auto">
          <Card className="p-6 hover-elevate transition-all">
            <div className="w-12 h-12 rounded-lg bg-primary/10 flex items-center justify-center mb-4">
              <Calendar className="w-6 h-6 text-primary" />
            </div>
            <h3 className="text-lg font-semibold mb-2">Visualização Semanal</h3>
            <p className="text-muted-foreground text-sm">
              Veja seus gastos organizados por semana do mês. Identifique padrões e planeje melhor.
            </p>
          </Card>

          <Card className="p-6 hover-elevate transition-all">
            <div className="w-12 h-12 rounded-lg bg-chart-2/10 flex items-center justify-center mb-4">
              <BarChart3 className="w-6 h-6 text-chart-2" />
            </div>
            <h3 className="text-lg font-semibold mb-2">Relatórios Comparativos</h3>
            <p className="text-muted-foreground text-sm">
              Compare mês atual vs anterior. Entenda onde seu dinheiro está indo com gráficos interativos.
            </p>
          </Card>

          <Card className="p-6 hover-elevate transition-all">
            <div className="w-12 h-12 rounded-lg bg-success/10 flex items-center justify-center mb-4">
              <PieChart className="w-6 h-6 text-success" />
            </div>
            <h3 className="text-lg font-semibold mb-2">Categorias Personalizadas</h3>
            <p className="text-muted-foreground text-sm">
              Crie suas próprias categorias de gastos. Organize do seu jeito, como faz sentido para você.
            </p>
          </Card>
        </div>

        {/* Benefits Section */}
        <div className="mt-32 max-w-5xl mx-auto">
          <div className="text-center mb-16">
            <h2 className="text-3xl md:text-4xl font-bold mb-4">
              Por que escolher o FinanceFlow?
            </h2>
            <p className="text-muted-foreground text-lg">
              Recursos pensados para facilitar sua vida financeira
            </p>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
            <div className="flex gap-4">
              <div className="flex-shrink-0">
                <div className="w-10 h-10 rounded-full bg-primary/10 flex items-center justify-center">
                  <TrendingUp className="w-5 h-5 text-primary" />
                </div>
              </div>
              <div>
                <h3 className="font-semibold text-lg mb-2">Recorrências Inteligentes</h3>
                <p className="text-muted-foreground">
                  Gastos fixos, mensais, semanais ou quinzenais. Até valores variáveis que repetem todo mês.
                </p>
              </div>
            </div>

            <div className="flex gap-4">
              <div className="flex-shrink-0">
                <div className="w-10 h-10 rounded-full bg-success/10 flex items-center justify-center">
                  <Shield className="w-5 h-5 text-success" />
                </div>
              </div>
              <div>
                <h3 className="font-semibold text-lg mb-2">Seguro e Privado</h3>
                <p className="text-muted-foreground">
                  Seus dados financeiros são criptografados e protegidos. Nível bancário de segurança.
                </p>
              </div>
            </div>

            <div className="flex gap-4">
              <div className="flex-shrink-0">
                <div className="w-10 h-10 rounded-full bg-chart-2/10 flex items-center justify-center">
                  <BarChart3 className="w-5 h-5 text-chart-2" />
                </div>
              </div>
              <div>
                <h3 className="font-semibold text-lg mb-2">Modo Pessoal & Empresarial</h3>
                <p className="text-muted-foreground">
                  Gerencie finanças pessoais ou empresariais. Inclui folha de pagamento para PJ.
                </p>
              </div>
            </div>

            <div className="flex gap-4">
              <div className="flex-shrink-0">
                <div className="w-10 h-10 rounded-full bg-warning/10 flex items-center justify-center">
                  <Sparkles className="w-5 h-5 text-warning" />
                </div>
              </div>
              <div>
                <h3 className="font-semibold text-lg mb-2">Recomendações Automáticas</h3>
                <p className="text-muted-foreground">
                  Receba dicas de economia baseadas nos seus padrões de gasto.
                </p>
              </div>
            </div>
          </div>
        </div>

        {/* CTA Section */}
        <div className="mt-32 text-center">
          <Card className="p-12 bg-gradient-to-br from-primary/5 to-chart-2/5 border-primary/20">
            <h2 className="text-3xl md:text-4xl font-bold mb-4">
              Pronto para transformar suas finanças?
            </h2>
            <p className="text-muted-foreground text-lg mb-8 max-w-2xl mx-auto">
              Comece grátis agora. Sem cartão de crédito necessário.
            </p>
            <Button 
              size="lg"
              onClick={() => window.location.href = "/api/login"}
              data-testid="button-cta-login"
            >
              Começar Gratuitamente
              <ArrowRight className="ml-2 w-4 h-4" />
            </Button>
          </Card>
        </div>
      </div>

      {/* Footer */}
      <footer className="border-t mt-32">
        <div className="container mx-auto px-4 py-8">
          <div className="text-center text-sm text-muted-foreground">
            <p>© 2024 FinanceFlow. Gestão financeira inteligente.</p>
            <p className="mt-2 flex items-center justify-center gap-2">
              <Shield className="w-4 h-4" />
              Criptografia de nível bancário
            </p>
          </div>
        </div>
      </footer>
    </div>
  );
}
