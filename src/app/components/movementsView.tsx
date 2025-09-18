import { useEffect, useMemo, useState } from "react";
import { supabase } from "@/app/lib/supabaseClient";
import { Card } from "@/app/components/ui/card";
import { Input } from "@/app/components/ui/input";

type MovementRecord = Record<string, any> & {
  id?: number | string;
  created_at?: string;
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
  const [userByAuth, setUserByAuth] = useState<Record<string, { name?: string; volunteer?: string | number }>>({});
  const [inventoryById, setInventoryById] = useState<Record<string, { name?: string }>>({});
  const [toolsById, setToolsById] = useState<Record<string, { name?: string }>>({});
  // Filters
  const [fromDate, setFromDate] = useState<string>("");
  const [toDate, setToDate] = useState<string>("");
  const [typeFilter, setTypeFilter] = useState<string>("");
  // Delete mode
  const [deleteMode, setDeleteMode] = useState(false);
  const [selectedIds, setSelectedIds] = useState<Set<string>>(new Set());

  useEffect(() => {
    const load = async () => {
      setLoading(true);
      setError(null);
      try {
        // Try to order by created_at (desc) and then by created_date (desc) as secondary order
        // to match the user's schema. We select all columns to keep it flexible (includes relations if configured in Supabase).
        const query = supabase
          .from(tableName)
          .select("*")
          .order("created_at", { ascending: false })
          .order("created_date", { ascending: false });
        const { data, error } = await query;
        if (error) throw error;
        const rows = (data as MovementRecord[]) || [];
        setData(rows);

        // Resolve related entities
        const createdBySet = new Set<string>();
        const invIdSet = new Set<number>();
        const toolIdSet = new Set<number>();

        for (const r of rows) {
          const cb = (r as any).created_by as string | undefined;
          if (cb) createdBySet.add(cb);
          const invId = (r as any).name as number | undefined; // activity.name references inventory.id
          if (typeof invId === 'number') invIdSet.add(invId);
          const toolId = (r as any).tool as number | undefined; // activity.tool references tools.id
          if (typeof toolId === 'number') toolIdSet.add(toolId);
        }

        if (createdBySet.size) {
          const { data: usersData } = await supabase
            .from('user')
            .select('userAuth, name, volunteerNumber')
            .in('userAuth', Array.from(createdBySet));
          const mapUsers: Record<string, { name?: string; volunteer?: string | number }> = {};
          (usersData || []).forEach((u: any) => {
            mapUsers[u.userAuth] = {
              name: u.name ?? undefined,
              volunteer: u.volunteerNumber ?? undefined,
            };
          });
          setUserByAuth(mapUsers);
        } else {
          setUserByAuth({});
        }

        if (invIdSet.size) {
          const { data: invData } = await supabase
            .from('inventory')
            .select('id, name')
            .in('id', Array.from(invIdSet));
          const mapInv: Record<string, { name?: string }> = {};
          (invData || []).forEach((i: any) => {
            mapInv[String(i.id)] = { name: i.name };
          });
          setInventoryById(mapInv);
        } else {
          setInventoryById({});
        }

        if (toolIdSet.size) {
          const { data: toolData } = await supabase
            .from('tools')
            .select('id, name')
            .in('id', Array.from(toolIdSet));
          const mapTools: Record<string, { name?: string }> = {};
          (toolData || []).forEach((t: any) => {
            mapTools[String(t.id)] = { name: t.name };
          });
          setToolsById(mapTools);
        } else {
          setToolsById({});
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

  // Derive movement types and apply filters (hooks must be before any early returns)
  const movementTypes = useMemo(() => {
    const set = new Set<string>();
    data.forEach((m) => {
      const mt = (m as any).movementType ?? (m as any).movementTyoe ?? m.type;
      if (mt) set.add(String(mt));
    });
    return Array.from(set).sort();
  }, [data]);

  const filtered = useMemo(() => {
    const from = fromDate ? new Date(fromDate + "T00:00:00") : null;
    const to = toDate ? new Date(toDate + "T23:59:59.999") : null;

    const getWhen = (m: MovementRecord): Date | null => {
      const cd = (m as any).created_date as string | undefined;
      const ca = (m as any).created_at as string | undefined;
      if (cd) {
        // If we have both date and a time-like, try to combine
        try {
          if (ca && /\d{1,2}:\d{2}/.test(ca)) {
            // Combine date part from created_date with time from created_at
            const d = new Date(cd);
            const [h, min, sec] = ca.split(":");
            if (!isNaN(d.getTime())) {
              d.setHours(Number(h) || 0, Number(min) || 0, Number(sec) || 0, 0);
              return d;
            }
          }
          const d = new Date(cd);
          if (!isNaN(d.getTime())) return d;
        } catch {}
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

  const deleteSelected = async () => {
    if (!selectedIds.size) return;
    try {
      const ids = Array.from(selectedIds).map((x) => (isNaN(Number(x)) ? x : Number(x)));
      const { error } = await supabase.from(tableName).delete().in("id", ids as any[]);
      if (error) throw error;
      // Remove locally
      const setIds = new Set(selectedIds);
      setData((prev) => prev.filter((r) => !setIds.has(String(r.id))));
      clearSelection();
      setDeleteMode(false);
    } catch (err) {
      console.error("Error al eliminar movimientos:", err);
    }
  };

  if (loading) return <p className="p-4 text-center">Cargando movimientos...</p>;
  if (error) return <p className="p-4 text-center text-red-500">{error}</p>;

  if (!data.length) {
    return <p className="p-4 text-center text-gray-500">No hay movimientos registrados.</p>;
  }

  return (
    <div className="space-y-3 p-2">
      {/* Filters bar */}
      <div className="sticky top-0 z-10 bg-white/70 backdrop-blur border rounded-md p-3 flex flex-wrap items-end gap-3">
        <div>
          <label className="block text-xs text-gray-600 mb-1">Desde</label>
          <Input type="date" value={fromDate} onChange={(e) => setFromDate(e.target.value)} className="w-44" />
        </div>
        <div>
          <label className="block text-xs text-gray-600 mb-1">Hasta</label>
          <Input type="date" value={toDate} onChange={(e) => setToDate(e.target.value)} className="w-44" />
        </div>
        <div>
          <label className="block text-xs text-gray-600 mb-1">Tipo</label>
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
                onClick={deleteSelected}
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
        const when = m.created_at ?? (m as any).created_date;
        const movementType = (m as any).movementType ?? (m as any).movementTyoe ?? m.type;
        // Resolve names via maps (activity.name -> inventory.id, activity.tool -> tools.id)
        const material = (() => {
          const invId = (m as any).name as number | string | undefined;
          if (invId == null) return undefined;
          const rec = inventoryById[String(invId)];
          return rec?.name;
        })();
        const tool = (() => {
          const toolId = (m as any).tool as number | string | undefined;
          if (toolId == null) return undefined;
          const rec = toolsById[String(toolId)];
          return rec?.name;
        })();
        const createdBy = (() => {
          const authId = (m as any).created_by as string | undefined;
          if (!authId) return undefined;
          const rec = userByAuth[authId];
          if (!rec) return undefined;
          return rec.name || String(rec.volunteer) || undefined;
        })();

        const canSelect = (m as any).id != null;
        const realId = (m as any).id as string | number | undefined;
        const checked = realId != null ? selectedIds.has(String(realId)) : false;
        return (
          <Card key={id} className="p-4 shadow-sm border">
            <div className="flex flex-wrap items-center justify-between gap-3">
              <div className="min-w-0">
                <div className="flex flex-wrap items-center gap-2">
                  <span className="font-semibold">
                    {material || tool || m.item_name || "Movimiento"}
                  </span>
                  {/* <span>
                    {tool?.amount || material?.amount || ""}
                  </span> */}
                  {movementType && (
                    <span className="text-xs rounded bg-gray-100 px-2 py-0.5 text-gray-700">
                      {movementType}
                    </span>
                  )}
                  {(m as any).quantity != null && (
                    <span className="text-xs rounded bg-blue-50 px-2 py-0.5 text-blue-700">
                      Qty: {(m as any).quantity}
                    </span>
                  )}
                </div>
                <div className="text-xs text-gray-500 mt-1 flex flex-wrap gap-3">
                  {when && <span>{formatDateTime(when)}</span>}
                  {createdBy && (
                    <span>
                      Creado por: <span className="font-medium">{createdBy}</span>
                    </span>
                  )}
                </div>
              </div>
              {deleteMode && (
                <div className="ml-auto pl-2">
                  <label className={`flex items-center gap-2 ${!canSelect ? 'opacity-40 cursor-not-allowed' : ''}`}>
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
  // Fallback id for items without id
  try {
    return crypto.randomUUID();
  } catch {
    return Math.random().toString(36).slice(2);
  }
}
