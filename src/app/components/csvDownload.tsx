import { supabase } from "@/app/lib/supabaseClient";

// Escapa valores para CSV
const toCsvValue = (v: any) => {
  if (v === null || v === undefined) return "";
  const s = String(v);
  const needsQuotes = /[",\n;]/.test(s);
  const escaped = s.replace(/"/g, '""');
  return needsQuotes ? `"${escaped}"` : escaped;
};

// Descarga un Blob con BOM para compatibilidad con Excel
const downloadBlob = (data: BlobPart, filename: string, type = "text/csv;charset=utf-8;") => {
  const blob = new Blob(["\uFEFF", data], { type });
  const url = URL.createObjectURL(blob);
  const a = document.createElement("a");
  a.href = url;
  a.download = filename;
  document.body.appendChild(a);
  a.click();
  a.remove();
  URL.revokeObjectURL(url);
};

// Exporta todo el inventario como CSV
export const downloadInventoryCsv = async () => {
  // Fetch all rows using pagination to avoid implicit limits
  const PAGE_SIZE = 1000;
  let rows: Array<Record<string, any>> = [];
  // Try to get exact count first
  const { count, error: countErr } = await supabase
    .from("inventory")
    .select("id, name, quantity, unit, manufactur, created_at", { count: "exact", head: true });

  if (!countErr && typeof count === "number") {
    // Known total rows: loop by pages
    for (let from = 0; from < count; from += PAGE_SIZE) {
      const to = Math.min(from + PAGE_SIZE - 1, count - 1);
      const { data, error } = await supabase
        .from("inventory")
        .select("id, name, quantity, unit, manufactur, created_at")
        .order("id", { ascending: true })
        .range(from, to);
      if (error) throw error;
      rows = rows.concat((data as any[]) || []);
    }
  } else {
    // Fallback: pull pages until we get a short page
    let offset = 0;
    // eslint-disable-next-line no-constant-condition
    while (true) {
      const from = offset;
      const to = offset + PAGE_SIZE - 1;
      const { data, error } = await supabase
        .from("inventory")
        .select("id, name, quantity, unit, manufactur, created_at")
        .order("id", { ascending: true })
        .range(from, to);
      if (error) throw error;
      const batch = (data as any[]) || [];
      rows = rows.concat(batch);
      if (batch.length < PAGE_SIZE) break;
      offset += PAGE_SIZE;
    }
  }

  if (!rows.length) {
    downloadBlob("", "inventario.csv");
    return;
  }

  const baseHeaders = [
    "id",
    "name",
    "quantity",
    "unit",   
    "manufactur",    
    "created_at",   
  ];

  const extraKeys = Array.from(
    rows.reduce<Set<string>>((set, r) => {
      Object.keys(r).forEach((k) => set.add(k));
      return set;
    }, new Set<string>())
  ).filter((k) => !baseHeaders.includes(k));

  const separator = ";";
  const headers = [...baseHeaders, ...extraKeys];
  const headerLine = headers.map(toCsvValue).join(separator);
  const lines = rows.map((r) => headers.map((h) => toCsvValue(r[h])).join(separator));
  const csv = [headerLine, ...lines].join("\n");

  const ts = new Date().toISOString().replace(/[:T]/g, "-").split(".")[0];
  downloadBlob(csv, `inventario-${ts}.csv`);
};

export default downloadInventoryCsv;
