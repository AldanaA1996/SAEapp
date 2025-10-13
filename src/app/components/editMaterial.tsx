import { useEffect } from 'react';
import { useForm, Controller } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { z } from 'zod';
import { Button } from '@/app/components/ui/button';
import { Input } from '@/app/components/ui/input';
import { Label } from '@/app/components/ui/label';
import { supabase } from '../lib/supabaseClient';

const Medidas = [ "Select",
  "Kg", "Mts", "Cms", "Cajas", "Unidades", "Paquetes", "Litros", "Gramos", "Piezas", "Bolsas", "Otros"
] as const;

const Ubicaciones = [ "Select", "Pañol", "Taller", "Contenedor", "Ferreteria" ] as const;

const schema = z.object({
  name: z.string().min(1, 'El nombre es requerido'),
  quantity: z.number().min(0, 'La cantidad no puede ser negativa'),
  weight: z.number().nullable().optional(),
  width: z.number().nullable().optional(),
  height: z.number().nullable().optional(),
  color: z.string().nullable().optional(),
  manufactur: z.string().nullable().optional(),
  // barcode: z.string().nullable().optional(),
  description: z.string().nullable().optional(),
  unit: z.enum(Medidas),
  min_quantity: z.number().nullable().optional(),
  max_quantity: z.number().nullable().optional(),
  location: z.enum(Ubicaciones),
});

interface EditMaterialFormProps {
  material: {
    id: number;
    name: string;
    quantity: number;
    weight?: number;
    width?: number;
    height?: number;
    color?: string;
    manufactur?: string;
    // barcode?: string;
    min_quantity?: number;
    max_quantity?: number;
    description?: string;
    unit: "Select" | "Kg" | "Mts" | "Cms" | "Cajas" | "Unidades" | "Paquetes" | "Litros" | "Gramos" | "Piezas" | "Bolsas" | "Otros";
    location: "Select" | "Pañol" | "Taller" | "Contenedor" | "Ferreteria";
  };
  onClose: () => void;
}

function EditMaterialForm({ material, onClose }: EditMaterialFormProps) {
  const form = useForm<z.infer<typeof schema>>({
    resolver: zodResolver(schema),
    defaultValues: {
      name: material.name,
      quantity: material.quantity,
      weight: material.weight,
      width: material.width,
      height: material.height,
      color: material.color,
      manufactur: material.manufactur,
      // barcode: material.barcode,
      description: material.description,
      unit: material.unit,
      min_quantity: material.min_quantity,
      max_quantity: material.max_quantity,
      location: material.location,
    },
  });

  // Reset form values when the incoming material prop changes
  useEffect(() => {
    form.reset({
      name: material.name,
      quantity: material.quantity,
      weight: material.weight ?? null,
      width: material.width ?? null,
      height: material.height ?? null,
      color: material.color ?? null,
      manufactur: material.manufactur ?? null,
      // barcode: material.barcode ?? null,
      description: material.description ?? null,
      unit: material.unit,
      min_quantity: typeof material.min_quantity === 'number' ? material.min_quantity : null,
      max_quantity: typeof material.max_quantity === 'number' ? material.max_quantity : null,
      location: material.location,
    });
  }, [material, form]);

  const onSubmit = async (values: z.infer<typeof schema>) => {
    try {
        const cleanedEntries = Object.entries(values).map(([k, v]) => {
          // map empty strings and NaN to null
          if (v === undefined || v === "") return [k, null] as const;
          if (typeof v === "number" && Number.isNaN(v)) return [k, null] as const;
          return [k, v] as const;
        });
        const interim = Object.fromEntries(cleanedEntries) as Record<string, any>;
        // normalize unit: if 'Select', do not send unit to DB (avoid overwriting with null)
        if (interim.unit === 'Select') delete interim.unit;

        const { error, data } = await supabase
        .from('inventory')
        .update(interim)
        .eq('id', material.id)
        .select()
        .single();

      if (error) throw error;
      if (!data) {
        console.warn('La actualización no devolvió datos. Verifica que el id exista:', material.id);
      }

      console.log('Material actualizado');
      onClose();
    } catch (err) {
      console.error('Error al actualizar el material:', err);
    }
  };

  return (
    <form onSubmit={form.handleSubmit(onSubmit)} className="flex flex-col gap-4">
      <Label htmlFor="name">Nombre del Material</Label>
      <Input id="name" {...form.register('name')} />
      <div className="flex flex-col md:flex-row gap-4">
      <Label htmlFor="quantity">Cantidad</Label>
      <Input id="quantity" type="number" {...form.register('quantity', { valueAsNumber: true })} />
     

      <Label htmlFor="unit">Unidad</Label>
      <select id="unit" {...form.register('unit')} className="border rounded p-2">
        {Medidas.map((medida) => (
          <option key={medida} value={medida}>{medida}</option>
        ))}
      </select>
      </div>
      <Label htmlFor="min_quantity">Alerta de stock mínimo (opcional)</Label>
      <Input id="min_quantity" type="number"  min="0" {...form.register('min_quantity', { valueAsNumber: true })} />
      
      <Label htmlFor="max_quantity">Stock máximo sugerido (opcional)</Label>
      <Input id="max_quantity" type="number"  min="0" {...form.register('max_quantity', { valueAsNumber: true })} />
     
     {/* <div className="flex flex-col md:flex-row gap-4"> */}
      {/* <Label htmlFor="barcode">Bar Code</Label> */}
      {/* <Input id="barcode" {...form.register('barcode', { setValueAs: (v)=> (v === "" || v === undefined ? null : v) })} /> */}
    {/* </div> */}
      <Label htmlFor="location">Ubicación</Label>
      <select id="location" {...form.register('location')} className="border rounded p-2">
        {Ubicaciones.map((ubicacion) => (
          <option key={ubicacion} value={ubicacion}>{ubicacion}</option>
        ))}
      </select>
      <Label htmlFor="manufactur">Fabricante</Label>
      <Input id="manufactur" {...form.register('manufactur')} />
     
      <Label htmlFor="weight">Peso</Label>
      <Input
        id="weight"
        type="number"
        {...form.register('weight', {
          setValueAs: (v) => (v === "" || v === undefined ? null : Number(v)),
        })}
      />

      <Label htmlFor="width">Ancho</Label>
      <Input
        id="width"
        type="number"
        {...form.register('width', {
          setValueAs: (v) => (v === "" || v === undefined ? null : Number(v)),
        })}
      />

      <Label htmlFor="height">Alto</Label>
      <Input
        id="height"
        type="number"
        {...form.register('height', {
          setValueAs: (v) => (v === "" || v === undefined ? null : Number(v)),
        })}
      />

      <Label htmlFor="color">Color</Label>
      <Input id="color" {...form.register('color')} />
      
      

      <Label htmlFor="description">Descripción</Label>
      <Input id="description" {...form.register('description')} />

      

      <Button type="submit">Guardar Cambios</Button>
    </form>
  );
}

export default EditMaterialForm;
