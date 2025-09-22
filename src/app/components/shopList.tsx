import { useEffect, useMemo, useState } from "react";
import { supabase } from "@/app/lib/supabaseClient";
import { Card } from "@/app/components/ui/card";
import { Input } from "@/app/components/ui/input";

type Inventory = {
  id: number;
  name: string;
  quantity: number;
  unit: string | null;
  min_quantity?: number | null;
  max_quantity?: number | null;
  manufactur?: string | null;
};

export default function ShopList() {
  const [loading, setLoading] = useState(true);
  const [materials, setMaterials] = useState<Inventory[]>([]);
  const [q, setQ] = useState("");

  useEffect(() => {
    const load = async () => {
      setLoading(true);
      try {
        const { data, error } = await supabase.from("inventory").select("*");
        if (error) throw error;
        setMaterials((data || []) as Inventory[]);
      } catch (err) {
        console.error("Error al cargar inventario:", err);
      } finally {
        setLoading(false);
      }
    };
    load();
  }, []);

  const suggestions = useMemo(() => {
    const term = q.trim().toLowerCase();
    const filtered = !term
      ? materials
      : materials.filter((m) => [m.name, m.unit ?? "", m.manufactur ?? ""].join(" ").toLowerCase().includes(term));

    return filtered
      .map((m) => {
        const max = typeof m.max_quantity === "number" ? m.max_quantity : null;
        const qty = typeof m.quantity === "number" ? m.quantity : 0;
        const needed = max !== null ? Math.max(0, max - qty) : 0;
        return { ...m, needed, max };
      })
      .filter((m) => m.max !== null && m.needed > 0)
      .sort((a, b) => b.needed - a.needed || a.name.localeCompare(b.name, "es", { sensitivity: "base" }));
  }, [materials, q]);

  const totalLines = suggestions.length;
  const totalUnits = suggestions.reduce((acc, m) => acc + m.needed, 0);

  return (
    <div className="p-0 md:p-6 max-w-4xl mx-auto w-full">
      <div className="sticky top-0 z-20 bg-white/80 backdrop-blur border-b px-6 py-4 md:px-0 py-4">
        <h1 className="text-xl md:text-2xl font-bold mb-3">Lista de compras</h1>
        <div className="flex flex-col md:flex-row md:items-center md:gap-4 gap-2">
          <div className="flex-1">
            <Input
              placeholder="Buscar por nombre, unidad o fabricante"
              value={q}
              onChange={(e) => setQ(e.target.value)}
            />
          </div>
          <div className="text-sm text-gray-600">
            <span className="mr-4">Ítems: {totalLines}</span>
            <span>Total a comprar: {totalUnits}</span>
          </div>
        </div>
      </div>

      {loading ? (
        <p className="text-center mt-6">Cargando...</p>
      ) : suggestions.length === 0 ? (
        <p className="text-center mt-6 text-gray-500">
          No hay compras necesarias. Define "Stock máximo sugerido" en los materiales o ya alcanzaste el máximo.
        </p>
      ) : (
        <div className="w-full px-4 py-4 md:px-0 mt-4 space-y-3">
          {suggestions.map((m) => (
            <Card key={m.id} className="p-4 shadow-sm border">
              <div className="flex items-center justify-between gap-4">
                <div>
                  <h2 className="text-lg font-semibold">{m.name}</h2>
                  <p className="text-sm text-gray-600">
                    Actual: {m.quantity} {m.unit ?? ""} · Máximo: {m.max}
                  </p>
                  <p className="text-sm font-medium">
                    Comprar: <span className="text-blue-700">{m.needed}</span> {m.unit ?? ""}
                  </p>
                  {m.manufactur && (
                    <p className="text-xs text-gray-500">Fabricante: {m.manufactur}</p>
                  )}
                </div>
              </div>
            </Card>
          ))}
        </div>
      )}
    </div>
  );
}

