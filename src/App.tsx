import { BrowserRouter, Routes, Route } from "react-router-dom";
import { ThemeProvider } from "@/hooks/use-theme";
import { Layout } from "@/layouts/layout";
import { HomePage } from "@/pages/home";
import { ApiTesterPage } from "@/pages/api-tester";
import { CalculatorPage } from "@/pages/calculator";
import { BlueprintPage } from "@/pages/blueprint";

import "./index.css";

export function App() {
  return (
    <ThemeProvider defaultTheme="system" storageKey="ui-theme">
      <BrowserRouter>
        <Routes>
          <Route element={<Layout />}>
            <Route index element={<HomePage />} />
            <Route path="api-tester" element={<ApiTesterPage />} />
            <Route path="calculator" element={<CalculatorPage />} />
            <Route path="blueprint" element={<BlueprintPage />} />
          </Route>
        </Routes>
      </BrowserRouter>
    </ThemeProvider>
  );
}

export default App;
