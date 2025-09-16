import { useForm, Controller } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { z } from 'zod';
import { Button } from '@/app/components/ui/button';
import { Input } from '@/app/components/ui/input';
import { Label } from '@/app/components/ui/label';
import { supabase } from '../lib/supabaseClient';


const schema = z
  .object({
  name: z.string().min(1, 'El nombre es requerido'),
  amount: z.number().min(0, 'La cantidad no puede ser negativa'),
  manufactur: z.string().nullable().optional(),
  barcode: z.number().nullable().optional(),
  hasQrCode: z.boolean().nullable().optional(),
  description: z.string().nullable().optional(),
  // fechas en formato string (YYYY-MM-DD) para inputs type="date"
  purchase_date: z.string().nullable().optional(),
  warrantyExpirationDate: z.string().nullable().optional(),
  })
  .superRefine((val, ctx) => {
    if (val.purchase_date && val.warrantyExpirationDate) {
      // Comparación segura para formato YYYY-MM-DD (lexicográfica)
      if (val.warrantyExpirationDate < val.purchase_date) {
        ctx.addIssue({
          code: z.ZodIssueCode.custom,
          message: 'La garantía no puede vencer antes de la fecha de compra',
          path: ['warrantyExpirationDate'],
        });
      }
    }
  });

interface EditToolFormProps {
  tools: {
    id: number;
    name: string;
    amount: number;
    manufactur?: string;
    barcode?: number;
    hasQrCode?: boolean;
    description?: string;
    purchase_date?: string | null;
    warrantyExpirationDate?: string | null;
  };
  onClose: () => void;
}

function EditToolForm({ tools, onClose }: EditToolFormProps) {
  const form = useForm<z.infer<typeof schema>>({
    resolver: zodResolver(schema),
    defaultValues: {
      name: tools.name,
      amount: tools.amount,
      manufactur: tools.manufactur,
      barcode: tools.barcode,
      hasQrCode: tools.hasQrCode,
      description: tools.description,
      purchase_date: tools.purchase_date ?? undefined,
      warrantyExpirationDate: tools.warrantyExpirationDate ?? undefined,
     
    },
  });

  const onSubmit = async (values: z.infer<typeof schema>) => {
    try {
      const cleanedValues = Object.fromEntries(
        Object.entries(values).map(([k, v]) => [k, v === undefined ? null : v])
      );

      const { error } = await supabase
        .from('tools')
        .update(cleanedValues)
        .eq('id', tools.id);

      if (error) throw error;

      console.log('Herramienta actualizada');
      onClose();
    } catch (err) {
      console.error('Error al actualizar la herramienta:', err);
    }
  };

  return (
    <form onSubmit={form.handleSubmit(onSubmit)} className="flex flex-col gap-4">
      <Label htmlFor="name">Nombre de la Herramienta</Label>
      <Input id="name" {...form.register('name')} />

      <Label htmlFor="amount">Cantidad</Label>
      <Input
        id="amount"
        type="number"
        {...form.register('amount', { valueAsNumber: true })}
      />

      <Label htmlFor="manufactur">Fabricante</Label>
      <Input id="manufactur" {...form.register('manufactur')} />

      <Label htmlFor="barcode">Código de Barras</Label>
      <Input
        id="barcode"
        type="number"
        {...form.register('barcode', { valueAsNumber: true })}
      />

      <Label htmlFor="purchase_date">Fecha de compra</Label>
      <Input
        id="purchase_date"
        type="date"
        {...form.register('purchase_date')}
      />

      <Label htmlFor="warrantyExpirationDate">Vencimiento de garantía</Label>
      <Input
        id="warrantyExpirationDate"
        type="date"
        {...form.register('warrantyExpirationDate')}
      />

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

export default EditToolForm;
