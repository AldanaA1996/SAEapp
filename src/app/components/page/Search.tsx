import { useEffect, useMemo, useRef, useState } from "react";
import Layout from "@/app/components/layout";
import { supabase } from "@/app/lib/supabaseClient";
import { Input } from "@/app/components/ui/input";
import { Card } from "@/app/components/ui/card";
import { Button } from "@/app/components/ui/button";
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/app/components/ui/dialog";
import EditMaterialForm from "@/app/components/editMaterial";
import { SquarePen, Eye, Trash2 } from "lucide-react";
import downloadInventoryCsv from "@/app/components/csvDownload";

// Types aligned with existing pages
type Inventory = {
  id: number;
  name: string;
  quantity: number;
  unit: string | null;
  min_quantity?: number | null;
  weight?: number | null;
  width?: number | null;
  height?: number | null;
  color?: string | null;
  manufactur?: string | null;
  barcode?: string | null;
  hasQRcode?: boolean | null;
  description?: string | null;
  location?: "Select" | "Pañol" | "Taller" | "Contenedor" | "Ferreteria";
};


export default function SearchPage() {
  const [q, setQ] = useState("");
  const [loading, setLoading] = useState(true);
  const [materials, setMaterials] = useState<Inventory[]>([]);
  const [onlyLow, setOnlyLow] = useState<boolean>(false);
  
  // Tabs removed: only inventory is used in the project

  // Infinite scroll state (progressively reveal items)
  const PAGE_SIZE = 20;
  const [matVisible, setMatVisible] = useState(PAGE_SIZE);
 
  const matSentinelRef = useRef<HTMLDivElement | null>(null);
  

  // View/Edit dialog state
  const [openView, setOpenView] = useState(false);
  const [openEdit, setOpenEdit] = useState(false);
  const [selectedMaterial, setSelectedMaterial] = useState<Inventory | null>(null);


  const [confirmOpen, setConfirmOpen] = useState(false);
  const [pendingDelete, setPendingDelete] = useState<
    { type: "material" ; id: number; name: string } | null
  >(null);

  
  useEffect(() => {
    const load = async () => {
      setLoading(true);
      try {
        const [matRes] = await Promise.all([
          supabase.from("inventory").select("*"),
          
        ]);
        if (!matRes.error && matRes.data) setMaterials(matRes.data as Inventory[]);
        else if (matRes.error) console.error("Error al cargar materiales:", matRes.error);

      } finally {
        setLoading(false);
      }
    };
    load();
  }, []);

  // Reset visible counts when search term changes
  useEffect(() => {
    setMatVisible(PAGE_SIZE);
  
  }, [q]);

  // IntersectionObservers for infinite reveal
  useEffect(() => {
    const matObserver = new IntersectionObserver((entries) => {
      entries.forEach((e) => {
        if (e.isIntersecting) {
          setMatVisible((v) => v + PAGE_SIZE);
        }
      });
    });
    const node = matSentinelRef.current;
    if (node) matObserver.observe(node);
    return () => {
      if (node) matObserver.unobserve(node);
      matObserver.disconnect();
    };
  }, [matSentinelRef.current, PAGE_SIZE]);


    const handleDeleteM = async (id: number) => {
      const { error } = await supabase.from("inventory").delete().eq("id", id);
      if (error) {
        console.error("Error al eliminar el material:", error);
      } else {
        setMaterials((prev) => prev.filter((m) => m.id !== id));
      }
    };
  
    const requestDeleteMaterial = (material: Inventory) => {
      setPendingDelete({ type: "material", id: material.id as number, name: material.name });
      setConfirmOpen(true);
    };
  
  
    const confirmDelete = async () => {
      if (!pendingDelete) return;
      try {
        if (pendingDelete.type === "material") {
          await handleDeleteM(pendingDelete.id);
        } 
      } finally {
        setConfirmOpen(false);
        setPendingDelete(null);
      }
    }

  const filteredMaterials = useMemo(() => {
    const s = q.trim().toLowerCase();
    if (!s) return materials;
    return materials.filter((m) => {
      const haystack = [
        m.name,
        m.unit ?? "",
        m.color ?? "",
        m.manufactur ?? "",
        m.barcode ?? "",
        m.description ?? "",
        m.location ?? "",
      ]
        .join(" ")
        .toLowerCase();
      return haystack.includes(s);
    });
  }, [q, materials]);

  // Low-stock first sorting (then by name)
  const sortedForRender = useMemo(() => {
    const isLow = (m: Inventory) =>
      typeof m.min_quantity === 'number' && m.min_quantity >= 0 && typeof m.quantity === 'number' && m.quantity <= m.min_quantity;
    const base = onlyLow ? filteredMaterials.filter(isLow) : filteredMaterials;
    return [...base].sort((a, b) => {
      const la = isLow(a) ? 1 : 0;
      const lb = isLow(b) ? 1 : 0;
      if (lb !== la) return lb - la; // low stock first
      return a.name.localeCompare(b.name, 'es', { sensitivity: 'base' });
    });
  }, [filteredMaterials, onlyLow]);


  // Normalize objects to match Edit forms' expected props (undefined instead of null, safe unit)
  const normalizeMaterial = (m: Inventory) => ({
    id: m.id,
    name: m.name,
    quantity: m.quantity,
    unit: (m.unit ?? 'Select') as any,
    min_quantity: m.min_quantity ?? undefined,
    weight: m.weight ?? undefined,
    width: m.width ?? undefined,
    height: m.height ?? undefined,
    color: m.color ?? undefined,
    manufactur: m.manufactur ?? undefined,
    barcode: m.barcode ?? undefined,
    hasQrCode: (m as any).hasQrCode ?? (m as any).hasQRcode ?? undefined,
    description: m.description ?? undefined,
    location: m.location ?? 'Select',
  });

  return (
    <Layout>
      <div className="p-0 md:p-6 max-w-5xl mx-auto w-full">
        <div className="sticky top-0 z-20 bg-white/80 backdrop-blur border-b px-6 py-4 md:px-0 py-4">
          <h1 className="text-xl md:text-2xl font-bold mb-3">Buscar en Inventario</h1>
          <div className="flex flex-col md:flex-row md:items-center md:gap-4 gap-2">
            <div className="flex-1">
              <Input
                placeholder="Buscar por nombre, fabricante, código, etc."
                value={q}
                onChange={(e) => setQ(e.target.value)}
              />
            </div>
            <label className="inline-flex items-center gap-2 text-sm select-none">
              <input type="checkbox" checked={onlyLow} onChange={(e) => setOnlyLow(e.target.checked)} />
              <span>Solo bajo stock</span>
              <span className="text-xs text-gray-500">(
                {
                  (() => {
                    const count = materials.filter((m) => typeof m.min_quantity === 'number' && m.min_quantity >= 0 && typeof m.quantity === 'number' && m.quantity <= m.min_quantity).length;
                    return count;
                  })()
                }
              )</span>
            </label>
            <div className="flex items-center">
              <Button variant="outline" onClick={downloadInventoryCsv}>
                Descargar CSV
              </Button>
            </div>
          </div>
        </div>

        {loading ? (
          <p className="text-center">Cargando...</p>
        ) : (
          <div className="w-full px-4 py-4 md:px-0 mt-4 space-y-3">
            {filteredMaterials.length === 0 ? (
              <p className="text-center text-gray-500">No se encontraron materiales.</p>
            ) : (
              sortedForRender.slice(0, matVisible).map((m) => {
                const low = typeof m.min_quantity === 'number' && m.min_quantity >= 0 && typeof m.quantity === 'number' && m.quantity <= m.min_quantity;
                return (
                <Card
                  key={m.id}
                  className={`p-4 shadow-sm border ${low ? 'border-red-400 bg-red-50/60' : ''}`}
                >
                  <div className="flex items-center justify-between gap-2">
                    <div>
                      <h2 className={`text-lg font-semibold ${low ? 'text-red-700' : ''}`}>
                        {m.name}
                        {low && (
                          <span className="ml-3 inline-flex items-center rounded px-2 py-0.5 text-xs font-semibold bg-red-100 text-red-700 border border-red-300 align-middle">
                            Stock bajo
                          </span>
                        )}
                      </h2>
                      <p className={`text-sm ${low ? 'text-red-700 font-medium' : 'text-gray-500'}`}>
                        {m.quantity} {m.unit}
                        {low && typeof m.min_quantity === 'number' ? ` · mínimo: ${m.min_quantity}` : ''}
                      </p>
                      {m.manufactur && (
                        <p className="text-sm text-gray-500">Fabricante: {m.manufactur}</p>
                      )}
                    
                      {m.description && (
                        <p className="text-sm text-gray-500">{m.description}</p>
                      )}
                    </div>
                    <div className="flex gap-2">
                      <Button size="sm" variant="outline" onClick={() => { setSelectedMaterial(m); setOpenView(true); }}>
                        <Eye className="h-4 w-4" />
                      </Button>
                      <Button size="sm" variant="default" onClick={() => { setSelectedMaterial(m); setOpenEdit(true); }}>
                        <SquarePen className="h-4 w-4" />
                      </Button>
                      <Button size="sm" variant="destructive" onClick={() => requestDeleteMaterial(m)}>
                        <Trash2 className="h-4 w-4" />
                      </Button>
                    </div>
                  </div>
                </Card>
              )})
            )}
            {/* Sentinel for materials */}
            {filteredMaterials.length > matVisible && <div ref={matSentinelRef} />}
          </div>
        )}
        {/* View Dialog */}
        <Dialog open={openView} onOpenChange={setOpenView}>
          <DialogContent>
            <DialogHeader>
              <DialogTitle>Detalles</DialogTitle>
            </DialogHeader>
            <div className="space-y-2">
              {selectedMaterial && (
                <div className="text-sm">
                  <p><strong>Nombre:</strong> {selectedMaterial.name}</p>
                  <p><strong>Cantidad:</strong> {selectedMaterial.quantity} {selectedMaterial.unit}</p>
                  {selectedMaterial.min_quantity && <p><strong>Mínimo:</strong> {selectedMaterial.min_quantity}</p>}
                  {selectedMaterial.manufactur && <p><strong>Fabricante:</strong> {selectedMaterial.manufactur}</p>}
                  {selectedMaterial.description && <p><strong>Descripción:</strong> {selectedMaterial.description}</p>}
                  {selectedMaterial.location && <p><strong>Ubicación:</strong> {selectedMaterial.location}</p>}

                </div>
              )}
            </div>
          </DialogContent>
        </Dialog>

        {/* Edit Dialog */}
        <Dialog open={openEdit} onOpenChange={(o) => { setOpenEdit(o); if (!o) { setSelectedMaterial(null); } }}>
          <DialogContent>
            <DialogHeader>
              <DialogTitle>Editar</DialogTitle>
            </DialogHeader>
            <div className="p-1 max-h-[70vh] overflow-y-auto">
              {selectedMaterial && (
                <EditMaterialForm material={normalizeMaterial(selectedMaterial)} onClose={() => { setOpenEdit(false); setSelectedMaterial(null); }} />
              )}
            </div>
          </DialogContent>
        </Dialog>
        <Dialog open={confirmOpen} onOpenChange={setConfirmOpen}>
          <DialogContent>
            <DialogHeader>
              <DialogTitle>Confirmar eliminación</DialogTitle>
            </DialogHeader>
            <div className="space-y-3">
              <p>
                ¿Estás seguro de eliminar {pendingDelete?.type === "material" }
                {" "}
                <span className="font-semibold">{pendingDelete?.name}</span>?
                Esta acción no se puede deshacer.
              </p>
              <div className="flex justify-end gap-2 pt-2">
                <Button variant="outline" onClick={() => { setConfirmOpen(false); setPendingDelete(null); }}>
                  Cancelar
                </Button>
                <Button variant="destructive" onClick={confirmDelete}>
                  Eliminar
                </Button>
              </div>
            </div>
          </DialogContent>
        </Dialog>
      </div>
    </Layout>
  );
}
