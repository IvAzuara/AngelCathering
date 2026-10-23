import React from "react";
import { Card, CardHeader, CardTitle, CardDescription, CardContent } from "@/components/ui/card";
import { Calculator, Clock, FileSpreadsheet } from "lucide-react";

export const QuotationView: React.FC = () => {
  return (
    <div className="max-w-3xl mx-auto py-12 px-4">
      <Card className="border-dashed border-2 border-zinc-300 text-center p-8 bg-white shadow-xs">
        <div className="mx-auto h-16 w-16 rounded-full bg-amber-50 flex items-center justify-center text-amber-600 mb-4">
          <Calculator className="h-8 w-8" />
        </div>
        <CardHeader className="p-0 mb-4">
          <div className="inline-flex items-center gap-1.5 bg-amber-100 text-amber-800 text-xs font-semibold px-3 py-1 rounded-full mx-auto mb-2">
            <Clock className="h-3.5 w-3.5" /> En espera de especificaciones
          </div>
          <CardTitle className="text-2xl font-bold text-zinc-900">Módulo de Cotizaciones</CardTitle>
          <CardDescription className="text-zinc-500 max-w-md mx-auto">
            Este módulo se encuentra configurado y listo en la arquitectura. Se implementará tan pronto como compartas el documento con los tabuladores y fórmulas de cotización de catering.
          </CardDescription>
        </CardHeader>
        <CardContent className="p-0 pt-4 flex flex-col items-center">
          <div className="bg-zinc-50 border border-zinc-200 rounded-lg p-4 text-xs text-zinc-600 max-w-md text-left space-y-2">
            <div className="font-semibold text-zinc-800 flex items-center gap-1.5">
              <FileSpreadsheet className="h-4 w-4 text-indigo-600" /> Próximas funcionalidades a integrar:
            </div>
            <ul className="list-disc list-inside space-y-1 text-zinc-500">
              <li>Cálculo automático según número de comensales.</li>
              <li>Fórmulas de costos fijos, insumos y mobiliario.</li>
              <li>Generación de PDF formal de cotización para clientes.</li>
            </ul>
          </div>
        </CardContent>
      </Card>
    </div>
  );
};
