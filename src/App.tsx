import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { BrowserRouter, Route, Routes } from "react-router-dom";
import { Toaster as Sonner } from "@/components/ui/sonner";
import { Toaster } from "@/components/ui/toaster";
import { TooltipProvider } from "@/components/ui/tooltip";
import MainLayout from "./layouts/MainLayout";
import Dashboard from "./pages/Dashboard";
import Login from "./pages/Login";
import Register from "./pages/Register";
import ForgotPassword from "./pages/ForgotPassword";
import Questions from "./pages/Questions";
import Simulados from "./pages/Simulados";
import Essay from "./pages/Essay";
import Chatbot from "./pages/Chatbot";
import PvP from "./pages/PvP";
import Ranking from "./pages/Ranking";
import Profile from "./pages/Profile";
import Statistics from "./pages/Statistics";
import Store from "./pages/Store";
import LandingPage from "./pages/LandingPage";
import NotFound from "./pages/NotFound";

const queryClient = new QueryClient();

const App = () => (
  <QueryClientProvider client={queryClient}>
    <TooltipProvider>
      <Toaster />
      <Sonner />
      <BrowserRouter>
        <Routes>
          {/* Auth routes (no sidebar) */}
          <Route path="/" element={<LandingPage />} />
          <Route path="/login" element={<Login />} />
          <Route path="/registro" element={<Register />} />
          <Route path="/esqueci-senha" element={<ForgotPassword />} />

          {/* App routes (with sidebar layout) */}
          <Route element={<MainLayout />}>
            <Route path="/dashboard" element={<Dashboard />} />
            <Route path="/questoes" element={<Questions />} />
            <Route path="/simulados" element={<Simulados />} />
            <Route path="/redacao" element={<Essay />} />
            <Route path="/chatbot" element={<Chatbot />} />
            <Route path="/pvp" element={<PvP />} />
            <Route path="/ranking" element={<Ranking />} />
            <Route path="/perfil" element={<Profile />} />
            <Route path="/estatisticas" element={<Statistics />} />
            <Route path="/loja" element={<Store />} />
          </Route>

          <Route path="*" element={<NotFound />} />
        </Routes>
      </BrowserRouter>
    </TooltipProvider>
  </QueryClientProvider>
);

export default App;
