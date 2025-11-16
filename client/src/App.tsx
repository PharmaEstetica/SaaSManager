import { Switch, Route, Redirect } from "wouter";
import { queryClient } from "./lib/queryClient";
import { QueryClientProvider } from "@tanstack/react-query";
import { Toaster } from "@/components/ui/toaster";
import { TooltipProvider } from "@/components/ui/tooltip";
import { SidebarProvider, SidebarTrigger } from "@/components/ui/sidebar";
import { AppSidebar } from "@/components/app-sidebar";
import { useAuth } from "@/hooks/useAuth";
import NotFound from "@/pages/not-found";
import Landing from "@/pages/landing";
import Login from "@/pages/login";
import Register from "@/pages/register";
import Dashboard from "@/pages/dashboard";
import Transactions from "@/pages/transactions";
import WeeklyView from "@/pages/weekly-view";
import Reports from "@/pages/reports";
import Categories from "@/pages/categories";
import Settings from "@/pages/settings";

function AuthenticatedRouter() {
  return (
    <Switch>
      <Route path="/" component={Dashboard} />
      <Route path="/dashboard" component={Dashboard} />
      <Route path="/transactions" component={Transactions} />
      <Route path="/weekly-view" component={WeeklyView} />
      <Route path="/weekly" component={WeeklyView} />
      <Route path="/reports" component={Reports} />
      <Route path="/categories" component={Categories} />
      <Route path="/settings" component={Settings} />
      <Route component={NotFound} />
    </Switch>
  );
}

function UnauthenticatedRouter() {
  return (
    <Switch>
      <Route path="/" component={Landing} />
      <Route path="/login" component={Login} />
      <Route path="/register" component={Register} />
      {/* Redirect all other routes (protected routes) to login */}
      <Route path="/dashboard">
        <Redirect to="/login" />
      </Route>
      <Route path="/transactions">
        <Redirect to="/login" />
      </Route>
      <Route path="/weekly-view">
        <Redirect to="/login" />
      </Route>
      <Route path="/weekly">
        <Redirect to="/login" />
      </Route>
      <Route path="/reports">
        <Redirect to="/login" />
      </Route>
      <Route path="/categories">
        <Redirect to="/login" />
      </Route>
      <Route path="/settings">
        <Redirect to="/login" />
      </Route>
      <Route component={NotFound} />
    </Switch>
  );
}

function AppContent() {
  const { isAuthenticated, isLoading } = useAuth();
  
  const sidebarStyle = {
    "--sidebar-width": "18rem",
    "--sidebar-width-icon": "4rem",
  } as React.CSSProperties;

  if (isLoading) {
    return (
      <div className="flex h-screen items-center justify-center">
        <div className="text-muted-foreground">Carregando...</div>
      </div>
    );
  }

  return (
    <TooltipProvider>
      {!isAuthenticated ? (
        <>
          <UnauthenticatedRouter />
          <Toaster />
        </>
      ) : (
        <SidebarProvider style={sidebarStyle}>
          <div className="flex h-screen w-full">
            <AppSidebar />
            <div className="flex flex-col flex-1 overflow-hidden">
              <header className="flex items-center justify-between p-3 border-b bg-card">
                <SidebarTrigger data-testid="button-sidebar-toggle" />
              </header>
              <main className="flex-1 overflow-y-auto bg-background">
                <AuthenticatedRouter />
              </main>
            </div>
          </div>
          <Toaster />
        </SidebarProvider>
      )}
    </TooltipProvider>
  );
}

export default function App() {
  return (
    <QueryClientProvider client={queryClient}>
      <AppContent />
    </QueryClientProvider>
  );
}
