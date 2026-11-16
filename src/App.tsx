import Navbar from "./components/Navbar";
import AppProviders from "./app/providers";
import AppRoutes from "./app/routes";
import MainScrollArea from "./components/MainScrollArea";

export default function App() {
  return (
    <AppProviders>
      <Navbar />
      <MainScrollArea>
        <AppRoutes />
      </MainScrollArea>
    </AppProviders>
  );
}
