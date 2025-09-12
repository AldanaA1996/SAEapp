import Layout from "@/app/components/layout";
import DepartmentsGrid from "../../departmentsGrid";

export default function DepartmentsPage() {
  return (
    <Layout>
      <div className="p-6">
        <h1 className="text-3xl font-bold mb-8 text-center">Departamentos</h1>
        <DepartmentsGrid />
      </div>
    </Layout>
  );
}
