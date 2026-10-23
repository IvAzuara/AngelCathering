import React, { useState } from "react";
import { api } from "@/services/api";
import { Card, CardHeader, CardTitle, CardDescription, CardContent, CardFooter } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { Lock, ArrowLeft, AlertCircle } from "lucide-react";

export const LoginView: React.FC<{
  onLoginSuccess: (user: { username: string; fullName: string }) => void;
  onBackToMenu: () => void;
}> = ({ onLoginSuccess, onBackToMenu }) => {
  const [username, setUsername] = useState("");
  const [password, setPassword] = useState("");
  const [error, setError] = useState<string | null>(null);
  const [loading, setLoading] = useState(false);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError(null);
    setLoading(true);

    try {
      const data = await api.login(username, password);
      sessionStorage.setItem("token", data.token);
      onLoginSuccess({ username: data.username, fullName: data.fullName });
    } catch {
      setError("Usuario o contraseña incorrectos. Revisa e intenta de nuevo.");
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen bg-zinc-100 flex items-center justify-center p-4">
      <Card className="w-full max-w-md shadow-lg border-zinc-200">
        <CardHeader className="space-y-1 text-center">
          <div className="mx-auto h-12 w-12 rounded-full bg-indigo-50 flex items-center justify-center text-indigo-600 mb-2">
            <Lock className="h-6 w-6" />
          </div>
          <CardTitle className="text-2xl font-bold tracking-tight">Acceso Administrativo</CardTitle>
          <CardDescription>
            Ingresa con tus credenciales de administrador para gestionar pedidos y catálogo.
          </CardDescription>
        </CardHeader>
        <form onSubmit={handleSubmit}>
          <CardContent className="space-y-4">
            {error && (
              <div className="p-3 bg-red-50 border border-red-200 text-red-700 text-sm rounded-lg flex items-center gap-2">
                <AlertCircle className="h-4 w-4 shrink-0" />
                <span>{error}</span>
              </div>
            )}
            <div className="space-y-1.5">
              <label className="text-sm font-medium text-zinc-700">Usuario</label>
              <Input
                type="text"
                placeholder="admin"
                value={username}
                onChange={(e) => setUsername(e.target.value)}
                required
              />
            </div>
            <div className="space-y-1.5">
              <label className="text-sm font-medium text-zinc-700">Contraseña</label>
              <Input
                type="password"
                placeholder="••••••••"
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                required
              />
            </div>
          </CardContent>
          <CardFooter className="flex flex-col gap-2">
            <Button type="submit" className="w-full" disabled={loading}>
              {loading ? "Iniciando sesión..." : "Iniciar Sesión"}
            </Button>
            <Button
              type="button"
              variant="ghost"
              className="w-full text-zinc-500 hover:text-zinc-800"
              onClick={onBackToMenu}
            >
              <ArrowLeft className="h-4 w-4 mr-1" /> Volver al Menú Público
            </Button>
          </CardFooter>
        </form>
      </Card>
    </div>
  );
};
