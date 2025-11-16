import { 
  LayoutDashboard, 
  Receipt, 
  BarChart3, 
  FolderKanban,
  Settings,
  Calendar,
  LogOut
} from "lucide-react";
import {
  Sidebar,
  SidebarContent,
  SidebarGroup,
  SidebarGroupContent,
  SidebarGroupLabel,
  SidebarMenu,
  SidebarMenuButton,
  SidebarMenuItem,
  SidebarFooter,
} from "@/components/ui/sidebar";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { useAuth } from "@/hooks/useAuth";
import { Button } from "@/components/ui/button";
import { Link, useLocation } from "wouter";

const menuItems = [
  {
    title: "Dashboard",
    url: "/",
    icon: LayoutDashboard,
    testId: "nav-dashboard",
  },
  {
    title: "Transações",
    url: "/transactions",
    icon: Receipt,
    testId: "nav-transactions",
  },
  {
    title: "Visualização Semanal",
    url: "/weekly-view",
    icon: Calendar,
    testId: "nav-weekly",
  },
  {
    title: "Relatórios",
    url: "/reports",
    icon: BarChart3,
    testId: "nav-reports",
  },
  {
    title: "Categorias",
    url: "/categories",
    icon: FolderKanban,
    testId: "nav-categories",
  },
  {
    title: "Configurações",
    url: "/settings",
    icon: Settings,
    testId: "nav-settings",
  },
];

export function AppSidebar() {
  const { user } = useAuth();
  const [location] = useLocation();

  const getInitials = () => {
    if (user?.firstName && user?.lastName) {
      return `${user.firstName[0]}${user.lastName[0]}`.toUpperCase();
    }
    return user?.email?.[0]?.toUpperCase() || "U";
  };

  return (
    <Sidebar data-testid="app-sidebar">
      <SidebarContent>
        <SidebarGroup>
          <div className="px-6 py-6" data-testid="sidebar-logo">
            <div className="flex items-center gap-3">
              <div className="w-10 h-10 rounded-lg bg-primary flex items-center justify-center" data-testid="logo-icon">
                <span className="text-primary-foreground font-bold text-lg">FF</span>
              </div>
              <div>
                <h1 className="font-bold text-lg" data-testid="text-app-name">FinanceFlow</h1>
                <p className="text-xs text-muted-foreground" data-testid="text-app-subtitle">Gestão Inteligente</p>
              </div>
            </div>
          </div>
          
          <SidebarGroupLabel>Navegação</SidebarGroupLabel>
          <SidebarGroupContent>
            <SidebarMenu>
              {menuItems.map((item) => (
                <SidebarMenuItem key={item.title}>
                  <SidebarMenuButton 
                    asChild
                    isActive={location === item.url}
                    data-testid={item.testId}
                  >
                    <Link href={item.url} className="flex items-center gap-3">
                      <item.icon className="w-4 h-4" />
                      <span>{item.title}</span>
                    </Link>
                  </SidebarMenuButton>
                </SidebarMenuItem>
              ))}
            </SidebarMenu>
          </SidebarGroupContent>
        </SidebarGroup>
      </SidebarContent>

      <SidebarFooter>
        <div className="p-4 space-y-4" data-testid="sidebar-footer">
          <div className="flex items-center gap-3" data-testid="user-profile">
            <Avatar className="w-10 h-10" data-testid="user-avatar">
              <AvatarImage src={user?.profileImageUrl || undefined} />
              <AvatarFallback className="bg-primary/10 text-primary" data-testid="avatar-fallback">
                {getInitials()}
              </AvatarFallback>
            </Avatar>
            <div className="flex-1 min-w-0">
              <p className="text-sm font-medium truncate" data-testid="text-user-name">
                {user?.firstName || user?.email || "Usuário"}
              </p>
              <p className="text-xs text-muted-foreground truncate" data-testid="text-account-type">
                {user?.accountType === "business" ? "Empresarial" : "Pessoal"}
              </p>
            </div>
          </div>
          <Button
            variant="outline"
            size="sm"
            className="w-full"
            onClick={async () => {
              try {
                const response = await fetch("/api/auth/logout", { 
                  method: "POST",
                  credentials: "include" 
                });
                const data = await response.json();
                if (data.redirect) {
                  window.location.href = data.redirect;
                } else {
                  window.location.href = "/";
                }
              } catch (error) {
                console.error("Logout error:", error);
                window.location.href = "/";
              }
            }}
            data-testid="button-logout"
          >
            <LogOut className="w-4 h-4 mr-2" />
            Sair
          </Button>
        </div>
      </SidebarFooter>
    </Sidebar>
  );
}
