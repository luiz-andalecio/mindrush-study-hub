import { Outlet, useNavigate } from 'react-router-dom';
import { useEffect } from 'react';
import { SidebarProvider } from '@/components/ui/sidebar';
import { AppSidebar } from '@/components/AppSidebar';
import { Topbar } from '@/components/Topbar';
import { authService } from '@/services/authService';

export default function MainLayout() {
  const navigate = useNavigate();

  useEffect(() => {
    // Proteção simples de rotas:
    // se não tiver token, manda para o login.
    // (MVP: sem refresh token, sem roles, etc.)
    if (!authService.isAuthenticated()) {
      navigate('/login');
    }
  }, [navigate]);

  return (
    <SidebarProvider>
      <div className="min-h-screen flex w-full">
        <AppSidebar />
        <div className="flex-1 flex flex-col min-h-screen">
          <Topbar />
          <main className="flex-1 p-6 overflow-auto">
            <Outlet />
          </main>
        </div>
      </div>
    </SidebarProvider>
  );
}
