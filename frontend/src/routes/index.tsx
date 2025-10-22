import { Navigate, Route, Routes } from "react-router-dom";
import ListarCategorias from "../pages/categorias/listar-categorias";
import EditarCategoria from "../pages/categorias/editar-categoria";
import FormularioNovaCategoria from "../pages/categorias/formulario-nova-categoria";
import EditarProdutoForm from "../pages/produtos/editar-produto";
import ListarProdutos from "../pages/produtos/listar-produtos";

export default function AppRoutes() {
  return (
    <Routes>
      {/* rota principal */}
      <Route path="/" element={<h1>Página Inicial</h1>} />

      <Route path="/categorias" element={<ListarCategorias />} />
      <Route path="/produtos" element={<ListarProdutos />} />
      <Route path="/categorias/novo" element={<FormularioNovaCategoria />} />
      <Route
        path="/categorias/editar/:categoriaId"
        element={<EditarCategoria />}
      />

      <Route
        path="/produtos/editar/:produtoId"
        element={<EditarProdutoForm />}
      />

      <Route path="*" element={<Navigate to="/" />} />
    </Routes>
  );
}
