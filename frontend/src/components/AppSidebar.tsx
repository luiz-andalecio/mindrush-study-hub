import {
  LayoutDashboard, FileQuestion, ClipboardList, PenTool,
  MessageCircle, Swords, Trophy, User, BarChart3,
  ShoppingBag, Zap
} from 'lucide-react';
import { NavLink } from '@/components/NavLink';
import { useLocation } from 'react-router-dom';
import {
  Sidebar, SidebarContent, SidebarGroup, SidebarGroupContent,
  SidebarGroupLabel, SidebarMenu, SidebarMenuButton, SidebarMenuItem,
  useSidebar,
} from '@/components/ui/sidebar';

const mainItems = [
  { title: 'Dashboard', url: '/dashboard', icon: LayoutDashboard },
  { title: 'Questões', url: '/questoes', icon: FileQuestion },
  { title: 'Simulados', url: '/simulados', icon: ClipboardList },
  { title: 'Redação IA', url: '/redacao', icon: PenTool },
  { title: 'Chatbot', url: '/chatbot', icon: MessageCircle },
  { title: 'PvP', url: '/pvp', icon: Swords },
];

const socialItems = [
  { title: 'Ranking', url: '/ranking', icon: Trophy },
  { title: 'Estatísticas', url: '/estatisticas', icon: BarChart3 },
  { title: 'Loja', url: '/loja', icon: ShoppingBag },
  { title: 'Perfil', url: '/perfil', icon: User },
];

export function AppSidebar() {
  const { state } = useSidebar();
  const collapsed = state === 'collapsed';
  const location = useLocation();

  return (
    <Sidebar collapsible="icon" className="border-r border-border">
      <SidebarContent>
        {/* Logo */}
        <div className="p-4 flex items-center gap-3">
          <div className="w-8 h-8 rounded-lg gradient-primary flex items-center justify-center flex-shrink-0">
            <Zap className="w-5 h-5 text-primary-foreground" />
          </div>
          {!collapsed && (
            <span className="font-display text-xl font-bold text-gradient">MindRush</span>
          )}
        </div>

        <SidebarGroup>
          <SidebarGroupLabel>Estudos</SidebarGroupLabel>
          <SidebarGroupContent>
            <SidebarMenu>
              {mainItems.map((item) => (
                <SidebarMenuItem key={item.title}>
                  <SidebarMenuButton asChild isActive={location.pathname === item.url}>
                    <NavLink to={item.url} end activeClassName="gradient-primary text-primary-foreground">
                      <item.icon className="mr-2 h-4 w-4" />
                      {!collapsed && <span>{item.title}</span>}
                    </NavLink>
                  </SidebarMenuButton>
                </SidebarMenuItem>
              ))}
            </SidebarMenu>
          </SidebarGroupContent>
        </SidebarGroup>

        <SidebarGroup>
          <SidebarGroupLabel>Social</SidebarGroupLabel>
          <SidebarGroupContent>
            <SidebarMenu>
              {socialItems.map((item) => (
                <SidebarMenuItem key={item.title}>
                  <SidebarMenuButton asChild isActive={location.pathname === item.url}>
                    <NavLink to={item.url} end activeClassName="gradient-primary text-primary-foreground">
                      <item.icon className="mr-2 h-4 w-4" />
                      {!collapsed && <span>{item.title}</span>}
                    </NavLink>
                  </SidebarMenuButton>
                </SidebarMenuItem>
              ))}
            </SidebarMenu>
          </SidebarGroupContent>
        </SidebarGroup>
      </SidebarContent>
    </Sidebar>
  );
}
