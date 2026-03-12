
  import { createRoot } from "react-dom/client";
  import App from "./app/App.tsx";
  import "./styles/index.css";
  import { AuthProvider } from "./app/contexts/AuthContext.tsx";
  import { TripProvider } from "./app/contexts/TripContext.tsx";

  createRoot(document.getElementById("root")!).render(
    <AuthProvider>
      <TripProvider>
        <App />
      </TripProvider>
    </AuthProvider>
  );
  