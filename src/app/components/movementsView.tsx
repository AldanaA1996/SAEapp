import { useEffect, useMemo, useState } from "react";
import { supabase } from "@/app/lib/supabaseClient";
import { Card } from "@/app/components/ui/card";
import { Input } from "@/app/components/ui/input";
import { Button } from "@/app/components/ui/button";
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/app/components/ui/dialog";
import { Trash2 } from "lucide-react";

type MovementRecord = Record<string, any> & {
  id?: number | string;
  created_at?: string;   // hora
  created_date?: string; // fecha
  type?: string;
  item_name?: string;
  quantity?: number;
  department_id?: number;
  user_id?: string;
};

interface MovementsViewProps {
  tableName?: string;
}

export default function MovementsView({ tableName = "activity" }: MovementsViewProps) {
  const [data, setData] = useState<MovementRecord[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [inventoryById, setInventoryById] = useState<Record<string, { name?: string }>>({});
  // Filters
  const [fromDate, setFromDate] = useState<string>("");
  const [toDate, setToDate] = useState<string>("");
  const [typeFilter, setTypeFilter] = useState<string>("");
  // Delete mode
  const [deleteMode, setDeleteMode] = useState(false);
  const [selectedIds, setSelectedIds] = useState<Set<string>>(new Set());
  const [confirmOpen, setConfirmOpen] = useState(false);
  const [confirmIds, setConfirmIds] = useState<string[]>([]);

  useEffect(() => {
    const load = async () => {
      setLoading(true);
      setError(null);
      try {
        const query = supabase
          .from(tableName)
          .select("id, name, movementType, created_at, created_date, quantity, user:user_creator (id,name, email)")
          .order("created_date", { ascending: false })
          .order("created_at", { ascending: false });
        const { data, error } = await query;
        if (error) throw error;
        const rows = (data as MovementRecord[]) || [];
        setData(rows);

        const invIdSet = new Set<number>();

        for (const r of rows) {
          const invId = (r as any).name as number | undefined;
          if (typeof invId === "number") invIdSet.add(invId);
        }

        if (invIdSet.size) {
          const { data: invData } = await supabase
            .from("inventory")
            .select("id, name")
            .in("id", Array.from(invIdSet));
          const mapInv: Record<string, { name?: string }> = {};
          (invData || []).forEach((i: any) => {
            mapInv[String(i.id)] = { name: i.name };
          });
          setInventoryById(mapInv);
        } else {
          setInventoryById({});
        }
      } catch (err: any) {
        console.error("Error loading movements:", err);
        setError(err?.message || "Error al cargar los movimientos");
      } finally {
        setLoading(false);
      }
    };
    load();
  }, [tableName]);

  // Derive movement types
  const movementTypes = useMemo(() => {
    const set = new Set<string>();
    data.forEach((m) => {
      const mt = (m as any).movementType ?? (m as any).movementTyoe ?? m.type;
      if (mt) set.add(String(mt));
    });
    return Array.from(set).sort();
  }, [data]);

  // Filtrado por fecha y tipo
  const filtered = useMemo(() => {
    const from = fromDate ? new Date(fromDate + "T00:00:00") : null;
    const to = toDate ? new Date(toDate + "T23:59:59.999") : null;

    const getWhen = (m: MovementRecord): Date | null => {
      const cd = m.created_date;
      const ca = m.created_at;
      if (cd) {
        const d = new Date(cd);
        if (!isNaN(d.getTime())) {
          if (ca && /\d{1,2}:\d{2}/.test(ca)) {
            const [h, min, sec] = ca.split(":");
            d.setHours(Number(h) || 0, Number(min) || 0, Number(sec) || 0, 0);
          }
          return d;
        }
      }
      if (ca) {
        const d = new Date(ca);
        if (!isNaN(d.getTime())) return d;
      }
      return null;
    };

    return data.filter((m) => {
      const when = getWhen(m);
      if (from && when && when < from) return false;
      if (to && when && when > to) return false;
      const mt = (m as any).movementType ?? (m as any).movementTyoe ?? m.type;
      if (typeFilter && String(mt) !== typeFilter) return false;
      return true;
    });
  }, [data, fromDate, toDate, typeFilter]);

  const toggleSelect = (id?: number | string) => {
    if (id == null) return;
    const key = String(id);
    setSelectedIds((prev) => {
      const next = new Set(prev);
      if (next.has(key)) next.delete(key);
      else next.add(key);
      return next;
    });
  };

  const clearSelection = () => setSelectedIds(new Set());

  const requestDeleteSelected = () => {
    if (!selectedIds.size) return;
    setConfirmIds(Array.from(selectedIds));
    setConfirmOpen(true);
  };

  const requestDeleteSingle = (id?: number | string) => {
    if (id == null) return;
    setConfirmIds([String(id)]);
    setConfirmOpen(true);
  };

  const confirmDelete = async () => {
    if (!confirmIds.length) return;
    try {
      const idsForDb = confirmIds.map((x) => (isNaN(Number(x)) ? x : Number(x)));
      const { error } = await supabase.from(tableName).delete().in("id", idsForDb as any[]);
      if (error) throw error;
      const setIds = new Set(confirmIds);
      setData((prev) => prev.filter((r) => !setIds.has(String(r.id))));
      clearSelection();
      setDeleteMode(false);
    } catch (err) {
      console.error("Error al eliminar movimientos:", err);
    } finally {
      setConfirmOpen(false);
      setConfirmIds([]);
    }
  };

  if (loading) return <p className="p-4 text-center">Cargando movimientos...</p>;
  if (error) return <p className="p-4 text-center text-red-500">{error}</p>;

  if (!data.length) {
    return <p className="p-4 text-center text-gray-500">No hay movimientos registrados.</p>;
  }

  return (
    <div className="flex flex-col space-y-3 p-2 md:w-[95%] h-full">
      {/* Barra de filtros */}
      <div className="sticky top-0 z-10 bg-white/70 backdrop-blur border rounded-md p-3 flex flex-wrap items-end gap-3">
        <div>
          <select className="border rounded h-9 px-2" value={typeFilter} onChange={(e) => setTypeFilter(e.target.value)}>
            <option value="">Todos</option>
            {movementTypes.map((t) => (
              <option key={t} value={t}>{t}</option>
            ))}
          </select>
        </div>
        <div className="ml-auto flex items-end gap-2">
          {!deleteMode ? (
            <button
              type="button"
              className="text-xs border rounded px-3 h-9 hover:bg-gray-50"
              onClick={() => setDeleteMode(true)}
            >
              Modo eliminar
            </button>
          ) : (
            <>
              <button
                type="button"
                className="text-xs border rounded px-3 h-9 hover:bg-gray-50"
                onClick={clearSelection}
              >
                Limpiar selección
              </button>
              <button
                type="button"
                className="text-xs border rounded px-3 h-9 bg-red-600 text-white hover:bg-red-500 disabled:opacity-50"
                disabled={!selectedIds.size}
                onClick={requestDeleteSelected}
              >
                Eliminar seleccionados ({selectedIds.size})
              </button>
              <button
                type="button"
                className="text-xs border rounded px-3 h-9 hover:bg-gray-50"
                onClick={() => { setDeleteMode(false); clearSelection(); }}
              >
                Salir
              </button>
            </>
          )}
        </div>
      </div>

      {filtered.map((m) => {
        const id = String(m.id ?? cryptoRandomId());
        const movementType = (m as any).movementType ?? (m as any).movementTyoe ?? m.type;

        const when = (() => {
          const cd = m.created_date;
          const ca = m.created_at;
          if (cd) {
            const d = new Date(cd);
            if (!isNaN(d.getTime())) {
              if (ca && /\d{1,2}:\d{2}/.test(ca)) {
                const [h, min, sec] = ca.split(":");
                d.setHours(Number(h) || 0, Number(min) || 0, Number(sec) || 0, 0);
              }
              return formatDateTime(d.toISOString());
            }
          }
          return ca ? formatDateTime(ca) : "";
        })();

        const material = (() => {
          const invId = (m as any).name as number | string | undefined;
          if (invId == null) return undefined;
          const rec = inventoryById[String(invId)];
          return rec?.name;
        })();

        const user = (m as any).user?.name as string | undefined;

        const canSelect = m.id != null;
        const realId = m.id as string | number | undefined;
        const checked = realId != null ? selectedIds.has(String(realId)) : false;

        const qtyVal = m.quantity;
        const qtyChip = (() => {
          if (qtyVal == null) return null;
          const mt = String(movementType || "").toLowerCase();
          const isEntry = mt === "entry";
          const isExit = mt === "exit";
          const sign = isEntry ? "+" : isExit ? "-" : "";
          const color = isEntry ? "bg-green-50 text-green-700" : isExit ? "bg-red-50 text-red-700" : "bg-blue-50 text-blue-700";
          return (
            <span className={`text-xs rounded px-2 py-0.5 ${color}`}>
              {sign}{qtyVal}
            </span>
          );
        })();

        return (
          <Card key={id} className="p-4 shadow-sm border">
            <div className="flex flex-wrap items-center justify-between gap-3">
              <div className="min-w-0">
                <div className="flex flex-wrap items-center gap-2">
                  <span className="font-semibold">
                    {material || m.item_name || "Movimiento"}
                  </span>
                  {qtyChip}
                </div>
                <div className="text-xs text-gray-500 mt-1 flex flex-wrap gap-3">
                  {when && <span>{when}</span>}
                  {user && <span>Creado por: <span className="font-medium">{user}</span></span>}
                </div>
              </div>
              {!deleteMode && (
                <div className="ml-auto pl-2">
                  <Button variant="outline" size="sm" onClick={() => requestDeleteSingle(realId)} disabled={!canSelect}>
                    <Trash2 className="h-4 w-4" />
                  </Button>
                </div>
              )}
              {deleteMode && (
                <div className="ml-auto pl-2">
                  <label className={`flex items-center gap-2 ${!canSelect ? "opacity-40 cursor-not-allowed" : ""}`}>
                    <input
                      type="checkbox"
                      disabled={!canSelect}
                      checked={checked}
                      onChange={() => toggleSelect(realId)}
                    />
                    <span className="text-xs">Seleccionar</span>
                  </label>
                </div>
              )}
            </div>
          </Card>
        );
      })}
      <Dialog open={confirmOpen} onOpenChange={setConfirmOpen}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Confirmar eliminación</DialogTitle>
          </DialogHeader>
          <div className="space-y-3">
            <p className="text-sm">
              {confirmIds.length > 1
                ? `Vas a eliminar ${confirmIds.length} movimientos. Esta acción no se puede deshacer.`
                : `Vas a eliminar 1 movimiento. Esta acción no se puede deshacer.`}
            </p>
            <div className="flex justify-end gap-2 pt-2">
              <Button variant="outline" onClick={() => { setConfirmOpen(false); setConfirmIds([]); }}>
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
  );
}

function formatDateTime(value?: string) {
  if (!value) return "";
  try {
    const d = new Date(value);
    if (isNaN(d.getTime())) return value;
    return d.toLocaleString();
  } catch {
    return value;
  }
}

function cryptoRandomId() {
  try {
    return crypto.randomUUID();
  } catch {
    return Math.random().toString(36).slice(2);
  }
}
