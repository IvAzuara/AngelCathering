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

  // Limpiar cualquier residuo previo de localStorage legado y validar sesión en sessionStorage
  useEffect(() => {
    localStorage.removeItem("token");
    localStorage.removeItem("user");

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
        // Token inválido o manipulado
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
        <div className="max-w-7xl mx-auto px-4 sm:px-6 h-16 flex items-center justify-between">
          <div className="flex items-center gap-2 sm:gap-3">
            <div className="h-8 w-8 sm:h-9 sm:w-9 rounded-lg bg-terracotta-600 text-boho-bg flex items-center justify-center font-bold shadow-xs shrink-0">
              <Flower2 className="h-4 w-4 sm:h-5 sm:w-5 stroke-[1.8]" />
            </div>
            <div>
              <div className="flex items-center gap-1.5 sm:gap-2">
                <span className="font-serif-boho font-bold text-boho-text-title text-base sm:text-xl tracking-tight truncate max-w-[140px] sm:max-w-none">
                  {content.branding.businessName}
                </span>
                <span className="text-[10px] sm:text-[11px] bg-boho-surface text-terracotta-700 font-semibold px-1.5 sm:px-2 py-0.5 rounded-full border border-boho-border shrink-0">
                  Panel
                </span>
              </div>
            </div>
          </div>

          <div className="flex items-center gap-1.5 sm:gap-2">
            <Button
              variant="outline"
              size="sm"
              onClick={() => setCurrentView("public-menu")}
              className="text-boho-text-muted hover:text-boho-text-title border-boho-border bg-boho-bg text-xs rounded-full px-2.5 sm:px-3 h-8"
            >
              <Globe className="h-3.5 w-3.5 sm:mr-1.5 text-sage-500" />
              <span className="hidden sm:inline">Ver Menú Público</span>
            </Button>
            <div className="h-4 w-px bg-boho-border-subtle mx-1 hidden md:block" />
            <div className="hidden md:flex items-center gap-1.5 text-xs text-boho-text-muted mr-1">
              <UserIcon className="h-3.5 w-3.5 text-boho-text-light" />
              <span className="font-medium truncate max-w-[100px]">{user.fullName}</span>
            </div>
            <Button 
              variant="ghost" 
              size="sm" 
              onClick={handleLogout} 
              className="text-red-700 hover:bg-red-50 hover:text-red-800 text-xs rounded-full px-2.5 sm:px-3 h-8"
              title="Cerrar sesión"
            >
              <LogOut className="h-3.5 w-3.5 sm:mr-1" />
              <span className="hidden sm:inline">Salir</span>
            </Button>
          </div>
        </div>

        {/* Pestañas de Navegación del Panel con scroll horizontal táctil para móviles e iPad */}
        <div className="max-w-7xl mx-auto px-4 sm:px-6 flex gap-1 sm:gap-2 border-t border-boho-surface overflow-x-auto no-scrollbar">
          <button
            onClick={() => setAdminTab("orders")}
            className={`py-3 px-3 sm:px-4 text-xs font-semibold border-b-2 flex items-center gap-1.5 sm:gap-2 transition-all cursor-pointer whitespace-nowrap shrink-0 ${
              adminTab === "orders"
                ? "border-terracotta-600 text-terracotta-600"
                : "border-transparent text-boho-text-muted hover:text-boho-text"
            }`}
          >
            <ClipboardList className="h-4 w-4 shrink-0" /> Pedidos &amp; Urgencias
          </button>
          <button
            onClick={() => setAdminTab("menu")}
            className={`py-3 px-3 sm:px-4 text-xs font-semibold border-b-2 flex items-center gap-1.5 sm:gap-2 transition-all cursor-pointer whitespace-nowrap shrink-0 ${
              adminTab === "menu"
                ? "border-terracotta-600 text-terracotta-600"
                : "border-transparent text-boho-text-muted hover:text-boho-text"
            }`}
          >
            <UtensilsCrossed className="h-4 w-4 shrink-0" /> Catálogo de Menú
          </button>
          <button
            onClick={() => setAdminTab("quotation")}
            className={`py-3 px-3 sm:px-4 text-xs font-semibold border-b-2 flex items-center gap-1.5 sm:gap-2 transition-all cursor-pointer whitespace-nowrap shrink-0 ${
              adminTab === "quotation"
                ? "border-terracotta-600 text-terracotta-600"
                : "border-transparent text-boho-text-muted hover:text-boho-text"
            }`}
          >
            <Calculator className="h-4 w-4 shrink-0" /> Cotizador
          </button>
        </div>
      </header>

      {/* Contenido Principal de Admin */}
      <main className="max-w-7xl mx-auto px-3 sm:px-6 py-4 sm:py-8 flex-1 w-full pb-16 sm:pb-8">
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
