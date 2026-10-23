import { useState, useEffect } from "react";
import { ContentProvider, useSiteContent } from "@/context/ContentContext";
import { PublicMenuView } from "@/views/PublicMenuView";
import { LoginView } from "@/views/LoginView";
import { OrdersKanbanView } from "@/views/OrdersKanbanView";
import { MenuAdminView } from "@/views/MenuAdminView";
import { QuotationView } from "@/views/QuotationView";
import { Button } from "@/components/ui/button";
import { api } from "@/services/api";
import { 
  ClipboardList, UtensilsCrossed, Calculator, 
  LogOut, Globe, Flower2, User as UserIcon 
} from "lucide-react";

type AppView = "public-menu" | "login" | "admin";
type AdminTab = "orders" | "menu" | "quotation";

function MainLayout() {
  const { content } = useSiteContent();
  const [currentView, setCurrentView] = useState<AppView>("public-menu");
  const [adminTab, setAdminTab] = useState<AdminTab>("orders");
  const [user, setUser] = useState<{ username: string; fullName: string } | null>(null);
  const [isValidating, setIsValidating] = useState(false);

  // Validación estricta del token con el backend al iniciar
  useEffect(() => {
    const token = sessionStorage.getItem("token");
    if (!token) {
      setUser(null);
      return;
    }

    setIsValidating(true);
    api.getCurrentUser()
      .then((userData) => {
        setUser({ username: userData.username, fullName: userData.fullName });
      })
      .catch(() => {
        // Token inválido, manipulado o expirado: expulsar inmediatamente
        sessionStorage.removeItem("token");
        setUser(null);
        setCurrentView("public-menu");
      })
      .finally(() => setIsValidating(false));
  }, []);

  const handleLogout = () => {
    sessionStorage.removeItem("token");
    setUser(null);
    setCurrentView("public-menu");
  };

  if (currentView === "public-menu") {
    return (
      <PublicMenuView
        onGoToLogin={() => {
          if (user) {
            setCurrentView("admin");
          } else {
            setCurrentView("login");
          }
        }}
      />
    );
  }

  if (currentView === "login") {
    return (
      <LoginView
        onLoginSuccess={(loggedInUser) => {
          setUser(loggedInUser);
          setCurrentView("admin");
        }}
        onBackToMenu={() => setCurrentView("public-menu")}
      />
    );
  }

  // Si no hay usuario autenticado o está validando, denegar render de la vista admin
  if (isValidating) {
    return (
      <div className="min-h-screen bg-boho-bg flex items-center justify-center text-boho-text-muted">
        <div className="flex flex-col items-center gap-3">
          <div className="h-8 w-8 animate-spin rounded-full border-2 border-terracotta-600 border-t-transparent" />
          <p className="text-xs uppercase tracking-wider font-semibold">Validando credenciales criptográficas...</p>
        </div>
      </div>
    );
  }

  if (!user) {
    // Si intenta acceder a vista admin sin usuario verificado por el backend
    return (
      <LoginView
        onLoginSuccess={(loggedInUser) => {
          setUser(loggedInUser);
          setCurrentView("admin");
        }}
        onBackToMenu={() => setCurrentView("public-menu")}
      />
    );
  }

  // Vista de Administración Verificada
  return (
    <div className="min-h-screen bg-boho-bg text-boho-text flex flex-col font-sans-boho">
      {/* Barra superior de Administración */}
      <header className="bg-white border-b border-boho-border-subtle sticky top-0 z-40 shadow-2xs">
        <div className="max-w-7xl mx-auto px-6 h-16 flex items-center justify-between">
          <div className="flex items-center gap-3">
            <div className="h-9 w-9 rounded-lg bg-terracotta-600 text-boho-bg flex items-center justify-center font-bold shadow-xs">
              <Flower2 className="h-5 w-5 stroke-[1.8]" />
            </div>
            <div>
              <div className="flex items-center gap-2">
                <span className="font-serif-boho font-bold text-boho-text-title text-xl tracking-tight">
                  {content.branding.businessName}
                </span>
                <span className="text-[11px] bg-boho-surface text-terracotta-700 font-semibold px-2 py-0.5 rounded-full border border-boho-border">
                  Panel Operativo
                </span>
              </div>
            </div>
          </div>

          <div className="flex items-center gap-2">
            <Button
              variant="outline"
              size="sm"
              onClick={() => setCurrentView("public-menu")}
              className="text-boho-text-muted hover:text-boho-text-title border-boho-border bg-boho-bg text-xs rounded-full"
            >
              <Globe className="h-3.5 w-3.5 mr-1.5 text-sage-500" /> Ver Menú Público
            </Button>
            <div className="h-4 w-px bg-boho-border-subtle mx-1 hidden sm:block" />
            <div className="hidden sm:flex items-center gap-2 text-xs text-boho-text-muted mr-2">
              <UserIcon className="h-3.5 w-3.5 text-boho-text-light" />
              <span className="font-medium">{user.fullName}</span>
            </div>
            <Button 
              variant="ghost" 
              size="sm" 
              onClick={handleLogout} 
              className="text-red-700 hover:bg-red-50 hover:text-red-800 text-xs rounded-full"
            >
              <LogOut className="h-3.5 w-3.5 mr-1" /> Salir
            </Button>
          </div>
        </div>

        {/* Pestañas de Navegación del Panel */}
        <div className="max-w-7xl mx-auto px-6 flex gap-2 border-t border-boho-surface">
          <button
            onClick={() => setAdminTab("orders")}
            className={`py-3 px-4 text-xs font-semibold border-b-2 flex items-center gap-2 transition-all cursor-pointer ${
              adminTab === "orders"
                ? "border-terracotta-600 text-terracotta-600"
                : "border-transparent text-boho-text-muted hover:text-boho-text"
            }`}
          >
            <ClipboardList className="h-4 w-4" /> Gestión de Pedidos &amp; Urgencias
          </button>
          <button
            onClick={() => setAdminTab("menu")}
            className={`py-3 px-4 text-xs font-semibold border-b-2 flex items-center gap-2 transition-all cursor-pointer ${
              adminTab === "menu"
                ? "border-terracotta-600 text-terracotta-600"
                : "border-transparent text-boho-text-muted hover:text-boho-text"
            }`}
          >
            <UtensilsCrossed className="h-4 w-4" /> Administrar Menú
          </button>
          <button
            onClick={() => setAdminTab("quotation")}
            className={`py-3 px-4 text-xs font-semibold border-b-2 flex items-center gap-2 transition-all cursor-pointer ${
              adminTab === "quotation"
                ? "border-terracotta-600 text-terracotta-600"
                : "border-transparent text-boho-text-muted hover:text-boho-text"
            }`}
          >
            <Calculator className="h-4 w-4" /> Cotizador
          </button>
        </div>
      </header>

      {/* Contenido Principal de Admin */}
      <main className="max-w-7xl mx-auto px-6 py-8 flex-1 w-full">
        {adminTab === "orders" && <OrdersKanbanView />}
        {adminTab === "menu" && <MenuAdminView />}
        {adminTab === "quotation" && <QuotationView />}
      </main>
    </div>
  );
}

export default function App() {
  return (
    <ContentProvider>
      <MainLayout />
    </ContentProvider>
  );
}
