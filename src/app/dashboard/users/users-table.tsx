"use client";

import { Plus } from "@phosphor-icons/react/dist/ssr/Plus";
import { Trash } from "@phosphor-icons/react/dist/ssr/Trash";
import { useRouter } from "next/navigation";
import { useState, useTransition } from "react";
import { toast } from "sonner";
import { Badge } from "@/components/ui/shadcn/badge";
import { Button } from "@/components/ui/shadcn/button";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from "@/components/ui/shadcn/dialog";
import { Input } from "@/components/ui/shadcn/input";
import { Label } from "@/components/ui/shadcn/label";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/shadcn/select";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/shadcn/table";
import { authClient } from "@/lib/auth-client";
import { ROLE_LABELS } from "@/lib/labels";
import { ROLES, type Role } from "@/server/db/schema";

type UserRow = {
  id: string;
  name: string;
  email: string;
  role: string;
  ign: string | null;
  banned: boolean;
};

export function CreateUserDialog() {
  const router = useRouter();
  const [open, setOpen] = useState(false);
  const [role, setRole] = useState<Role>("member");
  const [pending, startTransition] = useTransition();

  function onSubmit(e: React.FormEvent<HTMLFormElement>) {
    e.preventDefault();
    const formData = new FormData(e.currentTarget);
    startTransition(async () => {
      const { error } = await authClient.admin.createUser({
        name: String(formData.get("name") ?? ""),
        email: String(formData.get("email") ?? ""),
        password: String(formData.get("password") ?? ""),
        // custom roles (leader/member/seller) are valid at runtime; the
        // default admin-plugin types only know "admin" | "user"
        role: role as "admin",
      });
      if (error) {
        toast.error(error.message ?? "Failed to create user");
        return;
      }
      toast.success("User created");
      setOpen(false);
      router.refresh();
    });
  }

  return (
    <Dialog open={open} onOpenChange={setOpen}>
      <DialogTrigger asChild>
        <Button>
          <Plus size={16} />
          New user
        </Button>
      </DialogTrigger>
      <DialogContent>
        <DialogHeader>
          <DialogTitle>Create user</DialogTitle>
          <DialogDescription>
            Accounts for accepted players, leaders, and sellers.
          </DialogDescription>
        </DialogHeader>
        <form onSubmit={onSubmit} className="grid gap-4">
          <div className="grid gap-2">
            <Label htmlFor="new-name">Name</Label>
            <Input id="new-name" name="name" required />
          </div>
          <div className="grid gap-2">
            <Label htmlFor="new-email">Email</Label>
            <Input id="new-email" name="email" type="email" required />
          </div>
          <div className="grid gap-2">
            <Label htmlFor="new-password">Temporary password</Label>
            <Input
              id="new-password"
              name="password"
              type="text"
              required
              minLength={8}
              placeholder="Share with the user; they can reset later"
            />
          </div>
          <div className="grid gap-2">
            <Label>Role</Label>
            <Select value={role} onValueChange={(v) => setRole(v as Role)}>
              <SelectTrigger>
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                {ROLES.map((r) => (
                  <SelectItem key={r} value={r}>
                    {ROLE_LABELS[r]}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>
          <Button type="submit" disabled={pending}>
            {pending ? "Creating…" : "Create user"}
          </Button>
        </form>
      </DialogContent>
    </Dialog>
  );
}

export function UsersTable({
  users,
  currentUserId,
}: {
  users: UserRow[];
  currentUserId: string;
}) {
  const router = useRouter();
  const [pending, startTransition] = useTransition();

  function setRole(userId: string, role: Role) {
    startTransition(async () => {
      const { error } = await authClient.admin.setRole({
        userId,
        role: role as "admin",
      });
      if (error) {
        toast.error(error.message ?? "Failed to update role");
        return;
      }
      toast.success("Role updated");
      router.refresh();
    });
  }

  function removeUser(userId: string, name: string) {
    if (!window.confirm(`Delete ${name}'s account? This cannot be undone.`)) {
      return;
    }
    startTransition(async () => {
      const { error } = await authClient.admin.removeUser({ userId });
      if (error) {
        toast.error(error.message ?? "Failed to delete user");
        return;
      }
      toast.success("User deleted");
      router.refresh();
    });
  }

  return (
    <div className="rounded-lg border">
      <Table>
        <TableHeader>
          <TableRow>
            <TableHead>User</TableHead>
            <TableHead className="hidden sm:table-cell">IGN</TableHead>
            <TableHead>Role</TableHead>
            <TableHead />
          </TableRow>
        </TableHeader>
        <TableBody>
          {users.map((user) => (
            <TableRow key={user.id}>
              <TableCell>
                <p className="font-medium">
                  {user.name}
                  {user.id === currentUserId && (
                    <Badge variant="secondary" className="ml-2">
                      You
                    </Badge>
                  )}
                  {user.banned && (
                    <Badge variant="destructive" className="ml-2">
                      Banned
                    </Badge>
                  )}
                </p>
                <p className="text-xs text-muted-foreground">{user.email}</p>
              </TableCell>
              <TableCell className="hidden sm:table-cell">
                {user.ign ?? "—"}
              </TableCell>
              <TableCell>
                <Select
                  value={user.role}
                  onValueChange={(v) => setRole(user.id, v as Role)}
                  disabled={pending || user.id === currentUserId}
                >
                  <SelectTrigger className="w-32">
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    {ROLES.map((r) => (
                      <SelectItem key={r} value={r}>
                        {ROLE_LABELS[r]}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </TableCell>
              <TableCell className="text-right">
                <Button
                  variant="ghost"
                  size="icon"
                  disabled={pending || user.id === currentUserId}
                  onClick={() => removeUser(user.id, user.name)}
                >
                  <Trash size={16} className="text-destructive" />
                </Button>
              </TableCell>
            </TableRow>
          ))}
        </TableBody>
      </Table>
    </div>
  );
}
