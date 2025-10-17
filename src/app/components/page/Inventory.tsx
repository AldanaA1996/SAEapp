
import Layout from "@/app/components/layout";
import AddMaterialForm from "@/app/components/addMaterial-form";

export function Inventario() {
  return (
    <Layout>
      <div className="flex flex-col h-screen w-[100%] self-center gap-4 m-2">
        
        <div className=" bg-white p-6 rounded-lg shadow-md mb-4">
          <h3 className="text-xl font-semibold p-2">Agregar Material</h3>
          <AddMaterialForm  />
        </div>

        
      </div>

      
    </Layout>
  );
}
export default Inventario;
