import Layout from "@/app/components/layout";
import { useEffect, useMemo, useRef, useState } from "react";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/app/components/ui/tabs";
import { Label } from "@/app/components/ui/label";
import { Input } from "@/app/components/ui/input";
import { Button } from "@/app/components/ui/button";
import { supabase } from "@/app/lib/supabaseClient";
import { toast } from "sonner";
import { useAuthenticationStore } from "@/app/store/authentication";
import { TriangleAlert } from "lucide-react";
// import BarcodeScanner from "@/app/components/scaneer"; // scanner deshabilitado temporalmente
import EgressMaterialForm from "@/app/components/egressMaterial-form";

export default function Home() {
  const user = useAuthenticationStore((s) => s.user);
 
  const [materials, setMaterials] = useState<
    Array<{ id: number; name: string; quantity: number; unit: string | null; department_id?: string | null; manufactur?: string | null; min_quantity?: number | null }>
  >([]);
  const [alerted, setAlerted] = useState<Set<number>>(new Set());

  // Ingreso state
  const [inName, setInName] = useState<string>("");
  const [inQty, setInQty] = useState<string>("");
  
  const [inDescription, setInDescription] = useState<string>("");
  const [loadingIn, setLoadingIn] = useState<boolean>(false);
  const inQtyRef = useRef<HTMLInputElement | null>(null);

  // Egreso state
  const [outMaterialId, setOutMaterialId] = useState<number | "">("");
  const [outQty, setOutQty] = useState<string>("");
  const [loadingOut, setLoadingOut] = useState<boolean>(false);
  const outQtyRef = useRef<HTMLInputElement | null>(null);

  // Search states for selects
  const [inSearch, setInSearch] = useState<string>("");
  const [outSearch, setOutSearch] = useState<string>("");

   const getDbUserId = async (): Promise<number | null> => {
      if (!user?.id) return null;
  
      const { data: dbUser, error } = await supabase
        .from("user")
        .select("id")
        .eq("userAuth", user.id) // authUser.id = UUID de Auth
        .maybeSingle();
  
      if (error) {
        console.error("Error buscando user.id:", error);
        toast.error("Error buscando usuario en la base");
        return null;
      }
  
      if (!dbUser) {
        toast.error("El usuario logueado no está vinculado en la tabla user");
        return null;
      }
  
      return dbUser.id;
    };
 
  
  // Unique names for the ingreso datalist
  const uniqueMaterialNames = useMemo(() => {
    const set = new Set<string>();
    materials.forEach((m) => {
      if (m.name) set.add(m.name);
      if (m.manufactur) set.add(m.manufactur);
    });
    return Array.from(set).sort((a, b) => a.localeCompare(b, "es", { sensitivity: "base" }));
  }, [materials]);

  // Sorted materials for selects
  const sortedMaterials = useMemo(() => {
    return [...materials].sort((a, b) => a.name.localeCompare(b.name, "es", { sensitivity: "base" }));
  }, [materials]);

  // Filtered materials for ingreso based on search
  const filteredIngresoMaterials = useMemo(() => {
    if (!inSearch.trim()) return sortedMaterials;
    const search = inSearch.toLowerCase();
    return sortedMaterials.filter((m) =>
      m.name.toLowerCase().includes(search) ||
      (m.manufactur && m.manufactur.toLowerCase().includes(search))
    );
  }, [sortedMaterials, inSearch]);

  // Filtered materials for egreso based on search
  const filteredEgresoMaterials = useMemo(() => {
    if (!outSearch.trim()) return sortedMaterials;
    const search = outSearch.toLowerCase();
    return sortedMaterials.filter((m) =>
      m.name.toLowerCase().includes(search) ||
      (m.manufactur && m.manufactur.toLowerCase().includes(search))
    );
  }, [sortedMaterials, outSearch]);
  
  useEffect(() => {
    const fetchInitial = async () => {
      const { data: mats } = await supabase.from("inventory").select("id,name,quantity,manufactur,min_quantity");
      setMaterials((mats as any) || []);
    };
    fetchInitial();
  }, []);

  const refreshMaterials = async () => {
    const { data } = await supabase.from("inventory").select("id,name,quantity,manufactur,min_quantity");
    setMaterials((data as any) || []);
  };

  // Low-stock alerts
  useEffect(() => {
    if (!materials?.length) return;
    setAlerted((prev) => {
      const next = new Set(prev);
      materials.forEach((m) => {
        const min = typeof m.min_quantity === 'number' ? m.min_quantity : undefined;
        if (min !== undefined && min >= 0 && typeof m.quantity === 'number' && m.quantity <= min) {
          if (!next.has(m.id)) {
            
            toast.warning(` Stock bajo: ${m.name} ${m.manufactur}`, {
              description: ` Cantidad actual: ${m.quantity}${m.unit ? ' ' + m.unit : ''}. Mínimo definido: ${min}.`,
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

  const handleIngreso = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!inName.trim()) return;
    const qty = Number(inQty);
    if (!isFinite(qty) || qty <= 0) return;
    setLoadingIn(true);
    try {
      // Find by name within department
      const existing = materials.find((m) => m.name.toLowerCase() === inName.trim().toLowerCase());

      if (existing) {
        // Update quantity and optionally update metadata
        const newQty = (existing.quantity || 0) + qty;
        const updatePayload: any = { quantity: newQty };
       
        // if (inBarcode) updatePayload.barcode = inBarcode;
        if (inDescription) updatePayload.description = inDescription;

        const { error: upErr } = await supabase.from("inventory").update(updatePayload).eq("id", existing.id);
        if (upErr) throw upErr;

        // Log activity with delta (inQty)
        const now = new Date();
        const horaActual = now.toLocaleTimeString("es-AR", { hour12: false, hour: '2-digit', minute: '2-digit', second: '2-digit' });
        const fechaActual = now.toLocaleDateString("es-AR", { year: 'numeric', month: '2-digit', day: '2-digit' }).split('/').reverse().join('-') + 'T' + now.toLocaleTimeString("es-AR", { hour12: false, hour: '2-digit', minute: '2-digit', second: '2-digit' });
        const createdBy = user?.id ?? null;
        const userCreatorId = await getDbUserId();
        await supabase.from("activity").insert([
          {
            name: existing.id,
            movementType: "entry",
            user_creator: userCreatorId,
            created_by: createdBy,
            created_at: horaActual,
            created_date: fechaActual,
            quantity: qty,
          },
        ]);
      } else {
        // Insert new material
        const { data: inserted, error: insErr } = await supabase
          .from("inventory")
          .insert([
            {
              name: inName.trim(),
              quantity: qty,
              
              // barcode: inBarcode || null,
              description: inDescription || null,
              created_at: new Date().toISOString(),
            },
          ])
          .select()
          .single();

        if (insErr) throw insErr;

        const materialId = (inserted as any)?.id;
        const now = new Date();
        const horaActual = now.toLocaleTimeString("es-AR", { hour12: false, hour: '2-digit', minute: '2-digit', second: '2-digit' });
        const fechaActual = now.toLocaleDateString("es-AR", { year: 'numeric', month: '2-digit', day: '2-digit' }).split('/').reverse().join('-') + 'T' + now.toLocaleTimeString("es-AR", { hour12: false, hour: '2-digit', minute: '2-digit', second: '2-digit' });
        const createdBy = user?.id ?? null;
        const userCreatorId = await getDbUserId();
        await supabase.from("activity").insert([
          {
            name: materialId,
            movementType: "entry",
            user_creator: userCreatorId,
            created_by: createdBy,
            created_at: horaActual,
            created_date: fechaActual,
            quantity: qty,
          },
        ]);
      }

      // Reset inputs and refresh
      setInName("");
      setInQty("");
      
      // setInBarcode("");
      setInDescription("");
      await refreshMaterials();
      // // After refresh, show alert if still under min
      // const m = (materials.find((x) => x.name.toLowerCase() === inName.trim().toLowerCase()) ?? null) as any;
      // if (m && typeof m.min_quantity === 'number' && m.quantity <= m.min_quantity && !alerted.has(m.id)) {
      //   toast.warning(`Stock bajo: ${m.name} ${m.manufactur}`, {
      //     description: `Cantidad actual: ${m.quantity}${m.unit ? ' ' + m.unit : ''}. Mínimo definido: ${m.min_quantity}.`,
      //   });
      //   setAlerted((s) => new Set(s).add(m.id));
      // }
    } catch (err) {
      console.error("Error en ingreso:", err);
    } finally {
      setLoadingIn(false);
    }
  };

  // const handleEgreso = async (e: React.FormEvent) => {
  //   e.preventDefault();
  //   if (!outMaterialId) return;
  //   const qty = Number(outQty);
  //   if (!isFinite(qty) || qty <= 0) return;
  //   setLoadingOut(true);
  //   try {
  //     const material = materials.find((m) => m.id === outMaterialId);
  //     if (!material) return;
  //     const current = material.quantity || 0;
  //     const newQty = Math.max(0, current - qty);

  //     const { error: upErr } = await supabase
  //       .from("inventory")
  //       .update({ quantity: newQty })
  //       .eq("id", material.id);
  //     if (upErr) throw upErr;

  //     // Log activity with delta (outQty)
  //     const horaActual = new Date().toLocaleTimeString("en-GB");
  //     const createdBy = user?.id ?? null;
  //     await supabase.from("activity").insert([
  //       {
  //         name: material.id,
  //         movementType: "exit",
  //         created_by: createdBy,
  //         created_at: horaActual,
  //         created_date: new Date().toISOString(),
  //         quantity: qty,
  //       },
  //     ]);

  //     setOutQty("");
  //     setOutMaterialId("");
  //     await refreshMaterials();
  //     // Alert if new stock is below defined minimum
  //     if (material && typeof material.min_quantity === 'number' && newQty <= material.min_quantity && !alerted.has(material.id)) {
  //       toast.warning(`Stock bajo: ${material.name}`, {
  //         description: `Cantidad actual: ${newQty}${material.unit ? ' ' + material.unit : ''}. Mínimo definido: ${material.min_quantity}.`,
  //       });
  //       setAlerted((s) => new Set(s).add(material.id));
  //     }
  //   } catch (err) {
  //     console.error("Error en egreso:", err);
  //   } finally {
  //     setLoadingOut(false);
  //   }
  // };

  // Handlers de escaneo deshabilitados temporalmente
  // const onScanIngreso = async (code: { rawValue: string; format?: string }) => { /* ... */ };
  // const onScanEgreso = async (code: { rawValue: string; format?: string }) => { /* ... */ };

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
            <form onSubmit={handleIngreso} className="grid grid-cols-1 md:grid-cols-2 gap-4">
              {/** Escáner deshabilitado temporalmente **/}
              <div className="col-span-1 md:col-span-2">
                <Label className="pb-4 px-2">Escanear código de barras (opcional)</Label>
                {/* <div className="border rounded p-2">
                  <BarcodeScanner onDetected={onScanIngreso} />
                </div> */}
              </div>
              
              <div className="col-span-1 md:col-span-2">
                <div className="flex flex-col md:flex-row gap-2">
                  <select
                    title="materiales"
                    className="border rounded p-2 w-full md:w-1/2"
                    value={uniqueMaterialNames.includes(inName) ? inName : ""}
                    onChange={(e) => setInName(e.target.value)}
                  >
                    <option value="">Selecciona un objeto existente</option>
                    {filteredIngresoMaterials.map((m) => (
                      <option key={m.id} value={m.name}>
                        {m.name} {m.manufactur}
                      </option>
                    ))}
                  </select>
                </div>
              </div>

              <div>
                <Label>Cantidad</Label>
                <Input
                  type="number"
                  value={inQty}
                  onChange={(e) => setInQty(e.target.value)}
                  min={0}
                  ref={inQtyRef}
                />
              </div>

              <div>
                <Label>Unidad</Label>
                <select title = "medidas" className="border rounded p-2 w-full" value={inUnit} onChange={(e) => setInUnit(e.target.value)}>
                  {Medidas.map((u) => (
                    <option key={u} value={u}>
                      {u}
                    </option>
                  ))}
                </select>
              </div>

              <div>
                <Label>Descripción (opcional)</Label>
                <Input value={inDescription} onChange={(e) => setInDescription(e.target.value)} />
              </div>

              <div className="col-span-1 md:col-span-2 flex gap-3">
                <Button type="submit" disabled={loadingIn}>
                  {loadingIn ? "Guardando..." : "Guardar ingreso"}
                </Button>
              </div>
            </form>
          </TabsContent>

          <TabsContent value="egreso">
            {/* <form onSubmit={handleEgreso} className="grid grid-cols-1 md:grid-cols-2 gap-4"> */}
              {/** Escáner deshabilitado temporalmente **/}
              {/**
              <div className="col-span-1 md:col-span-2">
                <Label>Escanear código de barras</Label>
                <div className="border rounded p-2">
                  <BarcodeScanner onDetected={onScanEgreso} />
                </div>
              </div>
              **/}
              {/* <div>
                <Label>Material</Label>
                <div className="flex flex-col gap-2">
                  <Input
                    placeholder="Buscar material..."
                    value={outSearch}
                    onChange={(e) => setOutSearch(e.target.value)}
                  />
                  <select
                    className="border rounded p-2 w-full"
                    size={5}
                    value={outMaterialId}
                    onChange={(e) => {
                      setOutMaterialId(e.target.value ? Number(e.target.value) : "");
                      setOutSearch("");
                    }}
                  >
                    <option value="">Selecciona un material</option>
                    {filteredEgresoMaterials.map((m) => (
                      <option key={m.id} value={m.id}>
                        {m.name} - {m.manufactur} {typeof m.quantity === "number" ? `(Stock: ${m.quantity})` : ""}
                      </option>
                    ))}
                  </select>
                </div>
              </div>

              <div>
                <Label>Cantidad</Label>
                <Input
                  type="number"
                  value={outQty}
                  onChange={(e) => setOutQty(e.target.value)}
                  min={0}
                  ref={outQtyRef}
                />
              </div>

              <div className="col-span-1 md:col-span-2 flex gap-3">
                <Button type="submit" disabled={loadingOut}>
                  {loadingOut ? "Procesando..." : "Registrar egreso"}
                </Button>
              </div>
            </form> */}
            <EgressMaterialForm />
          </TabsContent>
        </Tabs>
      </div>
    </Layout>
  );
}
