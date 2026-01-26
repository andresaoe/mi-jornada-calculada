import { useState, useEffect, useRef } from 'react';
import { supabase } from '@/integrations/supabase/client';
import { useToast } from '@/hooks/use-toast';
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Dialog, DialogContent, DialogDescription, DialogFooter, DialogHeader, DialogTitle } from '@/components/ui/dialog';
import { RadioGroup, RadioGroupItem } from '@/components/ui/radio-group';
import { Camera, Loader2, Save, X } from 'lucide-react';

interface ProfileSettingsProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
}

interface ProfileData {
  id: string;
  full_name: string | null;
  email: string | null;
  base_salary: number;
  avatar_url: string | null;
  transport_allowance_enabled: boolean;
  transport_allowance_value: number;
}

export default function ProfileSettings({ open, onOpenChange }: ProfileSettingsProps) {
  const { toast } = useToast();
  const fileInputRef = useRef<HTMLInputElement>(null);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [uploading, setUploading] = useState(false);
  const [profile, setProfile] = useState<ProfileData | null>(null);
  const [originalBaseSalary, setOriginalBaseSalary] = useState<number>(0);
  const [showSalaryDialog, setShowSalaryDialog] = useState(false);
  const [salaryUpdateOption, setSalaryUpdateOption] = useState<'new_only' | 'all'>('new_only');

  // Form state
  const [fullName, setFullName] = useState('');
  const [email, setEmail] = useState('');
  const [originalEmail, setOriginalEmail] = useState('');
  const [baseSalary, setBaseSalary] = useState('');
  const [avatarUrl, setAvatarUrl] = useState<string | null>(null);
  const [googleAvatarUrl, setGoogleAvatarUrl] = useState<string | null>(null);
  const [showEmailDialog, setShowEmailDialog] = useState(false);
  const [emailUpdatePending, setEmailUpdatePending] = useState(false);

  useEffect(() => {
    if (open) {
      loadProfile();
    }
  }, [open]);

  const loadProfile = async () => {
    try {
      setLoading(true);
      const { data: { user } } = await supabase.auth.getUser();
      
      if (!user) return;

      // Get Google avatar from user metadata
      const userGoogleAvatar = user.user_metadata?.avatar_url || user.user_metadata?.picture;
      setGoogleAvatarUrl(userGoogleAvatar);

      const { data: profileData, error } = await supabase
        .from('profiles')
        .select('id, full_name, email, base_salary, avatar_url, transport_allowance_enabled, transport_allowance_value')
        .eq('id', user.id)
        .single();

      if (error) throw error;

      if (profileData) {
        setProfile(profileData);
        setFullName(profileData.full_name || '');
        setEmail(profileData.email || '');
        setOriginalEmail(profileData.email || '');
        setBaseSalary(profileData.base_salary.toString());
        setAvatarUrl(profileData.avatar_url);
        setOriginalBaseSalary(profileData.base_salary);
      }
    } catch (error) {
      console.error('Error loading profile:', error);
      toast({
        title: "Error",
        description: "No se pudo cargar el perfil",
        variant: "destructive",
      });
    } finally {
      setLoading(false);
    }
  };

  const handleAvatarClick = () => {
    fileInputRef.current?.click();
  };

  const handleFileChange = async (event: React.ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0];
    if (!file || !profile) return;

    try {
      setUploading(true);

      // Validate file type
      if (!file.type.startsWith('image/')) {
        throw new Error('El archivo debe ser una imagen');
      }

      // Validate file size (max 2MB)
      if (file.size > 2 * 1024 * 1024) {
        throw new Error('La imagen no debe superar los 2MB');
      }

      const fileExt = file.name.split('.').pop();
      const fileName = `${profile.id}/avatar.${fileExt}`;

      // Upload to storage
      const { error: uploadError } = await supabase.storage
        .from('avatars')
        .upload(fileName, file, { upsert: true });

      if (uploadError) throw uploadError;

      // Get public URL
      const { data: { publicUrl } } = supabase.storage
        .from('avatars')
        .getPublicUrl(fileName);

      // Add timestamp to bust cache
      const urlWithTimestamp = `${publicUrl}?t=${Date.now()}`;
      setAvatarUrl(urlWithTimestamp);

      toast({
        title: "Foto actualizada",
        description: "Tu foto de perfil se ha actualizado correctamente",
      });
    } catch (error: any) {
      console.error('Error uploading avatar:', error);
      toast({
        title: "Error",
        description: error.message || "No se pudo subir la imagen",
        variant: "destructive",
      });
    } finally {
      setUploading(false);
      if (fileInputRef.current) {
        fileInputRef.current.value = '';
      }
    }
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    
    const newBaseSalary = parseFloat(baseSalary);
    const emailChanged = email.trim().toLowerCase() !== originalEmail.toLowerCase();
    
    // Check if email changed - show confirmation dialog
    if (emailChanged) {
      setShowEmailDialog(true);
      return;
    }
    
    // Check if base salary changed
    if (newBaseSalary !== originalBaseSalary) {
      setShowSalaryDialog(true);
      return;
    }

    await saveProfile(false, false);
  };

  const handleEmailDialogConfirm = async () => {
    setShowEmailDialog(false);
    
    try {
      setEmailUpdatePending(true);
      setSaving(true);

      // Update email via Supabase Auth
      const { error: authError } = await supabase.auth.updateUser({
        email: email.trim(),
      });

      if (authError) {
        throw authError;
      }

      toast({
        title: "Verificación enviada",
        description: "Se ha enviado un correo de verificación a tu nueva dirección. Revisa tu bandeja de entrada.",
      });

      // Continue to check if salary also needs to be saved
      const newBaseSalary = parseFloat(baseSalary);
      if (newBaseSalary !== originalBaseSalary) {
        setShowSalaryDialog(true);
      } else {
        await saveProfile(false, true);
      }
    } catch (error: any) {
      console.error('Error updating email:', error);
      toast({
        title: "Error",
        description: error.message || "No se pudo actualizar el correo",
        variant: "destructive",
      });
      setSaving(false);
      setEmailUpdatePending(false);
    }
  };

  const handleSalaryDialogConfirm = async () => {
    setShowSalaryDialog(false);
    await saveProfile(salaryUpdateOption === 'all', emailUpdatePending);
  };

  const saveProfile = async (updateExistingCalculations: boolean, skipEmailUpdate: boolean = false) => {
    if (!profile) return;

    try {
      setSaving(true);

      const newBaseSalary = parseFloat(baseSalary);

      // Update profile
      const { error: profileError } = await supabase
        .from('profiles')
        .update({
          full_name: fullName.trim(),
          base_salary: newBaseSalary,
          avatar_url: avatarUrl,
        })
        .eq('id', profile.id);

      if (profileError) throw profileError;

      // If user wants to update existing calculations
      if (updateExistingCalculations && newBaseSalary !== originalBaseSalary) {
        const { error: calcError } = await supabase
          .from('payroll_calculations')
          .update({ base_salary: newBaseSalary })
          .eq('user_id', profile.id);

        if (calcError) throw calcError;
      }

      toast({
        title: "Perfil actualizado",
        description: updateExistingCalculations 
          ? "Tu perfil y todos los cálculos existentes han sido actualizados" 
          : emailUpdatePending
            ? "Tu perfil ha sido actualizado. Revisa tu correo para verificar el cambio de email."
            : "Tu perfil ha sido actualizado correctamente",
      });

      setOriginalBaseSalary(newBaseSalary);
      setEmailUpdatePending(false);
      onOpenChange(false);
    } catch (error: any) {
      console.error('Error saving profile:', error);
      toast({
        title: "Error",
        description: error.message || "No se pudo guardar el perfil",
        variant: "destructive",
      });
    } finally {
      setSaving(false);
      setEmailUpdatePending(false);
    }
  };

  const displayAvatarUrl = avatarUrl || googleAvatarUrl;
  const initials = fullName
    .split(' ')
    .map((n) => n[0])
    .join('')
    .toUpperCase()
    .slice(0, 2) || 'U';

  return (
    <>
      <Dialog open={open} onOpenChange={onOpenChange}>
        <DialogContent className="sm:max-w-md">
          <DialogHeader>
            <DialogTitle>Mi Perfil</DialogTitle>
            <DialogDescription>
              Actualiza tu información personal y configuración
            </DialogDescription>
          </DialogHeader>

          {loading ? (
            <div className="flex items-center justify-center py-8">
              <Loader2 className="h-8 w-8 animate-spin text-primary" />
            </div>
          ) : (
            <form onSubmit={handleSubmit} className="space-y-6">
              {/* Avatar Section */}
              <div className="flex flex-col items-center gap-4">
                <div className="relative">
                  <Avatar className="h-24 w-24 cursor-pointer ring-2 ring-primary/20 hover:ring-primary/40 transition-all">
                    <AvatarImage src={displayAvatarUrl || undefined} alt={fullName} />
                    <AvatarFallback className="bg-gradient-primary text-primary-foreground text-2xl">
                      {initials}
                    </AvatarFallback>
                  </Avatar>
                  <button
                    type="button"
                    onClick={handleAvatarClick}
                    disabled={uploading}
                    className="absolute bottom-0 right-0 p-2 bg-primary text-primary-foreground rounded-full shadow-lg hover:bg-primary/90 transition-colors disabled:opacity-50"
                  >
                    {uploading ? (
                      <Loader2 className="h-4 w-4 animate-spin" />
                    ) : (
                      <Camera className="h-4 w-4" />
                    )}
                  </button>
                </div>
                <input
                  ref={fileInputRef}
                  type="file"
                  accept="image/*"
                  onChange={handleFileChange}
                  className="hidden"
                />
                <p className="text-xs text-muted-foreground">
                  Haz clic en el icono de cámara para cambiar tu foto
                </p>
              </div>

              {/* Form Fields */}
              <div className="space-y-4">
                <div className="space-y-2">
                  <Label htmlFor="email">Correo electrónico</Label>
                  <Input
                    id="email"
                    type="email"
                    value={email}
                    onChange={(e) => setEmail(e.target.value)}
                  />
                  {email.trim().toLowerCase() !== originalEmail.toLowerCase() && (
                    <p className="text-xs text-amber-600">
                      ⚠️ Cambiar el correo requiere verificación
                    </p>
                  )}
                </div>

                <div className="space-y-2">
                  <Label htmlFor="fullName">Nombre completo</Label>
                  <Input
                    id="fullName"
                    type="text"
                    value={fullName}
                    onChange={(e) => setFullName(e.target.value)}
                    placeholder="Tu nombre completo"
                    required
                  />
                </div>

                <div className="space-y-2">
                  <Label htmlFor="baseSalary">Salario base mensual</Label>
                  <Input
                    id="baseSalary"
                    type="number"
                    value={baseSalary}
                    onChange={(e) => setBaseSalary(e.target.value)}
                    placeholder="2416500"
                    min="0"
                    step="1"
                    required
                  />
                  <p className="text-xs text-muted-foreground">
                    Este valor se usará para calcular tus recargos y prestaciones
                  </p>
                </div>
              </div>

              <DialogFooter className="gap-2 sm:gap-0">
                <Button
                  type="button"
                  variant="outline"
                  onClick={() => onOpenChange(false)}
                  disabled={saving}
                >
                  <X className="mr-2 h-4 w-4" />
                  Cancelar
                </Button>
                <Button type="submit" disabled={saving}>
                  {saving ? (
                    <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                  ) : (
                    <Save className="mr-2 h-4 w-4" />
                  )}
                  Guardar cambios
                </Button>
              </DialogFooter>
            </form>
          )}
        </DialogContent>
      </Dialog>

      {/* Salary Update Confirmation Dialog */}
      <Dialog open={showSalaryDialog} onOpenChange={setShowSalaryDialog}>
        <DialogContent className="sm:max-w-md">
          <DialogHeader>
            <DialogTitle>Actualizar salario base</DialogTitle>
            <DialogDescription>
              Has modificado tu salario base. ¿Cómo deseas aplicar este cambio?
            </DialogDescription>
          </DialogHeader>

          <RadioGroup
            value={salaryUpdateOption}
            onValueChange={(value) => setSalaryUpdateOption(value as 'new_only' | 'all')}
            className="space-y-4"
          >
            <div className="flex items-start space-x-3 p-4 rounded-lg border border-border hover:bg-accent/50 transition-colors">
              <RadioGroupItem value="new_only" id="new_only" className="mt-1" />
              <div className="space-y-1">
                <Label htmlFor="new_only" className="font-medium cursor-pointer">
                  Solo para nuevos registros
                </Label>
                <p className="text-sm text-muted-foreground">
                  El nuevo salario base se aplicará únicamente a los cálculos que realices a partir de ahora
                </p>
              </div>
            </div>

            <div className="flex items-start space-x-3 p-4 rounded-lg border border-border hover:bg-accent/50 transition-colors">
              <RadioGroupItem value="all" id="all" className="mt-1" />
              <div className="space-y-1">
                <Label htmlFor="all" className="font-medium cursor-pointer">
                  Aplicar a toda la información existente
                </Label>
                <p className="text-sm text-muted-foreground">
                  Todos los cálculos de nómina anteriores se recalcularán con el nuevo salario base
                </p>
              </div>
            </div>
          </RadioGroup>

          <DialogFooter className="gap-2 sm:gap-0">
            <Button
              type="button"
              variant="outline"
              onClick={() => setShowSalaryDialog(false)}
            >
              Cancelar
            </Button>
            <Button onClick={handleSalaryDialogConfirm}>
              Confirmar y guardar
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* Email Change Confirmation Dialog */}
      <Dialog open={showEmailDialog} onOpenChange={setShowEmailDialog}>
        <DialogContent className="sm:max-w-md">
          <DialogHeader>
            <DialogTitle>Cambiar correo electrónico</DialogTitle>
            <DialogDescription>
              Estás a punto de cambiar tu correo de <strong>{originalEmail}</strong> a <strong>{email}</strong>.
              Se enviará un correo de verificación a la nueva dirección.
            </DialogDescription>
          </DialogHeader>

          <div className="p-4 rounded-lg bg-amber-50 border border-amber-200 dark:bg-amber-900/20 dark:border-amber-800">
            <p className="text-sm text-amber-800 dark:text-amber-200">
              <strong>Importante:</strong> Hasta que no verifiques el nuevo correo, seguirás usando el actual para iniciar sesión.
            </p>
          </div>

          <DialogFooter className="gap-2 sm:gap-0">
            <Button
              type="button"
              variant="outline"
              onClick={() => setShowEmailDialog(false)}
            >
              Cancelar
            </Button>
            <Button onClick={handleEmailDialogConfirm}>
              Enviar verificación
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </>
  );
}
