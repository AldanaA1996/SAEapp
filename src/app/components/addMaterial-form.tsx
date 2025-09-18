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
  "Kg", "Mts", "Cms", "Caja", "Unidad", "Paquete", "Litro", "Gramo", "Pieza", "Bolsa", "Otro"
] as const;

const schema = z.object({
  name: z.string().min(1, 'El nombre es requerido'),
  quantity: z.number().min(1, 'La cantidad es requerida'),
  unit: z.enum(Medidas),
  description: z.string().optional(),
  barcode: z.string().optional(),
});

interface AddMaterialFormProps {
  scannedBarcode?: string;
}

function AddMaterialForm({ scannedBarcode }: AddMaterialFormProps) {
  const [materials, setMaterials] = useState<Array<{ id: number; name: string; quantity: number; unit: string | null }>>([]);
  const user = useAuthenticationStore((state) => state.user);

  useEffect(() => {
    const fetchInventory = async ()=> {
      const { data, error } = await supabase
        .from('inventory')
        .select('id,name,quantity,unit');
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
          description: values.description ?? null,
          barcode: values.barcode ?? null,
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
            description: values.description ?? null,
            barcode: values.barcode ?? null,
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
    const { data: mats } = await supabase.from('inventory').select('id,name,quantity,unit');
    setMaterials((mats as any) || []);

    form.reset();

    console.log('Ingreso registrado');
  } catch (err) {
    console.error("ERROR AL INTENTAR CREAR:", err);
  }
 };

  return (
    <form onSubmit={form.handleSubmit(onSubmit)} className="flex flex-col gap-4 w-1/2">
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
      
      <Label htmlFor="barcode" className="font-semibold px-4">Código de barras</Label>
      <Input id="barcode" {...form.register('barcode')} placeholder="Escanéalo o escríbelo" />
     
      <Label htmlFor="description" className="font-semibold px-4">Descripción (opcional)</Label>
      <Input id="description" {...form.register('description')} placeholder="Descripción" />

      <Button type="submit" >Agregar Material</Button>
    </form>
  );
}

export default AddMaterialForm;
