import Layout from "@/app/components/layout";
import { useEffect, useMemo, useState } from "react";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/app/components/ui/tabs";
import { Label } from "@/app/components/ui/label";
import { Input } from "@/app/components/ui/input";
import { Button } from "@/app/components/ui/button";
import { supabase } from "@/app/lib/supabaseClient";
import { useAuthenticationStore } from "@/app/store/authentication";

export default function Home() {
  const user = useAuthenticationStore((s) => s.user);

  const Medidas = useMemo(
    () => [
      "Select",
      "Kg",
      "Mts",
      "Cms",
      "Caja",
      "Unidad",
      "Paquete",
      "Litro",
      "Gramo",
      "Pieza",
      "Bolsa",
      "Otro",
    ] as const,
    []
  );

  const [materials, setMaterials] = useState<
    Array<{ id: number; name: string; quantity: number; unit: string | null; department_id: string | null }>
  >([]);

  // Ingreso state
  const [inName, setInName] = useState<string>("");
  const [inQty, setInQty] = useState<string>("");
  const [inUnit, setInUnit] = useState<string>("Select");
  const [inBarcode, setInBarcode] = useState<string>("");
  const [inDescription, setInDescription] = useState<string>("");
  const [loadingIn, setLoadingIn] = useState<boolean>(false);

  // Egreso state
  const [outMaterialId, setOutMaterialId] = useState<number | "">("");
  const [outQty, setOutQty] = useState<string>("");
  const [loadingOut, setLoadingOut] = useState<boolean>(false);

  // Unique names for the ingreso datalist
  const uniqueMaterialNames = useMemo(() => {
    const set = new Set<string>();
    materials.forEach((m) => {
      if (m.name) set.add(m.name);
    });
    return Array.from(set).sort((a, b) => a.localeCompare(b, "es", { sensitivity: "base" }));
  }, [materials]);

  // Sorted materials for selects
  const sortedMaterials = useMemo(() => {
    return [...materials].sort((a, b) => a.name.localeCompare(b.name, "es", { sensitivity: "base" }));
  }, [materials]);

  useEffect(() => {
    const fetchInitial = async () => {
      const { data: mats } = await supabase.from("inventory").select("id,name,quantity,unit,department_id");
      setMaterials((mats as any) || []);
    };
    fetchInitial();
  }, []);

  const refreshMaterials = async () => {
    const { data } = await supabase.from("inventory").select("id,name,quantity,unit,department_id");
    setMaterials((data as any) || []);
  };

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
        if (inUnit && inUnit !== "Select") updatePayload.unit = inUnit;
        if (inBarcode) updatePayload.barcode = inBarcode;
        if (inDescription) updatePayload.description = inDescription;

        const { error: upErr } = await supabase.from("inventory").update(updatePayload).eq("id", existing.id);
        if (upErr) throw upErr;

        // Log activity with delta (inQty)
        const horaActual = new Date().toLocaleTimeString("en-GB");
        const createdBy = user?.id ?? null;
        await supabase.from("activity").insert([
          {
            name: existing.id,
            movementType: "entry",
            created_by: createdBy,
            created_at: horaActual,
            created_date: new Date().toISOString(),
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
              unit: inUnit && inUnit !== "Select" ? inUnit : null,
              department_id: null,
              barcode: inBarcode || null,
              description: inDescription || null,
              created_at: new Date().toISOString(),
            },
          ])
          .select()
          .single();

        if (insErr) throw insErr;

        const materialId = (inserted as any)?.id;
        const horaActual = new Date().toLocaleTimeString("en-GB");
        const createdBy = user?.id ?? null;
        await supabase.from("activity").insert([
          {
            name: materialId,
            movementType: "entry",
            created_by: createdBy,
            created_at: horaActual,
            created_date: new Date().toISOString(),
            quantity: qty,
          },
        ]);
      }

      // Reset inputs and refresh
      setInName("");
      setInQty("");
      setInUnit("Select");
      setInBarcode("");
      setInDescription("");
      await refreshMaterials();
    } catch (err) {
      console.error("Error en ingreso:", err);
    } finally {
      setLoadingIn(false);
    }
  };

  const handleEgreso = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!outMaterialId) return;
    const qty = Number(outQty);
    if (!isFinite(qty) || qty <= 0) return;
    setLoadingOut(true);
    try {
      const material = materials.find((m) => m.id === outMaterialId);
      if (!material) return;
      const current = material.quantity || 0;
      const newQty = Math.max(0, current - qty);

      const { error: upErr } = await supabase
        .from("inventory")
        .update({ quantity: newQty })
        .eq("id", material.id);
      if (upErr) throw upErr;

      // Log activity with delta (outQty)
      const horaActual = new Date().toLocaleTimeString("en-GB");
      const createdBy = user?.id ?? null;
      await supabase.from("activity").insert([
        {
          name: material.id,
          movementType: "exit",
          created_by: createdBy,
          created_at: horaActual,
          created_date: new Date().toISOString(),
          quantity: qty,
        },
      ]);

      setOutQty("");
      setOutMaterialId("");
      await refreshMaterials();
    } catch (err) {
      console.error("Error en egreso:", err);
    } finally {
      setLoadingOut(false);
    }
  };

  return (
    <Layout>
      <div className="w-full p-6">
        <h1 className="text-2xl font-semibold mb-4">Movimientos de materiales</h1>

        <Tabs defaultValue="ingreso" className="max-w-3xl">
          <TabsList>
            <TabsTrigger value="ingreso">Ingreso</TabsTrigger>
            <TabsTrigger value="egreso">Egreso</TabsTrigger>
          </TabsList>

          <TabsContent value="ingreso">
            <form onSubmit={handleIngreso} className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div className="col-span-1 md:col-span-2">
                <Label>Nombre del material (selecciona o escribe)</Label>
                <div className="flex flex-col md:flex-row gap-2">
                  <select
                    className="border rounded p-2 w-full md:w-1/2"
                    value={uniqueMaterialNames.includes(inName) ? inName : ""}
                    onChange={(e) => setInName(e.target.value)}
                  >
                    <option value="">Selecciona un material existente</option>
                    {sortedMaterials.map((m) => (
                      <option key={m.id} value={m.name}>
                        {m.name}
                      </option>
                    ))}
                  </select>
                  <Input
                    placeholder="O escribe un nombre nuevo"
                    value={inName}
                    onChange={(e) => setInName(e.target.value)}
                    autoComplete="off"
                  />
                </div>
              </div>

              <div>
                <Label>Cantidad</Label>
                <Input
                  type="number"
                  value={inQty}
                  onChange={(e) => setInQty(e.target.value)}
                  min={0}
                />
              </div>

              <div>
                <Label>Unidad</Label>
                <select className="border rounded p-2 w-full" value={inUnit} onChange={(e) => setInUnit(e.target.value)}>
                  {Medidas.map((u) => (
                    <option key={u} value={u}>
                      {u}
                    </option>
                  ))}
                </select>
              </div>

              <div>
                <Label>Código de barras (opcional)</Label>
                <Input value={inBarcode} onChange={(e) => setInBarcode(e.target.value)} />
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
            <form onSubmit={handleEgreso} className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div>
                <Label>Material</Label>
                <select
                  className="border rounded p-2 w-full"
                  value={outMaterialId}
                  onChange={(e) => setOutMaterialId(e.target.value ? Number(e.target.value) : "")}
                >
                  <option value="">Selecciona un material</option>
                  {sortedMaterials.map((m) => (
                    <option key={m.id} value={m.id}>
                      {m.name} {typeof m.quantity === "number" ? `(Stock: ${m.quantity})` : ""}
                    </option>
                  ))}
                </select>
              </div>

              <div>
                <Label>Cantidad</Label>
                <Input
                  type="number"
                  value={outQty}
                  onChange={(e) => setOutQty(e.target.value)}
                  min={0}
                />
              </div>

              <div className="col-span-1 md:col-span-2 flex gap-3">
                <Button type="submit" disabled={loadingOut}>
                  {loadingOut ? "Procesando..." : "Registrar egreso"}
                </Button>
              </div>
            </form>
          </TabsContent>
        </Tabs>
      </div>
    </Layout>
  );
}
