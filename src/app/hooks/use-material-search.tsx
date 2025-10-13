import { useState, useEffect } from 'react';
import { supabase } from '../lib/supabaseClient';
import type { Material } from '../lib/types';

export function useSearch () {
  const [searchTerm, setSearchTerm] = useState('');
  const [materials, setMaterials] = useState<Material[]>([]);
  const [selectedMaterial, setSelectedMaterial] = useState<Material | null>(null);
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    if (!searchTerm.trim()) {
      setMaterials([]);
      return;
    }

    // No buscar si ya hay un material seleccionado
    if (selectedMaterial) {
      return;
    }

    const searchMaterials = async () => {
      setIsLoading(true);
      setError(null);
      try {
        const { data, error } = await supabase
          .from('inventory')
          .select('id, name, quantity, unit, location, manufactur')
          .ilike('name', `%${searchTerm}%`)
          .gt('quantity', 0);

        if (error) throw error;

        setMaterials(data || []);
      } catch (err: any) {
        console.error("Error al buscar materiales:", err);
        setError("No se pudieron cargar los materiales.");
      } finally {
        setIsLoading(false);
      }
    };

    const delayDebounceFn = setTimeout(() => {
      searchMaterials();
    }, 300);

    return () => clearTimeout(delayDebounceFn);
  }, [searchTerm, selectedMaterial]);

  return { searchTerm, setSearchTerm, materials, isLoading, error, selectedMaterial, setSelectedMaterial, setMaterials };
}

export default useSearch;