import { useState, useEffect } from "react";
import { ContentProvider, useSiteContent } from "@/context/ContentContext";
import { PublicMenuView } from "@/views/PublicMenuView";
import { LoginView } from "@/views/LoginView";
import { OrdersKanbanView } from "@/views/OrdersKanbanView";
import { MenuAdminView } from "@/views/MenuAdminView";
import { QuotationView } from "@/views/QuotationView";
import { Button } from "@/components/ui/button";
import { 
  ClipboardList, UtensilsCrossed, Calculator, 
  LogOut, Globe, ChefHat, User as UserIcon 
} from "lucide-react";

type AppView = "public-menu" | "login" | "admin";
type AdminTab = "orders" | "menu" | "quotation";

function MainLayout() {
  const { content } = useSiteContent();
  const [currentView, setCurrentView] = useState<AppView>("public-menu");
  const [adminTab, setAdminTab] = useState<AdminTab>("orders");
  const [user, setUser] = useState<{ username: string; fullName: string } | null>(null);

  useEffect(() => {
    const savedUser = localStorage.getItem("user");
    const token = localStorage.getItem("token");
    if (savedUser && token) {
      try {
        setUser(JSON.parse(savedUser));
      } catch {
        localStorage.clear();
      }
    }
  }, []);

  const handleLogout = () => {
    localStorage.removeItem("token");
    localStorage.removeItem("user");
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

  // Vista de Administración
  return (
    <div className="min-h-screen bg-zinc-100 flex flex-col">
      {/* Barra superior de Administración */}
      <header className="bg-white border-b border-zinc-200 sticky top-0 z-40">
        <div className="max-w-7xl mx-auto px-4 h-16 flex items-center justify-between">
          <div className="flex items-center gap-3">
            <div className="h-9 w-9 rounded-lg bg-indigo-600 text-white flex items-center justify-center font-bold shadow-sm">
              <ChefHat className="h-5 w-5" />
            </div>
            <div>
              <div className="flex items-center gap-2">
                <span className="font-bold text-zinc-900 text-base">{content.branding.businessName}</span>
                <span className="text-xs bg-indigo-100 text-indigo-800 font-semibold px-2 py-0.5 rounded-full">Admin</span>
              </div>
            </div>
          </div>

          <div className="flex items-center gap-2">
            <Button
              variant="ghost"
              size="sm"
              onClick={() => setCurrentView("public-menu")}
              className="text-zinc-600 hover:text-zinc-900"
            >
              <Globe className="h-4 w-4 mr-1 text-zinc-500" /> Ver Menú Público
            </Button>
            <div className="h-4 w-px bg-zinc-200 mx-1 hidden sm:block" />
            <div className="hidden sm:flex items-center gap-2 text-xs text-zinc-600 mr-2">
              <UserIcon className="h-3.5 w-3.5 text-zinc-400" />
              <span>{user?.fullName || user?.username}</span>
            </div>
            <Button variant="outline" size="sm" onClick={handleLogout} className="text-red-600 border-red-200 hover:bg-red-50">
              <LogOut className="h-4 w-4 mr-1" /> Salir
            </Button>
          </div>
        </div>

        {/* Pestañas de Navegación del Panel */}
        <div className="max-w-7xl mx-auto px-4 flex gap-1 border-t border-zinc-100">
          <button
            onClick={() => setAdminTab("orders")}
            className={`py-3 px-4 text-sm font-semibold border-b-2 flex items-center gap-2 transition-colors cursor-pointer ${
              adminTab === "orders"
                ? "border-indigo-600 text-indigo-600"
                : "border-transparent text-zinc-500 hover:text-zinc-800"
            }`}
          >
            <ClipboardList className="h-4 w-4" /> Gestión de Pedidos &amp; Urgencias
          </button>
          <button
            onClick={() => setAdminTab("menu")}
            className={`py-3 px-4 text-sm font-semibold border-b-2 flex items-center gap-2 transition-colors cursor-pointer ${
              adminTab === "menu"
                ? "border-indigo-600 text-indigo-600"
                : "border-transparent text-zinc-500 hover:text-zinc-800"
            }`}
          >
            <UtensilsCrossed className="h-4 w-4" /> Administrar Menú
          </button>
          <button
            onClick={() => setAdminTab("quotation")}
            className={`py-3 px-4 text-sm font-semibold border-b-2 flex items-center gap-2 transition-colors cursor-pointer ${
              adminTab === "quotation"
                ? "border-indigo-600 text-indigo-600"
                : "border-transparent text-zinc-500 hover:text-zinc-800"
            }`}
          >
            <Calculator className="h-4 w-4" /> Cotizador
          </button>
        </div>
      </header>

      {/* Contenido Principal de Admin */}
      <main className="max-w-7xl mx-auto px-4 py-6 flex-1 w-full">
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
