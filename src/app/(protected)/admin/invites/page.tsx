"use client";

import { useState, useEffect } from "react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import {
  createInvite,
  getAllInvites,
  deleteInvite,
} from "@/app/server-functions/invite-management";

interface Invite {
  id: string;
  email: string;
  invitedBy?: string;
  isUsed: boolean;
  usedAt?: Date;
  expiresAt?: Date;
  createdAt: Date;
  updatedAt: Date;
}

export default function AdminInvitesPage() {
  const [invites, setInvites] = useState<Invite[]>([]);
  const [newEmail, setNewEmail] = useState("");
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    loadInvites();
  }, []);

  const loadInvites = async () => {
    const [result, error] = await getAllInvites();
    if (error) {
      setError(error);
    } else {
      setInvites(result || []);
    }
  };

  const handleCreateInvite = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!newEmail.trim()) return;

    setIsLoading(true);
    setError(null);

    const [, error] = await createInvite(newEmail.trim());

    if (error) {
      setError(error);
    } else {
      setNewEmail("");
      await loadInvites();
    }

    setIsLoading(false);
  };

  const handleDeleteInvite = async (email: string) => {
    if (!confirm(`Are you sure you want to delete the invite for ${email}?`)) {
      return;
    }

    const [, error] = await deleteInvite(email);

    if (error) {
      setError(error);
    } else {
      await loadInvites();
    }
  };

  return (
    <div className="container mx-auto p-6">
      <div className="max-w-4xl mx-auto">
        <h1 className="text-3xl font-bold mb-6">Invite Management</h1>

        {error && (
          <div className="bg-red-100 border border-red-400 text-red-700 px-4 py-3 rounded mb-4">
            {error}
          </div>
        )}

        <Card className="mb-6">
          <CardHeader>
            <CardTitle>Create New Invite</CardTitle>
            <CardDescription>
              Send an invitation to allow someone to sign up
            </CardDescription>
          </CardHeader>
          <CardContent>
            <form onSubmit={handleCreateInvite} className="flex gap-2">
              <Input
                type="email"
                placeholder="Enter email address..."
                value={newEmail}
                onChange={(e) => setNewEmail(e.target.value)}
                required
              />
              <Button type="submit" disabled={isLoading}>
                {isLoading ? "Creating..." : "Create Invite"}
              </Button>
            </form>
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle>Existing Invites</CardTitle>
            <CardDescription>Manage existing invitations</CardDescription>
          </CardHeader>
          <CardContent>
            <div className="space-y-3">
              {invites.length === 0 ? (
                <p className="text-gray-500 text-center py-4">
                  No invites created yet
                </p>
              ) : (
                invites.map((invite) => (
                  <div
                    key={invite.id}
                    className="flex items-center justify-between p-3 border rounded-lg"
                  >
                    <div className="flex items-center gap-3">
                      <span className="font-medium">{invite.email}</span>
                      <Badge variant={invite.isUsed ? "secondary" : "default"}>
                        {invite.isUsed ? "Used" : "Pending"}
                      </Badge>
                      {invite.usedAt && (
                        <span className="text-sm text-gray-500">
                          Used on {new Date(invite.usedAt).toLocaleDateString()}
                        </span>
                      )}
                    </div>
                    <div className="flex items-center gap-2">
                      <span className="text-sm text-gray-500">
                        Created{" "}
                        {new Date(invite.createdAt).toLocaleDateString()}
                      </span>
                      <Button
                        variant="outline"
                        size="sm"
                        onClick={() => handleDeleteInvite(invite.email)}
                      >
                        Delete
                      </Button>
                    </div>
                  </div>
                ))
              )}
            </div>
          </CardContent>
        </Card>
      </div>
    </div>
  );
}
