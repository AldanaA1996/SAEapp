import { useEffect, useMemo, useRef, useState } from "react";
import Layout from "@/app/components/layout";
import { supabase } from "@/app/lib/supabaseClient";
import { Input } from "@/app/components/ui/input";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/app/components/ui/tabs";
import { Card } from "@/app/components/ui/card";
import { Button } from "@/app/components/ui/button";
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/app/components/ui/dialog";
import EditMaterialForm from "@/app/components/editMaterial";
import EditToolForm from "@/app/components/editTool";
import { SquarePen, Eye, Trash2 } from "lucide-react";

// Types aligned with existing pages
type Inventory = {
  id: number;
  name: string;
  quantity: number;
  unit: string | null;
  weight?: number | null;
  width?: number | null;
  height?: number | null;
  color?: string | null;
  manufactur?: string | null;
  barcode?: string | null;
  hasQRcode?: boolean | null;
  description?: string | null;
};

type Tool = {
  id: number;
  name: string;
  description?: string | null;
  amount: number;
  manufactur?: string | null;
  barcode?: number | null;
  hasQrCode?: boolean | null;
  purchase_date?: string | null;
  warrantyExpirationDate?: string | null;
};

export default function SearchPage() {
  const [q, setQ] = useState("");
  const [loading, setLoading] = useState(true);
  const [materials, setMaterials] = useState<Inventory[]>([]);
  const [tools, setTools] = useState<Tool[]>([]);
  const [activeTab, setActiveTab] = useState<"materials" | "tools">("materials");

  // Infinite scroll state (progressively reveal items)
  const PAGE_SIZE = 20;
  const [matVisible, setMatVisible] = useState(PAGE_SIZE);
  const [toolVisible, setToolVisible] = useState(PAGE_SIZE);
  const matSentinelRef = useRef<HTMLDivElement | null>(null);
  const toolSentinelRef = useRef<HTMLDivElement | null>(null);

  // View/Edit dialog state
  const [openView, setOpenView] = useState(false);
  const [openEdit, setOpenEdit] = useState(false);
  const [selectedMaterial, setSelectedMaterial] = useState<Inventory | null>(null);
  const [selectedTool, setSelectedTool] = useState<Tool | null>(null);

  const [confirmOpen, setConfirmOpen] = useState(false);
  const [pendingDelete, setPendingDelete] = useState<
    { type: "material" | "tools"; id: number; name: string } | null
  >(null);

  useEffect(() => {
    const load = async () => {
      setLoading(true);
      try {
        const [matRes, toolsRes] = await Promise.all([
          supabase.from("inventory").select("*"),
          supabase.from("tools").select("*"),
        ]);
        if (!matRes.error && matRes.data) setMaterials(matRes.data as Inventory[]);
        else if (matRes.error) console.error("Error al cargar materiales:", matRes.error);

        if (!toolsRes.error && toolsRes.data) setTools(toolsRes.data as Tool[]);
        else if (toolsRes.error) console.error("Error al cargar herramientas:", toolsRes.error);
      } finally {
        setLoading(false);
      }
    };
    load();
  }, []);

  // Reset visible counts when search term changes
  useEffect(() => {
    setMatVisible(PAGE_SIZE);
    setToolVisible(PAGE_SIZE);
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

  useEffect(() => {
    const toolObserver = new IntersectionObserver((entries) => {
      entries.forEach((e) => {
        if (e.isIntersecting) {
          setToolVisible((v) => v + PAGE_SIZE);
        }
      });
    });
    const node = toolSentinelRef.current;
    if (node) toolObserver.observe(node);
    return () => {
      if (node) toolObserver.unobserve(node);
      toolObserver.disconnect();
    };
  }, [toolSentinelRef.current, PAGE_SIZE]);

    const handleDeleteM = async (id: number) => {
      const { error } = await supabase.from("inventory").delete().eq("id", id);
      if (error) {
        console.error("Error al eliminar el material:", error);
      } else {
        setMaterials((prev) => prev.filter((m) => m.id !== id));
      }
    };
  
    const handleDeleteT = async (id: number) => {
      const { error } = await supabase.from("tools").delete().eq("id", id);
      if (error) {
        console.error("Error al eliminar la herramienta:", error);
      } else {
        setTools((prev) => prev.filter((t) => t.id !== id));
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
        } else {
          await handleDeleteT(pendingDelete.id);
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
      ]
        .join(" ")
        .toLowerCase();
      return haystack.includes(s);
    });
  }, [q, materials]);

  const filteredTools = useMemo(() => {
    const s = q.trim().toLowerCase();
    if (!s) return tools;
    return tools.filter((t) => {
      const barcodeStr = t.barcode != null ? String(t.barcode) : "";
      const haystack = [
        t.name,
        t.description ?? "",
        t.manufactur ?? "",
        barcodeStr,
      ]
        .join(" ")
        .toLowerCase();
      return haystack.includes(s);
    });
  }, [q, tools]);

  // Normalize objects to match Edit forms' expected props (undefined instead of null, safe unit)
  const normalizeMaterial = (m: Inventory) => ({
    id: m.id,
    name: m.name,
    quantity: m.quantity,
    unit: (m.unit ?? 'Select') as any,
    weight: m.weight ?? undefined,
    width: m.width ?? undefined,
    height: m.height ?? undefined,
    color: m.color ?? undefined,
    manufactur: m.manufactur ?? undefined,
    barcode: m.barcode ?? undefined,
    hasQrCode: (m as any).hasQrCode ?? (m as any).hasQRcode ?? undefined,
    description: m.description ?? undefined,
  });

  const normalizeTool = (t: Tool) => ({
    id: t.id,
    name: t.name,
    amount: t.amount,
    manufactur: t.manufactur ?? undefined,
    barcode: t.barcode ?? undefined,
    hasQrCode: t.hasQrCode ?? undefined,
    description: t.description ?? undefined,
    purchase_date: t.purchase_date ?? undefined,
    warrantyExpirationDate: t.warrantyExpirationDate ?? undefined,
                  });

  return (
    <Layout>
      <div className="p-0 md:p-6 max-w-5xl mx-auto w-full">
        <div className="sticky top-0 z-20 bg-white/80 backdrop-blur border-b px-6 py-4 md:px-0 py-4">
          <h1 className="text-xl md:text-2xl font-bold mb-3">Buscar en Inventario y Herramientas</h1>
          <Input
            placeholder="Buscar por nombre, fabricante, código, etc."
            value={q}
            onChange={(e) => setQ(e.target.value)}
          />
        </div>

        {loading ? (
          <p className="text-center">Cargando...</p>
        ) : (
          <Tabs value={activeTab} onValueChange={(v) => setActiveTab(v as any)} className="w-full px-4 py-4 md:px-0">
            <TabsList className="grid grid-cols-2 w-full">
              <TabsTrigger value="materials">Materiales</TabsTrigger>
              <TabsTrigger value="tools">Herramientas</TabsTrigger>
            </TabsList>

            <TabsContent value="materials" className="mt-4 space-y-3">
              {filteredMaterials.length === 0 ? (
                <p className="text-center text-gray-500">No se encontraron materiales.</p>
              ) : (
                filteredMaterials.slice(0, matVisible).map((m, idx, arr) => (
                  <Card key={m.id} className="p-4 shadow-sm border">
                    <div className="flex items-center justify-between gap-2">
                      <div>
                        <h2 className="text-lg font-semibold">{m.name}</h2>
                        <p className="text-sm text-gray-500">{m.quantity} {m.unit}</p>
                        {m.manufactur && (
                          <p className="text-sm text-gray-500">Fabricante: {m.manufactur}</p>
                        )}
                        {m.barcode && (
                          <p className="text-sm text-gray-500">Código: {m.barcode}</p>
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
                ))
              )}
              {/* Sentinel for materials */}
              {filteredMaterials.length > matVisible && <div ref={matSentinelRef} />}
            </TabsContent>

            <TabsContent value="tools" className="mt-4 space-y-3">
              {filteredTools.length === 0 ? (
                <p className="text-center text-gray-500">No se encontraron herramientas.</p>
              ) : (
                filteredTools.slice(0, toolVisible).map((t) => (
                  <Card key={t.id} className="p-4 shadow-sm border">
                    <div className="flex items-center justify-between gap-2">
                      <div>
                        <h2 className="text-lg font-semibold">{t.name}</h2>
                        <p className="text-sm text-gray-500">{t.amount} disponibles</p>
                        {t.manufactur && (
                          <p className="text-sm text-gray-500">Fabricante: {t.manufactur}</p>
                        )}
                        {t.barcode != null && (
                          <p className="text-sm text-gray-500">Código: {t.barcode}</p>
                        )}
                        {t.purchase_date && (
                          <p className="text-sm text-gray-500">Compra: {t.purchase_date}</p>
                        )}
                        {t.warrantyExpirationDate && (
                          <p className="text-sm text-gray-500">Garantía hasta: {t.warrantyExpirationDate}</p>
                        )}
                        {t.description && (
                          <p className="text-sm text-gray-500">{t.description}</p>
                        )}
                      </div>
                      <div className="flex gap-2">
                        <Button size="sm" variant="outline" onClick={() => { setSelectedTool(t); setOpenView(true); }}>
                          <Eye className="h-4 w-4" />
                        </Button>
                        <Button size="sm" variant="default" onClick={() => { setSelectedTool(t); setOpenEdit(true); }}>
                          <SquarePen className="h-4 w-4" />
                        </Button>
                      </div>
                    </div>
                  </Card>
                ))
              )}
              {/* Sentinel for tools */}
              {filteredTools.length > toolVisible && <div ref={toolSentinelRef} />}
            </TabsContent>
          </Tabs>
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
                  {selectedMaterial.manufactur && <p><strong>Fabricante:</strong> {selectedMaterial.manufactur}</p>}
                  {selectedMaterial.barcode && <p><strong>Código:</strong> {selectedMaterial.barcode}</p>}
                  {selectedMaterial.description && <p>{selectedMaterial.description}</p>}
                </div>
              )}
              {selectedTool && (
                <div className="text-sm">
                  <p><strong>Nombre:</strong> {selectedTool.name}</p>
                  <p><strong>Disponibles:</strong> {selectedTool.amount}</p>
                  {selectedTool.manufactur && <p><strong>Fabricante:</strong> {selectedTool.manufactur}</p>}
                  {selectedTool.barcode != null && <p><strong>Código:</strong> {selectedTool.barcode}</p>}
                  {selectedTool.purchase_date && <p><strong>Compra:</strong> {selectedTool.purchase_date}</p>}
                  {selectedTool.warrantyExpirationDate && <p><strong>Garantía:</strong> {selectedTool.warrantyExpirationDate}</p>}
                  {selectedTool.description && <p>{selectedTool.description}</p>}
                </div>
              )}
            </div>
          </DialogContent>
        </Dialog>

        {/* Edit Dialog */}
        <Dialog open={openEdit} onOpenChange={(o) => { setOpenEdit(o); if (!o) { setSelectedMaterial(null); setSelectedTool(null); } }}>
          <DialogContent>
            <DialogHeader>
              <DialogTitle>Editar</DialogTitle>
            </DialogHeader>
            <div className="p-1 max-h-[70vh] overflow-y-auto">
              {selectedMaterial && (
                <EditMaterialForm material={normalizeMaterial(selectedMaterial)} onClose={() => { setOpenEdit(false); setSelectedMaterial(null); }} />
              )}
              {selectedTool && (
                <EditToolForm tools={normalizeTool(selectedTool)} onClose={() => { setOpenEdit(false); setSelectedTool(null); }} />
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
                ¿Estás seguro de eliminar {pendingDelete?.type === "tools" ? "la herramienta" : "el material"}
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
