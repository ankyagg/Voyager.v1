import { createBrowserRouter, Outlet } from "react-router";
import LandingPage from "./pages/LandingPage";
import DashboardLayout from "./layouts/DashboardLayout";
import TripDashboard from "./pages/TripDashboard";
import TripWorkspace from "./pages/TripWorkspace";
import DestinationDiscovery from "./pages/DestinationDiscovery";
import BudgetTracker from "./pages/BudgetTracker";

export const router = createBrowserRouter([
  {
    path: "/",
    element: <LandingPage />,
  },
  {
    path: "/dashboard",
    element: <DashboardLayout />,
    children: [
      { index: true, element: <TripDashboard /> },
      { path: "trips/:tripId", element: <TripWorkspace /> },
      { path: "saved", element: <DestinationDiscovery /> },
      { path: "budget", element: <BudgetTracker /> },
    ],
  },
]);
