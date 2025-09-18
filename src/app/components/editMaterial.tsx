import { useForm, Controller } from 'react-hook-form';
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

      <Label htmlFor="quantity">Cantidad</Label>
      <Input id="quantity" type="number" {...form.register('quantity', { valueAsNumber: true })} />

      <Label htmlFor="unit">Unidad</Label>
      <select id="unit" {...form.register('unit')} className="border rounded p-2">
        {Medidas.map((medida) => (
          <option key={medida} value={medida}>{medida}</option>
        ))}
      </select>
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

      <Label htmlFor="manufactur">Fabricante</Label>
      <Input id="manufactur" {...form.register('manufactur')} />

      <Label htmlFor="barcode">Código de Barras</Label>
      <Input id="barcode" {...form.register('barcode', { setValueAs: (v)=> (v === "" || v === undefined ? null : v) })} />

      
      <div className="flex items-center gap-3">
       <Label>Tiene código QR</Label>
        <Controller
          name="hasQrCode"
          control={form.control}
          render={({ field }) => (
            <button
              type="button"
              role="switch"
              aria-checked={!!field.value}
              onClick={() => field.onChange(!field.value)}
              className={`relative inline-flex h-6 w-11 items-center rounded-full transition-colors focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-blue-500 ${
                field.value ? 'bg-green-500' : 'bg-gray-300'
              }`}
            >
              <span
                className={`inline-block h-5 w-5 transform rounded-full bg-white shadow transition-transform ${
                  field.value ? 'translate-x-5' : 'translate-x-1'
                }`}
              />
            </button>
          )}
        />
        
      </div>

      <Label htmlFor="description">Descripción</Label>
      <Input id="description" {...form.register('description')} />

      

      <Button type="submit">Guardar Cambios</Button>
    </form>
  );
}

export default EditMaterialForm;
