import { useEffect, useState } from "react";
import Layout from "@/app/components/layout";
import { useParams } from "react-router-dom";
import { supabase } from "@/app/lib/supabaseClient";
import { Tabs, TabsList, TabsTrigger, TabsContent } from "@/app/components/ui/tabs";
import { Card } from "@/app/components/ui/card";
import { Drawer, DrawerContent, DrawerHeader, DrawerTitle } from "@/app/components/ui/drawer";
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/app/components/ui/dialog";
import { Button } from "../../ui/button";
import EditMaterialForm from "../../editMaterial";
import EditToolForm from "../../editTool";
import { useMediaQuery } from "@/app/hooks/use-media-query";
import { Trash2, SquarePen } from "lucide-react";

type Inventory = {
  id: any;
  name: string;
  quantity: number;
  unit: any;
  weight?: number;
  width?: number;
  height?: number;
  color?: string;
  manufactur?: string;
  barcode?: string;
  hasQRcode?: boolean;
  description?: string;
};

type Tools = {
  id: number;
  name: string;
  description?: string;
  amount: number;
  manufactur?: string;
  barcode?: number;
  hasQrCode?: boolean;
  purchase_date?: string | null;
  warrantyExpirationDate?: string | null;
};

type Department = {
  id: number;
  name: string;
};

export default function DepartmentDetailPage() {
  const { documentId } = useParams<{ documentId: string }>();
  const [department, setDepartment] = useState<Department | null>(null);
  const [materials, setMaterials] = useState<Inventory[]>([]);
  const [tools, setTools] = useState<Tools[]>([]);
  const [loading, setLoading] = useState(true);
  const [selectedMaterial, setSelectedMaterial] = useState<Inventory | null>(null);
  const [isSheetOpen, setIsSheetOpen] = useState(false);
  const [selectedTool, setSelectedTool] = useState<Tools | null>(null);
  const [editType, setEditType] = useState<"material" | "tools" | null>(null);
  const [confirmOpen, setConfirmOpen] = useState(false);
  const [pendingDelete, setPendingDelete] = useState<
    { type: "material" | "tools"; id: number; name: string } | null
  >(null);
  const isDesktop = useMediaQuery("(min-width: 768px)");

  const fetchData = async () => {
    setLoading(true);
    if (!documentId) return;
    const departmentId = parseInt(documentId);

    try {
      const [depRes, matRes, toolsRes] = await Promise.all([
        supabase.from("departments").select("*").eq("id", departmentId).single(),
        supabase.from("inventory").select("*").eq("department_id", departmentId),
        // Select all columns to avoid breaking due to column name mismatches (e.g., hasQrCode vs hasQRcode)
        supabase.from("tools").select("*").eq("department_id", departmentId),
      ]);

      if (depRes.error) throw depRes.error;
      setDepartment(depRes.data);

      if (matRes.error) console.error("Error al traer materiales:", matRes.error);
      else setMaterials(matRes.data || []);

      if (toolsRes.error) console.error("Error al traer herramientas:", toolsRes.error);
      else setTools(toolsRes.data || []);

    } catch (err) {
      console.error("Error al cargar datos:", err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchData();
  }, [documentId]);

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

  const requestDeleteTool = (tools: Tools) => {
    setPendingDelete({ type: "tools", id: tools.id, name: tools.name });
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
  };

  const handleEditClick = (material: Inventory) => {
    setSelectedMaterial(material);
    setEditType("material");
    setIsSheetOpen(true);
  };

  const handleEditToolClick = (tools: Tools) => {
    setSelectedTool(tools);
    setEditType("tools");
    setIsSheetOpen(true);
  };

  const handleClose = () => {
    setIsSheetOpen(false);
    setSelectedMaterial(null);
    setSelectedTool(null);
    setEditType(null);
    fetchData();
  };

  const MaterialForm = (
    <div className="p-4 overflow-y-auto max-h-[80vh]">
      {selectedMaterial && <EditMaterialForm material={selectedMaterial} onClose={handleClose} />}
    </div>
  );

  const ToolForm = (
    <div className="p-4 overflow-y-auto max-h-[80vh]">
      {selectedTool && (
        <EditToolForm tools={selectedTool} onClose={handleClose} />
      )}
    </div>
  );

  if (loading) return <p className="p-6 text-center">Cargando...</p>;
  if (!department) return <p className="p-6 text-center text-red-500">Departamento no encontrado.</p>;

  return (
    <Layout>
      <div className="flex flex-col items-center w-full p-6">
        <h1 className="text-3xl font-bold mb-6 text-center">{department.name}</h1>
        <Tabs defaultValue="materials" className="w-full">
          <TabsList className="grid grid-cols-2 w-full">
            <TabsTrigger value="materials">Materiales</TabsTrigger>
            <TabsTrigger value="tools">Herramientas</TabsTrigger>
          </TabsList>

          <TabsContent value="materials" className="mt-4 space-y-3">
            {materials.length === 0 ? (
              <p className="text-center text-gray-500">No hay materiales registrados.</p>
            ) : (
              materials.map((mat) => (
                <Card key={mat.id} className="p-4 shadow-sm border max-h-48 overflow-y-auto">
                  <div className="flex flex-col-2 justify-between">
                    <div>
                      <h2 className="text-lg font-semibold">{mat.name}</h2>
                      <p className="text-sm text-gray-500">
                        {mat.quantity} {mat.unit}
                      </p>
                    </div>
                    <div className="flex gap-2">
                      <Button size="sm" variant="default" onClick={() => handleEditClick(mat)}>
                        <SquarePen />
                      </Button>
                      <Button size="sm" variant="destructive" onClick={() => requestDeleteMaterial(mat)}>
                        <Trash2 />
                      </Button>
                    </div>
                  </div>
                </Card>
              ))
            )}
          </TabsContent>

          <TabsContent value="tools" className="mt-4 space-y-3">
            {tools.length === 0 ? (
              <p className="text-center text-gray-500">No hay herramientas registradas.</p>
            ) : (
              tools.map((tools) => (
                <Card key={tools.id} className="p-4 shadow-sm border max-h-48 overflow-y-auto">
                  <div className="flex flex-col-2 justify-between">
                    <div>
                      <h2 className="text-lg font-semibold">{tools.name}</h2>
                      {tools.description && (
                        <p className="text-sm text-gray-500">{tools.description}</p>
                      )}
                      <p className="text-sm text-gray-500">{tools.amount} disponibles</p>
                    </div>
                    <div className="flex gap-2">
                      <Button size="sm" variant="default" onClick={() => handleEditToolClick(tools)}>
                        <SquarePen />
                      </Button>
                      <Button size="sm" variant="destructive" onClick={() => requestDeleteTool(tools)}>
                        <Trash2 />
                      </Button>
                    </div>
                  </div>
                </Card>
              ))
            )}
          </TabsContent>
        </Tabs>
        {isDesktop ? (
          <Dialog open={isSheetOpen} onOpenChange={setIsSheetOpen}>
            <DialogContent>
              <DialogHeader>
                <DialogTitle>
                  {editType === "tools" ? "Editar Herramienta" : "Editar Material"}
                </DialogTitle>
              </DialogHeader>
              {editType === "tools" ? ToolForm : MaterialForm}
            </DialogContent>
          </Dialog>
        ) : (
          <Drawer open={isSheetOpen} onOpenChange={setIsSheetOpen}>
            <DrawerContent>
              <DrawerHeader>
                <DrawerTitle>
                  {editType === "tools" ? "Editar Herramienta" : "Editar Material"}
                </DrawerTitle>
              </DrawerHeader>
              {editType === "tools" ? ToolForm : MaterialForm}
            </DrawerContent>
          </Drawer>
        )}

        {/* Confirmación de eliminación */}
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
