import { CheckCircle, Mail } from "lucide-react";
import { Card, CardContent } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { useNavigate } from "react-router-dom";

const EmailVerified = () => {
  const navigate = useNavigate();

  return (
    <div className="min-h-screen bg-gradient-to-br from-background via-background to-primary/5 flex items-center justify-center p-4">
      <Card className="max-w-lg w-full shadow-xl border-primary/20">
        <CardContent className="pt-8 pb-8 text-center space-y-6">
          <div className="flex justify-center">
            <div className="bg-green-100 dark:bg-green-900/30 p-4 rounded-full">
              <CheckCircle className="h-16 w-16 text-green-600 dark:text-green-400" />
            </div>
          </div>
          
          <div className="space-y-4">
            <h1 className="text-2xl font-bold text-foreground">
              ¡Correo verificado!
            </h1>
            
            <p className="text-muted-foreground leading-relaxed">
              Muchas gracias por registrarse en nuestra plataforma, sabemos que quieres tener control de tu <span className="font-semibold text-primary">Nómina</span> y por ello estamos trabajando cada día para darte las mejores herramientas y soluciones tecnológicas para que lleves el control de tu dinero.
            </p>
            
            <div className="bg-amber-50 dark:bg-amber-900/20 border border-amber-200 dark:border-amber-800 rounded-lg p-4 mt-4">
              <div className="flex items-center gap-2 text-amber-700 dark:text-amber-400">
                <Mail className="h-5 w-5 flex-shrink-0" />
                <p className="text-sm font-medium">
                  En un momento un administrador aprobará tu registro.
                </p>
              </div>
            </div>
          </div>

          <Button 
            onClick={() => navigate("/auth")} 
            variant="outline"
            className="mt-4"
          >
            Volver al inicio de sesión
          </Button>
        </CardContent>
      </Card>
    </div>
  );
};

export default EmailVerified;
