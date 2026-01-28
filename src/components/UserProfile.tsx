import { useState, useEffect } from 'react';
import { supabase } from '@/integrations/supabase/client';
import { useNavigate } from 'react-router-dom';
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar';
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from '@/components/ui/dropdown-menu';
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { LogOut, User, Heart, Copy, Check } from 'lucide-react';
import { useToast } from '@/hooks/use-toast';
import ProfileSettings from './ProfileSettings';

interface Profile {
  full_name: string | null;
  email: string | null;
  avatar_url: string | null;
}

export default function UserProfile() {
  const navigate = useNavigate();
  const { toast } = useToast();
  const [profile, setProfile] = useState<Profile | null>(null);
  const [avatarUrl, setAvatarUrl] = useState<string | null>(null);
  const [loading, setLoading] = useState(true);
  const [showProfileSettings, setShowProfileSettings] = useState(false);
  const [showDonationDialog, setShowDonationDialog] = useState(false);
  const [copied, setCopied] = useState(false);

  useEffect(() => {
    loadProfile();
  }, []);

  const loadProfile = async () => {
    try {
      const { data: { user } } = await supabase.auth.getUser();
      
      if (!user) {
        navigate('/auth');
        return;
      }

      // Get avatar from user metadata (Google profile picture)
      const userGoogleAvatar = user.user_metadata?.avatar_url || user.user_metadata?.picture;

      // Load profile from database
      const { data: profileData } = await supabase
        .from('profiles')
        .select('full_name, email, avatar_url')
        .eq('id', user.id)
        .single();

      if (profileData) {
        setProfile(profileData);
        // Prefer custom avatar over Google avatar
        setAvatarUrl(profileData.avatar_url || userGoogleAvatar);
      } else {
        // Fallback to user metadata if profile not found
        setProfile({
          full_name: user.user_metadata?.full_name || user.user_metadata?.name || 'Usuario',
          email: user.email || null,
          avatar_url: null,
        });
        setAvatarUrl(userGoogleAvatar);
      }
    } catch (error) {
      console.error('Error loading profile:', error);
    } finally {
      setLoading(false);
    }
  };

  const handleLogout = async () => {
    try {
      await supabase.auth.signOut();
      toast({
        title: "Sesión cerrada",
        description: "Has cerrado sesión exitosamente",
      });
      navigate('/auth');
    } catch (error) {
      toast({
        title: "Error",
        description: "No se pudo cerrar la sesión",
        variant: "destructive",
      });
    }
  };

  const handleProfileSettingsClose = (open: boolean) => {
    setShowProfileSettings(open);
    if (!open) {
      // Reload profile when settings dialog closes
      loadProfile();
    }
  };

  const handleCopyKey = () => {
    navigator.clipboard.writeText('1151938848');
    setCopied(true);
    toast({
      title: "Llave copiada",
      description: "La llave Bre-B ha sido copiada al portapapeles",
    });
    setTimeout(() => setCopied(false), 2000);
  };

  if (loading) {
    return (
      <div className="flex items-center gap-3">
        <div className="text-right">
          <p className="text-base sm:text-lg font-semibold text-foreground">Bienvenido!</p>
        </div>
      </div>
    );
  }

  const displayName = profile?.full_name || 'Usuario';
  const initials = displayName
    .split(' ')
    .map((n) => n[0])
    .join('')
    .toUpperCase()
    .slice(0, 2);

  return (
    <>
      <DropdownMenu>
        <DropdownMenuTrigger asChild>
          <button className="flex items-center gap-3 hover:opacity-80 transition-opacity">
            <div className="text-right">
              <p className="text-base sm:text-lg font-semibold text-foreground">
                Bienvenido, {displayName}!
              </p>
            </div>
            <Avatar className="h-10 w-10 cursor-pointer ring-2 ring-primary/20 hover:ring-primary/40 transition-all">
              <AvatarImage src={avatarUrl || undefined} alt={displayName} />
              <AvatarFallback className="bg-gradient-primary text-primary-foreground">
                {initials}
              </AvatarFallback>
            </Avatar>
          </button>
        </DropdownMenuTrigger>
        <DropdownMenuContent align="end" className="w-56">
          <DropdownMenuItem 
            onClick={() => setShowProfileSettings(true)} 
            className="cursor-pointer"
          >
            <User className="mr-2 h-4 w-4" />
            <span>Ver Perfil</span>
          </DropdownMenuItem>
          <DropdownMenuItem 
            onClick={() => setShowDonationDialog(true)} 
            className="cursor-pointer text-pink-600 focus:text-pink-600"
          >
            <Heart className="mr-2 h-4 w-4" />
            <span>Agradecer con una donación</span>
          </DropdownMenuItem>
          <DropdownMenuSeparator />
          <DropdownMenuItem 
            onClick={handleLogout} 
            className="cursor-pointer text-destructive focus:text-destructive"
          >
            <LogOut className="mr-2 h-4 w-4" />
            <span>Cerrar Sesión</span>
          </DropdownMenuItem>
        </DropdownMenuContent>
      </DropdownMenu>

      <ProfileSettings 
        open={showProfileSettings} 
        onOpenChange={handleProfileSettingsClose} 
      />

      {/* Donation Dialog */}
      <Dialog open={showDonationDialog} onOpenChange={setShowDonationDialog}>
        <DialogContent className="sm:max-w-md">
          <DialogHeader>
            <DialogTitle className="flex items-center gap-2">
              <Heart className="h-5 w-5 text-pink-500" />
              Agradecer con una donación
            </DialogTitle>
            <DialogDescription>
              Si esta aplicación te ha sido útil, puedes apoyar su desarrollo con una donación voluntaria.
            </DialogDescription>
          </DialogHeader>
          <div className="space-y-4 py-4">
            <div className="flex flex-col items-center gap-4 p-6 bg-gradient-to-br from-pink-50 to-purple-50 dark:from-pink-950/30 dark:to-purple-950/30 rounded-xl border border-pink-200 dark:border-pink-800">
              <div className="w-16 h-16 rounded-full bg-gradient-to-br from-pink-500 to-purple-600 flex items-center justify-center shadow-lg">
                <Heart className="h-8 w-8 text-white" />
              </div>
              <div className="text-center">
                <p className="text-sm text-muted-foreground mb-1">Transferir a:</p>
                <p className="text-xl font-bold text-foreground">Andres Osorio</p>
              </div>
              <div className="flex items-center gap-2 px-4 py-2 bg-white dark:bg-gray-800 rounded-lg shadow-sm border">
                <img 
                  src="https://www.bancolombia.com/wcm/connect/www.bancolombia.com-26918/6c3a03de-0d3f-4a7f-a1c9-95f7df4ccf87/logo-bancolombia.png?MOD=AJPERES&CACHEID=ROOTWORKSPACE.Z18_K9HC1202P864E0Q30449MS3000-6c3a03de-0d3f-4a7f-a1c9-95f7df4ccf87-oLMM4a2" 
                  alt="Bancolombia" 
                  className="h-6 w-auto"
                  onError={(e) => {
                    e.currentTarget.style.display = 'none';
                  }}
                />
                <span className="text-sm font-semibold text-[#FDDA24]">Bre-B</span>
              </div>
              <Button 
                onClick={handleCopyKey}
                variant="outline"
                className="w-full max-w-xs"
              >
                {copied ? (
                  <>
                    <Check className="mr-2 h-4 w-4 text-green-500" />
                    ¡Llave copiada!
                  </>
                ) : (
                  <>
                    <Copy className="mr-2 h-4 w-4" />
                    Copiar llave Bre-B
                  </>
                )}
              </Button>
            </div>
            <p className="text-xs text-center text-muted-foreground">
              ¡Gracias por tu apoyo! Cualquier monto es bienvenido 💜
            </p>
          </div>
        </DialogContent>
      </Dialog>
    </>
  );
}
