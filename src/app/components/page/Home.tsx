import Layout from "@/app/components/layout";
import { useEffect, useMemo, useRef, useState } from "react";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/app/components/ui/tabs";


import { supabase } from "@/app/lib/supabaseClient";
import { toast } from "sonner";

import { TriangleAlert } from "lucide-react";

import EgressMaterialForm from "@/app/components/egressMaterial-form";
import IngressMaterialForm from "@/app/components/ingressMaterial-form";

export default function Home() {
  
    const [materials, setMaterials] = useState<any[]>([]);
  const [alerted, setAlerted] = useState<Set<string>>(new Set());
 
  // FETCH MATERIALS
  useEffect(() => {
    const fetchInitial = async () => {
      const { data: mats } = await supabase
        .from("inventory")
        .select("id,name,quantity,manufactur,min_quantity");
      setMaterials((mats as any) || []);
    };
    fetchInitial();
  }, []);

  const refreshMaterials = async () => {
    const { data } = await supabase
      .from("inventory")
      .select("id,name,quantity,manufactur,min_quantity");
    setMaterials((data as any) || []);
  };

  // LOW-STOCK ALERTS
  useEffect(() => {
    if (!materials?.length) return;
    setAlerted((prev) => {
      const next = new Set(prev);
      materials.forEach((m) => {
        const min = typeof m.min_quantity === 'number' ? m.min_quantity : undefined;
        if (min !== undefined && min >= 0 && typeof m.quantity === 'number' && m.quantity <= min) {
          if (!next.has(m.id)) {
            toast.warning(`Stock bajo: ${m.name} ${m.manufactur}`, {
              description: `Cantidad actual: ${m.quantity}${m.unit ? ' ' + m.unit : ''}. Mínimo definido: ${min}.`,
              duration: 3000,
              icon: <TriangleAlert />
            });
            next.add(m.id);
          }
        }
      });
      return next;
    });
  }, [materials]);


  return (
    <Layout>
      <div className="flex flex-col w-full p-6">
        <h1 className="text-xl font-semibold mb-4">Movimientos diarios de ingresos y egresos</h1>
        <p>En esta sección puedes registrar los movimientos diarios de ingresos y egresos de elementos ya cargados.</p>

        <Tabs defaultValue="egreso" className="w-full md:w-3/4 py-4 px-2">
          <TabsList className="w-full flex justify-center mb-2">
            <TabsTrigger value="egreso">Egreso</TabsTrigger>
            <TabsTrigger value="ingreso">Ingreso</TabsTrigger>
          </TabsList>

          <TabsContent value="ingreso">
           
            <IngressMaterialForm />
          </TabsContent>

          <TabsContent value="egreso">
            <EgressMaterialForm />
          </TabsContent>
        </Tabs>
      </div>
    </Layout>
  );
}
