import { Toaster } from "@/components/ui/toaster";
import { Toaster as Sonner } from "@/components/ui/sonner";
import { TooltipProvider } from "@/components/ui/tooltip";
import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { BrowserRouter, Routes, Route } from "react-router-dom";
import { AuthProvider } from "@/context/AuthContext";
import { GoogleMapsProvider } from "@/context/GoogleMapsContext";
import ProtectedRoute from "@/components/ProtectedRoute";
import OfflineIndicator from "@/components/pwa/OfflineIndicator";
import Index from "./pages/Index";
import Login from "./pages/Login";
import Signup from "./pages/Signup";
import Dashboard from "./pages/Dashboard";
import Itinerary from "./pages/Itinerary";
import TripResult from "./pages/TripResult";
import NotFound from "./pages/NotFound";

const queryClient = new QueryClient();

const App = () => (
  <QueryClientProvider client={queryClient}>
    <AuthProvider>
      <GoogleMapsProvider>
        <TooltipProvider>
          <Toaster />
          <Sonner />
          <OfflineIndicator />
        <BrowserRouter>
          <Routes>
            <Route path="/" element={<Index />} />
            <Route path="/login" element={<Login />} />
            <Route path="/signup" element={<Signup />} />
            <Route
              path="/dashboard"
              element={
                <ProtectedRoute>
                  <Dashboard />
                </ProtectedRoute>
              }
            />
            <Route
              path="/itinerary/:tripId"
              element={
                <ProtectedRoute>
                  <Itinerary />
                </ProtectedRoute>
              }
            />
            <Route
              path="/trip/:tripId"
              element={
                <ProtectedRoute>
                  <TripResult />
                </ProtectedRoute>
              }
            />
          {/* ADD ALL CUSTOM ROUTES ABOVE THE CATCH-ALL "*" ROUTE */}
            <Route path="*" element={<NotFound />} />
          </Routes>
        </BrowserRouter>
        </TooltipProvider>
      </GoogleMapsProvider>
    </AuthProvider>
  </QueryClientProvider>
);

export default App;
