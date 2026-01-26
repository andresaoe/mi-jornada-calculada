import { useState, useEffect } from "react";
import { useNavigate } from "react-router-dom";
import { supabase } from "@/integrations/supabase/client";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { Badge } from "@/components/ui/badge";
import { Dialog, DialogContent, DialogDescription, DialogFooter, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Switch } from "@/components/ui/switch";
import { useToast } from "@/hooks/use-toast";
import { ArrowLeft, Check, X, UserCog, Pencil, Trash2, Power, PowerOff, UserPlus, Loader2, Eye, EyeOff } from "lucide-react";
import AdminNotifications from "@/components/AdminNotifications";

interface UserProfile {
  id: string;
  email: string | null;
  full_name: string | null;
  approved: boolean;
  active: boolean;
  base_salary: number;
  transport_allowance_enabled: boolean;
  transport_allowance_value: number;
  created_at: string;
}

const AdminApprovals = () => {
  const navigate = useNavigate();
  const { toast } = useToast();
  const [users, setUsers] = useState<UserProfile[]>([]);
  const [pendingUsers, setPendingUsers] = useState<UserProfile[]>([]);
  const [loading, setLoading] = useState(true);
  const [selectedUser, setSelectedUser] = useState<UserProfile | null>(null);
  const [editDialogOpen, setEditDialogOpen] = useState(false);
  const [deleteDialogOpen, setDeleteDialogOpen] = useState(false);
  const [createDialogOpen, setCreateDialogOpen] = useState(false);
  const [creatingUser, setCreatingUser] = useState(false);
  const [showPassword, setShowPassword] = useState(false);
  const [createForm, setCreateForm] = useState({
    full_name: "",
    email: "",
    password: "",
    base_salary: 2416500,
    active: true,
  });
  const [editForm, setEditForm] = useState({
    full_name: "",
    email: "",
    base_salary: 0,
    active: true,
    transport_allowance_enabled: true,
    transport_allowance_value: 200000
  });

  useEffect(() => {
    fetchUsers();
  }, []);

  const fetchUsers = async () => {
    setLoading(true);
    try {
      const { data, error } = await supabase
        .from("profiles")
        .select("*")
        .order("created_at", { ascending: false });

      if (error) throw error;

      const allUsers = (data || []) as UserProfile[];
      setPendingUsers(allUsers.filter(u => !u.approved));
      setUsers(allUsers.filter(u => u.approved));
    } catch (error) {
      console.error("Error fetching users:", error);
      toast({
        title: "Error",
        description: "No se pudieron cargar los usuarios",
        variant: "destructive"
      });
    } finally {
      setLoading(false);
    }
  };

  const handleApprove = async (userId: string) => {
    try {
      const { error } = await supabase
        .from("profiles")
        .update({ approved: true, active: true })
        .eq("id", userId);

      if (error) throw error;

      toast({
        title: "Usuario aprobado",
        description: "El usuario ahora puede acceder a la plataforma"
      });
      fetchUsers();
    } catch (error) {
      console.error("Error approving user:", error);
      toast({
        title: "Error",
        description: "No se pudo aprobar el usuario",
        variant: "destructive"
      });
    }
  };

  const handleReject = async (userId: string) => {
    try {
      const { error } = await supabase
        .from("profiles")
        .delete()
        .eq("id", userId);

      if (error) throw error;

      toast({
        title: "Usuario rechazado",
        description: "La solicitud ha sido eliminada"
      });
      fetchUsers();
    } catch (error) {
      console.error("Error rejecting user:", error);
      toast({
        title: "Error",
        description: "No se pudo rechazar el usuario",
        variant: "destructive"
      });
    }
  };

  const handleToggleActive = async (user: UserProfile) => {
    try {
      const { error } = await supabase
        .from("profiles")
        .update({ active: !user.active })
        .eq("id", user.id);

      if (error) throw error;

      toast({
        title: user.active ? "Usuario desactivado" : "Usuario activado",
        description: user.active 
          ? "El usuario deberá pagar para reactivar su cuenta" 
          : "El usuario puede acceder normalmente"
      });
      fetchUsers();
    } catch (error) {
      console.error("Error toggling user status:", error);
      toast({
        title: "Error",
        description: "No se pudo cambiar el estado del usuario",
        variant: "destructive"
      });
    }
  };

  const openEditDialog = (user: UserProfile) => {
    setSelectedUser(user);
    setEditForm({
      full_name: user.full_name || "",
      email: user.email || "",
      base_salary: user.base_salary,
      active: user.active,
      transport_allowance_enabled: user.transport_allowance_enabled,
      transport_allowance_value: user.transport_allowance_value
    });
    setEditDialogOpen(true);
  };

  const handleCreateUser = async () => {
    if (!createForm.email || !createForm.password || !createForm.full_name) {
      toast({
        title: "Error",
        description: "Todos los campos son obligatorios",
        variant: "destructive"
      });
      return;
    }

    if (createForm.password.length < 6) {
      toast({
        title: "Error",
        description: "La contraseña debe tener mínimo 6 caracteres",
        variant: "destructive"
      });
      return;
    }

    try {
      setCreatingUser(true);

      const { data: { session } } = await supabase.auth.getSession();
      if (!session) {
        toast({
          title: "Error",
          description: "Sesión no válida",
          variant: "destructive"
        });
        return;
      }

      const response = await supabase.functions.invoke("admin-create-user", {
        body: {
          email: createForm.email.trim(),
          password: createForm.password,
          full_name: createForm.full_name.trim(),
          base_salary: createForm.base_salary,
          active: createForm.active,
        },
      });

      if (response.error) {
        throw new Error(response.error.message || "Error al crear usuario");
      }

      if (response.data?.error) {
        throw new Error(response.data.error);
      }

      toast({
        title: "Usuario creado",
        description: `El usuario ${createForm.email} ha sido creado exitosamente`
      });

      setCreateDialogOpen(false);
      setCreateForm({
        full_name: "",
        email: "",
        password: "",
        base_salary: 2416500,
        active: true,
      });
      fetchUsers();
    } catch (error: any) {
      console.error("Error creating user:", error);
      toast({
        title: "Error",
        description: error.message || "No se pudo crear el usuario",
        variant: "destructive"
      });
    } finally {
      setCreatingUser(false);
    }
  };

  const handleEditSubmit = async () => {
    if (!selectedUser) return;

    try {
      const { error } = await supabase
        .from("profiles")
        .update({
          full_name: editForm.full_name,
          base_salary: editForm.base_salary,
          active: editForm.active,
          transport_allowance_enabled: editForm.transport_allowance_enabled,
          transport_allowance_value: editForm.transport_allowance_value
        })
        .eq("id", selectedUser.id);

      if (error) throw error;

      toast({
        title: "Usuario actualizado",
        description: "Los cambios han sido guardados"
      });
      setEditDialogOpen(false);
      fetchUsers();
    } catch (error) {
      console.error("Error updating user:", error);
      toast({
        title: "Error",
        description: "No se pudo actualizar el usuario",
        variant: "destructive"
      });
    }
  };

  const handleDelete = async () => {
    if (!selectedUser) return;

    try {
      const { error } = await supabase
        .from("profiles")
        .delete()
        .eq("id", selectedUser.id);

      if (error) throw error;

      toast({
        title: "Usuario eliminado",
        description: "El usuario ha sido eliminado del sistema"
      });
      setDeleteDialogOpen(false);
      fetchUsers();
    } catch (error) {
      console.error("Error deleting user:", error);
      toast({
        title: "Error",
        description: "No se pudo eliminar el usuario",
        variant: "destructive"
      });
    }
  };

  const formatCurrency = (value: number) => {
    return new Intl.NumberFormat("es-CO", {
      style: "currency",
      currency: "COP",
      minimumFractionDigits: 0
    }).format(value);
  };

  const formatDate = (dateString: string) => {
    return new Date(dateString).toLocaleDateString("es-CO", {
      year: "numeric",
      month: "short",
      day: "numeric"
    });
  };

  return (
    <div className="min-h-screen bg-background p-4">
      <div className="max-w-7xl mx-auto space-y-6">
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-4">
            <Button variant="ghost" size="icon" onClick={() => navigate("/")}>
              <ArrowLeft className="h-5 w-5" />
            </Button>
            <div>
              <h1 className="text-2xl font-bold text-foreground flex items-center gap-2">
                <UserCog className="h-6 w-6" />
                Panel de Administración
              </h1>
              <p className="text-muted-foreground">Gestiona usuarios y aprobaciones</p>
            </div>
          </div>
          <AdminNotifications />
        </div>

        {/* Pending Approvals */}
        {pendingUsers.length > 0 && (
          <Card className="border-yellow-500/50 bg-yellow-500/5">
            <CardHeader>
              <CardTitle className="text-yellow-600">Solicitudes Pendientes</CardTitle>
              <CardDescription>
                {pendingUsers.length} usuario(s) esperando aprobación
              </CardDescription>
            </CardHeader>
            <CardContent>
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead>Email</TableHead>
                    <TableHead>Nombre</TableHead>
                    <TableHead>Fecha Registro</TableHead>
                    <TableHead className="text-right">Acciones</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {pendingUsers.map((user) => (
                    <TableRow key={user.id}>
                      <TableCell className="font-medium">{user.email}</TableCell>
                      <TableCell>{user.full_name || "Sin nombre"}</TableCell>
                      <TableCell>{formatDate(user.created_at)}</TableCell>
                      <TableCell className="text-right space-x-2">
                        <Button
                          size="sm"
                          onClick={() => handleApprove(user.id)}
                          className="bg-green-600 hover:bg-green-700"
                        >
                          <Check className="h-4 w-4 mr-1" />
                          Aprobar
                        </Button>
                        <Button
                          size="sm"
                          variant="destructive"
                          onClick={() => handleReject(user.id)}
                        >
                          <X className="h-4 w-4 mr-1" />
                          Rechazar
                        </Button>
                      </TableCell>
                    </TableRow>
                  ))}
                </TableBody>
              </Table>
            </CardContent>
          </Card>
        )}

        {/* All Users */}
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-4">
            <div>
              <CardTitle>Usuarios Registrados</CardTitle>
              <CardDescription>
                {users.length} usuario(s) aprobados en el sistema
              </CardDescription>
            </div>
            <Button onClick={() => setCreateDialogOpen(true)} className="gap-2">
              <UserPlus className="h-4 w-4" />
              Crear Usuario
            </Button>
          </CardHeader>
          <CardContent>
            {loading ? (
              <div className="flex justify-center py-8">
                <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary"></div>
              </div>
            ) : users.length === 0 ? (
              <p className="text-center text-muted-foreground py-8">
                No hay usuarios registrados
              </p>
            ) : (
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead>Email</TableHead>
                    <TableHead>Nombre</TableHead>
                    <TableHead>Salario Base</TableHead>
                    <TableHead>Estado</TableHead>
                    <TableHead>Registro</TableHead>
                    <TableHead className="text-right">Acciones</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {users.map((user) => (
                    <TableRow key={user.id}>
                      <TableCell className="font-medium">{user.email}</TableCell>
                      <TableCell>{user.full_name || "Sin nombre"}</TableCell>
                      <TableCell>{formatCurrency(user.base_salary)}</TableCell>
                      <TableCell>
                        <Badge variant={user.active ? "default" : "destructive"}>
                          {user.active ? "Activo" : "Inactivo"}
                        </Badge>
                      </TableCell>
                      <TableCell>{formatDate(user.created_at)}</TableCell>
                      <TableCell className="text-right space-x-1">
                        <Button
                          size="icon"
                          variant="ghost"
                          onClick={() => handleToggleActive(user)}
                          title={user.active ? "Desactivar" : "Activar"}
                        >
                          {user.active ? (
                            <PowerOff className="h-4 w-4 text-destructive" />
                          ) : (
                            <Power className="h-4 w-4 text-green-600" />
                          )}
                        </Button>
                        <Button
                          size="icon"
                          variant="ghost"
                          onClick={() => openEditDialog(user)}
                          title="Editar"
                        >
                          <Pencil className="h-4 w-4" />
                        </Button>
                        <Button
                          size="icon"
                          variant="ghost"
                          onClick={() => {
                            setSelectedUser(user);
                            setDeleteDialogOpen(true);
                          }}
                          title="Eliminar"
                        >
                          <Trash2 className="h-4 w-4 text-destructive" />
                        </Button>
                      </TableCell>
                    </TableRow>
                  ))}
                </TableBody>
              </Table>
            )}
          </CardContent>
        </Card>
      </div>

      {/* Create User Dialog */}
      <Dialog open={createDialogOpen} onOpenChange={setCreateDialogOpen}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Crear Nuevo Usuario</DialogTitle>
            <DialogDescription>
              Ingresa los datos del nuevo usuario. Se le asignará acceso inmediato.
            </DialogDescription>
          </DialogHeader>
          <div className="space-y-4">
            <div>
              <Label htmlFor="create_full_name">Nombre Completo *</Label>
              <Input
                id="create_full_name"
                value={createForm.full_name}
                onChange={(e) => setCreateForm({ ...createForm, full_name: e.target.value })}
                placeholder="Juan Pérez"
              />
            </div>
            <div>
              <Label htmlFor="create_email">Correo Electrónico *</Label>
              <Input
                id="create_email"
                type="email"
                value={createForm.email}
                onChange={(e) => setCreateForm({ ...createForm, email: e.target.value })}
                placeholder="usuario@ejemplo.com"
              />
            </div>
            <div>
              <Label htmlFor="create_password">Contraseña *</Label>
              <div className="relative">
                <Input
                  id="create_password"
                  type={showPassword ? "text" : "password"}
                  value={createForm.password}
                  onChange={(e) => setCreateForm({ ...createForm, password: e.target.value })}
                  placeholder="Mínimo 6 caracteres"
                  className="pr-10"
                />
                <button
                  type="button"
                  onClick={() => setShowPassword(!showPassword)}
                  className="absolute right-3 top-1/2 -translate-y-1/2 text-muted-foreground hover:text-foreground"
                >
                  {showPassword ? <EyeOff className="h-4 w-4" /> : <Eye className="h-4 w-4" />}
                </button>
              </div>
            </div>
            <div>
              <Label htmlFor="create_base_salary">Salario Base</Label>
              <Input
                id="create_base_salary"
                type="number"
                value={createForm.base_salary}
                onChange={(e) => setCreateForm({ ...createForm, base_salary: Number(e.target.value) })}
              />
            </div>
            <div className="flex items-center justify-between">
              <Label htmlFor="create_active">Estado Activo</Label>
              <Switch
                id="create_active"
                checked={createForm.active}
                onCheckedChange={(checked) => setCreateForm({ ...createForm, active: checked })}
              />
            </div>
          </div>
          <DialogFooter>
            <Button variant="outline" onClick={() => setCreateDialogOpen(false)} disabled={creatingUser}>
              Cancelar
            </Button>
            <Button onClick={handleCreateUser} disabled={creatingUser}>
              {creatingUser ? (
                <>
                  <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                  Creando...
                </>
              ) : (
                "Crear Usuario"
              )}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* Edit Dialog */}
      <Dialog open={editDialogOpen} onOpenChange={setEditDialogOpen}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Editar Usuario</DialogTitle>
            <DialogDescription>
              {selectedUser?.email}
            </DialogDescription>
          </DialogHeader>
          <div className="space-y-4">
            <div>
              <Label htmlFor="full_name">Nombre Completo</Label>
              <Input
                id="full_name"
                value={editForm.full_name}
                onChange={(e) => setEditForm({ ...editForm, full_name: e.target.value })}
              />
            </div>
            <div>
              <Label htmlFor="edit_email">Correo Electrónico</Label>
              <Input
                id="edit_email"
                type="email"
                value={editForm.email}
                disabled
                className="bg-muted"
              />
              <p className="text-xs text-muted-foreground mt-1">
                El email solo puede ser cambiado por el usuario desde su perfil
              </p>
            </div>
            <div>
              <Label htmlFor="base_salary">Salario Base</Label>
              <Input
                id="base_salary"
                type="number"
                value={editForm.base_salary}
                onChange={(e) => setEditForm({ ...editForm, base_salary: Number(e.target.value) })}
              />
            </div>
            <div className="flex items-center justify-between">
              <Label htmlFor="edit_active">Estado Activo</Label>
              <Switch
                id="edit_active"
                checked={editForm.active}
                onCheckedChange={(checked) => setEditForm({ ...editForm, active: checked })}
              />
            </div>
            <div className="flex items-center justify-between">
              <Label htmlFor="transport">Auxilio de Transporte</Label>
              <Switch
                id="transport"
                checked={editForm.transport_allowance_enabled}
                onCheckedChange={(checked) => setEditForm({ ...editForm, transport_allowance_enabled: checked })}
              />
            </div>
            {editForm.transport_allowance_enabled && (
              <div>
                <Label htmlFor="transport_value">Valor Auxilio</Label>
                <Input
                  id="transport_value"
                  type="number"
                  value={editForm.transport_allowance_value}
                  onChange={(e) => setEditForm({ ...editForm, transport_allowance_value: Number(e.target.value) })}
                />
              </div>
            )}
          </div>
          <DialogFooter>
            <Button variant="outline" onClick={() => setEditDialogOpen(false)}>
              Cancelar
            </Button>
            <Button onClick={handleEditSubmit}>
              Guardar Cambios
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* Delete Confirmation Dialog */}
      <Dialog open={deleteDialogOpen} onOpenChange={setDeleteDialogOpen}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Eliminar Usuario</DialogTitle>
            <DialogDescription>
              ¿Estás seguro de que deseas eliminar a {selectedUser?.email}? Esta acción no se puede deshacer.
            </DialogDescription>
          </DialogHeader>
          <DialogFooter>
            <Button variant="outline" onClick={() => setDeleteDialogOpen(false)}>
              Cancelar
            </Button>
            <Button variant="destructive" onClick={handleDelete}>
              Eliminar
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
};

export default AdminApprovals;
