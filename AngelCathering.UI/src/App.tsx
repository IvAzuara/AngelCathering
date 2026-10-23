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
  LogOut, Globe, Flower2, User as UserIcon 
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

  // Vista de Administración (Limpia, sobria pero con toques orgánicos cálidos y paleta BoHo)
  return (
    <div className="min-h-screen bg-[#F7F5F0] text-[#3D2E26] flex flex-col font-sans">
      {/* Barra superior de Administración */}
      <header className="bg-white border-b border-[#E5DDD0] sticky top-0 z-40 shadow-2xs">
        <div className="max-w-7xl mx-auto px-6 h-16 flex items-center justify-between">
          <div className="flex items-center gap-3">
            <div className="h-9 w-9 rounded-lg bg-[#9E5134] text-[#FAF7F2] flex items-center justify-center font-bold shadow-xs">
              <Flower2 className="h-5 w-5 stroke-[1.8]" />
            </div>
            <div>
              <div className="flex items-center gap-2">
                <span className="font-serif-boho font-bold text-[#2D211A] text-xl tracking-tight">
                  {content.branding.businessName}
                </span>
                <span className="text-[11px] bg-[#EFEAE1] text-[#8C3E21] font-semibold px-2 py-0.5 rounded-full border border-[#D8CEBF]">
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
              className="text-[#6B5A4E] hover:text-[#2D211A] border-[#D8CEBF] bg-[#FAF7F2] text-xs rounded-full"
            >
              <Globe className="h-3.5 w-3.5 mr-1.5 text-[#687B62]" /> Ver Menú Público
            </Button>
            <div className="h-4 w-px bg-[#E5DDD0] mx-1 hidden sm:block" />
            <div className="hidden sm:flex items-center gap-2 text-xs text-[#6B5A4E] mr-2">
              <UserIcon className="h-3.5 w-3.5 text-[#9E8B7C]" />
              <span className="font-medium">{user?.fullName || user?.username}</span>
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
        <div className="max-w-7xl mx-auto px-6 flex gap-2 border-t border-[#F2ECE1]">
          <button
            onClick={() => setAdminTab("orders")}
            className={`py-3 px-4 text-xs font-semibold border-b-2 flex items-center gap-2 transition-all cursor-pointer ${
              adminTab === "orders"
                ? "border-[#9E5134] text-[#9E5134]"
                : "border-transparent text-[#7A695B] hover:text-[#3D2E26]"
            }`}
          >
            <ClipboardList className="h-4 w-4" /> Gestión de Pedidos &amp; Urgencias
          </button>
          <button
            onClick={() => setAdminTab("menu")}
            className={`py-3 px-4 text-xs font-semibold border-b-2 flex items-center gap-2 transition-all cursor-pointer ${
              adminTab === "menu"
                ? "border-[#9E5134] text-[#9E5134]"
                : "border-transparent text-[#7A695B] hover:text-[#3D2E26]"
            }`}
          >
            <UtensilsCrossed className="h-4 w-4" /> Administrar Menú
          </button>
          <button
            onClick={() => setAdminTab("quotation")}
            className={`py-3 px-4 text-xs font-semibold border-b-2 flex items-center gap-2 transition-all cursor-pointer ${
              adminTab === "quotation"
                ? "border-[#9E5134] text-[#9E5134]"
                : "border-transparent text-[#7A695B] hover:text-[#3D2E26]"
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
