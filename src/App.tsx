import { useState, useEffect } from "react";
import { Toaster } from "@/components/ui/toaster";
import { Toaster as Sonner } from "@/components/ui/sonner";
import { TooltipProvider } from "@/components/ui/tooltip";
import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { BrowserRouter, Routes, Route, Navigate } from "react-router-dom";
import { supabase } from "@/integrations/supabase/client";
import Index from "./pages/Index";
import Auth from "./pages/Auth";
import NotFound from "./pages/NotFound";
import SplashScreen from "./components/SplashScreen";
import CurrentMonthSurcharges from "./pages/CurrentMonthSurcharges";
import Reports from "./pages/Reports";
import EmailVerified from "./pages/EmailVerified";
import PendingApproval from "./pages/PendingApproval";
import AdminApprovals from "./pages/AdminApprovals";

const queryClient = new QueryClient();

const App = () => {
  const [showSplash, setShowSplash] = useState(true);
  const [isAuthenticated, setIsAuthenticated] = useState<boolean | null>(null);
  const [isApproved, setIsApproved] = useState<boolean | null>(null);
  const [isAdmin, setIsAdmin] = useState(false);

  useEffect(() => {
    // Check initial auth state
    supabase.auth.getSession().then(({ data: { session } }) => {
      setIsAuthenticated(!!session);
      if (session?.user) {
        checkUserApprovalAndRole(session.user.id);
      } else {
        setIsApproved(null);
      }
    });

    // Listen for auth changes
    const { data: { subscription } } = supabase.auth.onAuthStateChange((event, session) => {
      setIsAuthenticated(!!session);
      if (session?.user) {
        // Defer to avoid deadlock
        setTimeout(() => {
          checkUserApprovalAndRole(session.user.id);
        }, 0);
      } else {
        setIsApproved(null);
        setIsAdmin(false);
      }
    });

    return () => subscription.unsubscribe();
  }, []);

  const checkUserApprovalAndRole = async (userId: string) => {
    try {
      // Check if user is approved
      const { data: approved } = await supabase
        .rpc('is_user_approved', { _user_id: userId });
      
      setIsApproved(approved ?? false);

      // Check if user is admin
      const { data: hasAdmin } = await supabase
        .rpc('has_role', { _user_id: userId, _role: 'admin' });
      
      setIsAdmin(hasAdmin ?? false);
    } catch (error) {
      console.error("Error checking user status:", error);
      setIsApproved(false);
      setIsAdmin(false);
    }
  };

  if (showSplash) {
    return <SplashScreen onFinish={() => setShowSplash(false)} />;
  }

  // Show loading while checking auth
  if (isAuthenticated === null || (isAuthenticated && isApproved === null)) {
    return (
      <div className="min-h-screen bg-background flex items-center justify-center">
        <div className="text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-primary mx-auto"></div>
          <p className="mt-4 text-muted-foreground">Cargando...</p>
        </div>
      </div>
    );
  }

  // Protected route wrapper that checks approval
  const ProtectedRoute = ({ children }: { children: React.ReactNode }) => {
    if (!isAuthenticated) {
      return <Navigate to="/auth" replace />;
    }
    if (!isApproved) {
      return <Navigate to="/pendiente-aprobacion" replace />;
    }
    return <>{children}</>;
  };

  return (
    <QueryClientProvider client={queryClient}>
      <TooltipProvider>
        <Toaster />
        <Sonner />
        <BrowserRouter>
          <Routes>
            <Route
              path="/"
              element={
                <ProtectedRoute>
                  <Index />
                </ProtectedRoute>
              }
            />
            <Route
              path="/auth"
              element={!isAuthenticated ? <Auth /> : <Navigate to="/" replace />}
            />
            <Route
              path="/email-verificado"
              element={<EmailVerified />}
            />
            <Route
              path="/pendiente-aprobacion"
              element={
                isAuthenticated && !isApproved 
                  ? <PendingApproval /> 
                  : <Navigate to="/" replace />
              }
            />
            <Route
              path="/admin/aprobaciones"
              element={
                isAuthenticated && isAdmin 
                  ? <AdminApprovals /> 
                  : <Navigate to="/" replace />
              }
            />
            <Route
              path="/recargos-mes-actual"
              element={
                <ProtectedRoute>
                  <CurrentMonthSurcharges />
                </ProtectedRoute>
              }
            />
            <Route
              path="/reportes"
              element={
                <ProtectedRoute>
                  <Reports />
                </ProtectedRoute>
              }
            />
            {/* ADD ALL CUSTOM ROUTES ABOVE THE CATCH-ALL "*" ROUTE */}
            <Route path="*" element={<NotFound />} />
          </Routes>
        </BrowserRouter>
      </TooltipProvider>
    </QueryClientProvider>
  );
};

export default App;
