import { useState } from "react";
import { supabase } from "@/integrations/supabase/client";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { useToast } from "@/hooks/use-toast";
import { AlertCircle, CreditCard, Smartphone, LogOut } from "lucide-react";

const AccountInactive = () => {
  const { toast } = useToast();
  const [processingPayment, setProcessingPayment] = useState<string | null>(null);

  const handleNequiPayment = async () => {
    setProcessingPayment("nequi");
    
    // Simular proceso de pago - En producción integrar con pasarela de pagos
    toast({
      title: "Pago con Nequi",
      description: "Redirigiendo a Nequi para completar el pago de $5.000 COP...",
    });

    // Aquí iría la integración real con Nequi
    setTimeout(() => {
      toast({
        title: "Información",
        description: "Para completar el pago, transfiere $5.000 COP al número Nequi: 300-XXX-XXXX y envía el comprobante al administrador.",
      });
      setProcessingPayment(null);
    }, 2000);
  };

  const handleCardPayment = async () => {
    setProcessingPayment("card");
    
    toast({
      title: "Pago con Tarjeta",
      description: "Iniciando proceso de pago...",
    });

    // Aquí iría la integración con Stripe u otra pasarela
    setTimeout(() => {
      toast({
        title: "Próximamente",
        description: "El pago con tarjeta estará disponible pronto. Por favor usa Nequi o contacta al administrador.",
      });
      setProcessingPayment(null);
    }, 2000);
  };

  const handleLogout = async () => {
    await supabase.auth.signOut();
  };

  const formatCurrency = (value: number) => {
    return new Intl.NumberFormat("es-CO", {
      style: "currency",
      currency: "COP",
      minimumFractionDigits: 0
    }).format(value);
  };

  return (
    <div className="min-h-screen bg-background flex items-center justify-center p-4">
      <Card className="max-w-md w-full">
        <CardHeader className="text-center">
          <div className="mx-auto mb-4 p-3 rounded-full bg-destructive/10">
            <AlertCircle className="h-12 w-12 text-destructive" />
          </div>
          <CardTitle className="text-2xl text-destructive">
            Cuenta Desactivada
          </CardTitle>
          <CardDescription className="text-base mt-2">
            Tu cuenta ha sido desactivada por el administrador.
          </CardDescription>
        </CardHeader>
        <CardContent className="space-y-6">
          <div className="text-center space-y-2">
            <p className="text-muted-foreground">
              Para reactivar tu cuenta y continuar usando nuestros servicios, 
              debes realizar un pago de:
            </p>
            <p className="text-4xl font-bold text-primary">
              {formatCurrency(5000)}
            </p>
            <p className="text-sm text-muted-foreground">
              (Cinco mil pesos colombianos)
            </p>
          </div>

          <div className="space-y-3">
            <Button
              className="w-full h-14 text-lg bg-[#E31C5E] hover:bg-[#C41850]"
              onClick={handleNequiPayment}
              disabled={processingPayment !== null}
            >
              <Smartphone className="h-6 w-6 mr-3" />
              {processingPayment === "nequi" ? "Procesando..." : "Pagar con Nequi"}
            </Button>

            <Button
              className="w-full h-14 text-lg"
              variant="outline"
              onClick={handleCardPayment}
              disabled={processingPayment !== null}
            >
              <CreditCard className="h-6 w-6 mr-3" />
              {processingPayment === "card" ? "Procesando..." : "Pagar con Tarjeta"}
            </Button>
          </div>

          <div className="pt-4 border-t">
            <p className="text-sm text-muted-foreground text-center mb-4">
              Una vez realizado el pago, un administrador verificará tu transacción 
              y reactivará tu cuenta en las próximas 24 horas.
            </p>
            <Button
              variant="ghost"
              className="w-full text-muted-foreground"
              onClick={handleLogout}
            >
              <LogOut className="h-4 w-4 mr-2" />
              Cerrar Sesión
            </Button>
          </div>
        </CardContent>
      </Card>
    </div>
  );
};

export default AccountInactive;
