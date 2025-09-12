import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { z } from 'zod';
import { Button } from '@/app/components/ui/button';
import { Input } from '@/app/components/ui/input';
import { Label } from '@/app/components/ui/label';
import { supabase } from '../lib/supabaseClient';

const Medidas = [ "Select",
  "Kg", "Mts", "Cms", "Caja", "Unidad", "Paquete", "Litro", "Gramo", "Pieza", "Bolsa", "Otro"
] as const;

const schema = z.object({
  name: z.string().min(1, 'El nombre es requerido'),
  quantity: z.number().min(0, 'La cantidad no puede ser negativa'),
  weight: z.number().nullable().optional(),
  width: z.number().nullable().optional(),
  height: z.number().nullable().optional(),
  color: z.string().nullable().optional(),
  manufactur: z.string().nullable().optional(),
  barcode: z.string().nullable().optional(),
  hasQrCode: z.boolean().nullable().optional(),
  description: z.string().nullable().optional(),
  unit: z.enum(Medidas),
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
    barcode?: string;
    hasQrCode?: boolean;
    description?: string;
    unit: "Select" | "Kg" | "Mts" | "Cms" | "Caja" | "Unidad" | "Paquete" | "Litro" | "Gramo" | "Pieza" | "Bolsa" | "Otro";
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
      barcode: material.barcode,
      hasQrCode: material.hasQrCode,
      description: material.description,
      unit: material.unit,
    },
  });

  const onSubmit = async (values: z.infer<typeof schema>) => {
    try {
        const cleanedValues = Object.fromEntries(
            Object.entries(values).map(([k, v]) => [k,v === undefined ? null : v])
        );
      const { error } = await supabase
        .from('inventory')
        .update(cleanedValues)
        .eq('id', material.id);

      if (error) throw error;

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

      <Label htmlFor="quantity">Cantidad</Label>
      <Input id="quantity" type="number" {...form.register('quantity', { valueAsNumber: true })} />

      <Label htmlFor="weight">Peso</Label>
      <Input id="weight" type="number" {...form.register('weight', { valueAsNumber: true })} />

      <Label htmlFor="width">Ancho</Label>
      <Input id="width" type="number" {...form.register('width', { valueAsNumber: true })} />

      <Label htmlFor="height">Alto</Label>
      <Input id="height" type="number" {...form.register('height', { setValueAs: (v)=> v === "" ? null : Number(v) })} />

      <Label htmlFor="color">Color</Label>
      <Input id="color" {...form.register('color')} />

      <Label htmlFor="manufactur">Fabricante</Label>
      <Input id="manufactur" {...form.register('manufactur')} />

      <Label htmlFor="barcode">Código de Barras</Label>
      <Input id="barcode" {...form.register('barcode')} />

      <div className="flex items-center gap-2">
        <Input id="hasQRcode" type="checkbox" {...form.register('hasQrCode')} />
        <Label htmlFor="hasQRcode">Tiene código QR</Label>
      </div>

      <Label htmlFor="description">Descripción</Label>
      <Input id="description" {...form.register('description')} />

      <Label htmlFor="unit">Unidad</Label>
      <select id="unit" {...form.register('unit')} className="border rounded p-2">
        {Medidas.map((medida) => (
          <option key={medida} value={medida}>{medida}</option>
        ))}
      </select>

      <Button type="submit">Guardar Cambios</Button>
    </form>
  );
}

export default EditMaterialForm;
