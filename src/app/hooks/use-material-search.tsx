import { useState, useEffect } from 'react';
import { useAuthenticationStore } from '../store/authentication';
import { supabase } from '../lib/supabaseClient';
import type { Material } from '../components/egressMaterial-form';

export function useSearch () {
  const [searchTerm, setSearchTerm] = useState('');
  const [materials, setMaterials] = useState<Material[]>([]);
  const [selectedMaterial, setSelectedMaterial] = useState<Material | null>(null);
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  
  const user = useAuthenticationStore((state) => state.user);



  useEffect(() => {
     if (!searchTerm.trim()) {
       setMaterials([]);
       return;
     }
 
     const searchMaterials = async () => {
       setIsLoading(true);
       setError(null);
       try {
         const { data, error } = await supabase
           .from('inventory')
           .select('id, name, quantity, unit, location, manufactur')
           .like('name', `%${searchTerm}%`)
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
   }, [searchTerm]);

   return { searchTerm, setSearchTerm, materials, isLoading, error, selectedMaterial, setSelectedMaterial, setMaterials };
  }

  export default useSearch;