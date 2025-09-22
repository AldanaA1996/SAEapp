import { useState, useEffect } from 'react';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { z } from 'zod';
import { Button } from '@/app/components/ui/button';
import { Input } from '@/app/components/ui/input';
import { Label } from '@/app/components/ui/label';
import { useAuthenticationStore } from '../store/authentication';
import { supabase } from '../lib/supabaseClient';

const Medidas = [ "Select",
  "Kg", "Mts", "Cms", "Cajas", "Unidades", "Paquetes", "Litros", "Gramos", "Piezas", "Bolsas", "Otros"
] as const;

const schema = z.object({
  name: z.string().min(1, 'El nombre es requerido'),
  quantity: z.number().min(1, 'La cantidad es requerida'),
  unit: z.enum(Medidas),
  description: z.string().optional(),
  manufactur: z.string().optional(),
  min_quantity: z.number().min(0).optional(),
  max_quantity: z.number().min(0).optional(),
  barcode: z.string().optional(),
});

interface AddMaterialFormProps {
  scannedBarcode?: string;
}

function AddMaterialForm({ scannedBarcode }: AddMaterialFormProps) {
  const [materials, setMaterials] = useState<Array<{ id: number; name: string; quantity: number; unit: string | null; min_quantity?: number | null }>>([]);
  const user = useAuthenticationStore((state) => state.user);

  useEffect(() => {
    const fetchInventory = async ()=> {
      const { data, error } = await supabase
        .from('inventory')
        .select('id,name,quantity,unit,min_quantity,manufactur,barcode');
      if (error) {
        console.error('Error al cargar inventario:', error);
      } else {
        setMaterials((data as any) || []);
      }
    };
    fetchInventory();
  }, []);

  const form = useForm<z.infer<typeof schema>>({
    resolver: zodResolver(schema),
    defaultValues: {
      name: '',
      quantity: 0,
      unit: 'Select',
      description: '',
      manufactur: '',
      min_quantity: undefined,
      max_quantity: undefined,
      barcode: '',
    },
  });

  useEffect(() => {
    if (scannedBarcode) {
      form.setValue('barcode', scannedBarcode, { shouldDirty: true });
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [scannedBarcode]);

 const onSubmit = async (values: z.infer<typeof schema>) => {
  try {
    const unitValue = values.unit && values.unit !== 'Select' ? values.unit : null;
    // Buscar si existe por nombre (globalmente)
    const existing = materials.find(m => m.name.toLowerCase() === values.name.trim().toLowerCase());

    if (existing) {
      // actualizar sumando cantidad
      const newQty = (existing.quantity || 0) + values.quantity;
      const { error: upErr } = await supabase
        .from('inventory')
        .update({
          quantity: newQty,
          unit: unitValue ?? existing.unit,
          description: values.description && values.description.trim() !== '' ? values.description.trim() : null,
          manufactur: values.manufactur && values.manufactur.trim() !== '' ? values.manufactur.trim() : null,
          min_quantity: values.min_quantity ?? (existing as any)?.min_quantity ?? null,
          max_quantity: values.max_quantity ?? (existing as any)?.max_quantity ?? null,
          barcode: values.barcode && values.barcode.trim() !== '' ? values.barcode.trim() : null,
        })
        .eq('id', existing.id);
      if (upErr) throw upErr;

      // activity con delta
      const horaActual = new Date().toLocaleTimeString('en-GB');
      await supabase.from('activity').insert([
        {
          name: existing.id,
          movementType: 'entry',
          created_by: user?.id ?? null,
          created_at: horaActual,
          created_date: new Date().toISOString(),
          quantity: values.quantity,
        },
      ]);
    } else {
      // insertar nuevo
      const { data: inserted, error: insErr } = await supabase
        .from('inventory')
        .insert([
          {
            name: values.name.trim(),
            quantity: values.quantity,
            unit: unitValue,
            department_id: null,
            description: values.description && values.description.trim() !== '' ? values.description.trim() : null,
            manufactur: values.manufactur && values.manufactur.trim() !== '' ? values.manufactur.trim() : null,
            min_quantity: values.min_quantity ?? null,
            max_quantity: values.max_quantity ?? null,
            barcode: values.barcode && values.barcode.trim() !== '' ? values.barcode.trim() : null,
            created_at: new Date().toISOString(),
          },
        ])
        .select()
        .single();
      if (insErr) throw insErr;

      const horaActual = new Date().toLocaleTimeString('en-GB');
      await supabase.from('activity').insert([
        {
          name: (inserted as any)?.id,
          movementType: 'entry',
          created_by: user?.id ?? null,
          created_at: horaActual,
          created_date: new Date().toISOString(),
          quantity: values.quantity,
        },
      ]);
    }

    // refrescar cache local
    const { data: mats } = await supabase.from('inventory').select('id,name,quantity,unit,min_quantity');
    setMaterials((mats as any) || []);

    form.reset();

    console.log('Ingreso registrado');
  } catch (err) {
    console.error("ERROR AL INTENTAR CREAR:", err);
  }
 };

  return (
    <form onSubmit={form.handleSubmit(onSubmit)} className="flex flex-col gap-4 w-full md:w-3/4">
      <Label htmlFor="name" className="font-semibold pt-2 px-4">Nombre del Material</Label>
      <div className="flex flex-col md:flex-row">
        <Input id="name" {...form.register('name')} placeholder="Ingrese el nombre del material" />
      </div>

      <Label htmlFor="quantity" className="font-semibold px-4">Cantidad</Label>
      <Input id="quantity" type="number" {...form.register('quantity', { valueAsNumber: true })} placeholder="Cantidad" />

      <Label htmlFor="unit" className="font-semibold px-4">Unidad</Label>
      <select id="unit" {...form.register('unit')} className="border rounded p-2">
        <option value="Select">Selecciona la unidad</option>
        {Medidas.map((medida) => (
          <option key={medida} value={medida}>{medida}</option>
        ))}
      </select>

      <Label htmlFor="min_quantity" className="font-semibold px-4">Alerta de stock mínimo (opcional)</Label>
      <Input
        id="min_quantity"
        type="number"
        step="1"
        min="0"
        {...form.register('min_quantity', {
          setValueAs: (v) => (v === '' || v === null || v === undefined ? undefined : Number(v)),
        })}
        placeholder="Ej: 5"
      />

      <Label htmlFor="max_quantity" className="font-semibold px-4">Stock máximo sugerido (opcional)</Label>
      <Input
        id="max_quantity"
        type="number"
        step="1"
        min="0"
        {...form.register('max_quantity', {
          setValueAs: (v) => (v === '' || v === null || v === undefined ? undefined : Number(v)),
        })}
        placeholder="Ej: 5"
      />

      <Label htmlFor='manufactur' className="font-semibold px-4">Fabricante (opcional)</Label>
      <Input id="manufactur" {...form.register('manufactur')} placeholder="Fabricante" />
      
      <Label htmlFor="barcode" className="font-semibold px-4">Código de barras</Label>
      <Input id="barcode" {...form.register('barcode')} placeholder="Escanéalo o escríbelo" />
     
      <Label htmlFor="description" className="font-semibold px-4">Descripción (opcional)</Label>
      <Input id="description" {...form.register('description')} placeholder="Descripción" />

      <Button type="submit" >Agregar Material</Button>
    </form>
  );
}

export default AddMaterialForm;
