import { Clock, LogOut } from "lucide-react";
import { Card, CardContent } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { supabase } from "@/integrations/supabase/client";
import { useNavigate } from "react-router-dom";

const PendingApproval = () => {
  const navigate = useNavigate();

  const handleLogout = async () => {
    await supabase.auth.signOut();
    navigate("/auth");
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-background via-background to-primary/5 flex items-center justify-center p-4">
      <Card className="max-w-lg w-full shadow-xl border-primary/20">
        <CardContent className="pt-8 pb-8 text-center space-y-6">
          <div className="flex justify-center">
            <div className="bg-amber-100 dark:bg-amber-900/30 p-4 rounded-full">
              <Clock className="h-16 w-16 text-amber-600 dark:text-amber-400" />
            </div>
          </div>
          
          <div className="space-y-4">
            <h1 className="text-2xl font-bold text-foreground">
              Registro pendiente de aprobación
            </h1>
            
            <p className="text-muted-foreground leading-relaxed">
              Tu cuenta ha sido creada y verificada exitosamente. Un administrador revisará tu solicitud y te dará acceso a la plataforma muy pronto.
            </p>
            
            <div className="bg-blue-50 dark:bg-blue-900/20 border border-blue-200 dark:border-blue-800 rounded-lg p-4 mt-4">
              <p className="text-sm text-blue-700 dark:text-blue-400">
                Recibirás una notificación cuando tu cuenta sea aprobada.
              </p>
            </div>
          </div>

          <Button 
            onClick={handleLogout} 
            variant="outline"
            className="mt-4 gap-2"
          >
            <LogOut className="h-4 w-4" />
            Cerrar sesión
          </Button>
        </CardContent>
      </Card>
    </div>
  );
};

export default PendingApproval;
