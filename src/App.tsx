import Navbar from "./components/Navbar";
import AppProviders from "./app/providers";
import AppRoutes from "./app/routes";

export default function App() {
  return (
    <AppProviders>
      <Navbar />
      <AppRoutes />
    </AppProviders>
  );
}
