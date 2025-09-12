import { useEffect, useState } from "react";
import Layout from "@/app/components/layout";
import { useParams } from "react-router-dom";
import { supabase } from "@/app/lib/supabaseClient";
import { Tabs, TabsList, TabsTrigger, TabsContent } from "@/app/components/ui/tabs";
import { Card } from "@/app/components/ui/card";
import { Button } from "../../ui/button";
import { Trash2, SquarePen } from "lucide-react";

type Inventory = {
  id: number;
  name: string;
  quantity: number;
  unit: string;
};

type Tool = {
  id: number;
  name: string;
  description?: string;
  amount: number;
};

type Department = {
  id: number;
  name: string;
};

export default function DepartmentDetailPage() {
  const { documentId } = useParams<{ documentId: string }>();
  const [department, setDepartment] = useState<Department | null>(null);
  const [materials, setMaterials] = useState<Inventory[]>([]);
  const [tools, setTools] = useState<Tool[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    console.log("documentId:", documentId);
    if (!documentId) return;
    const departmentId = parseInt(documentId);

    const fetchData = async () => {
  setLoading(true);

  try {
    const [depRes, matRes, toolsRes] = await Promise.all([
      supabase.from("departments").select("*").eq("id", departmentId).single(),
      supabase.from("inventory").select("*").eq("department_id", departmentId),
      supabase.from("tools").select("id, name, description, amount").eq("department_id", departmentId),
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


    fetchData();
  }, [documentId]);

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
                <Card key={mat.id} className="p-4 shadow-sm border">
                  <div className="flex flex-col-2 justify-between">
                  <div>
                  <h2 className="text-lg font-semibold">{mat.name}</h2>
                  <p className="text-sm text-gray-500">
                    {mat.quantity} {mat.unit}
                  </p>
                  </div>
                  <div> 
                    <Button size="sm" variant="default" >
                      <SquarePen />
                      </Button>
                    <Button size="sm" variant= "destructive">
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
              tools.map((tool) => (
                <Card key={tool.id} className="p-4 shadow-sm border">
                  <h2 className="text-lg font-semibold">{tool.name}</h2>
                  {tool.description && <p className="text-sm text-gray-500">{tool.description}</p>}
                  <p className="text-sm text-gray-500">{tool.amount} disponibles</p>
                </Card>
              ))
            )}
          </TabsContent>
        </Tabs>
      </div>
    </Layout>
  );
}
