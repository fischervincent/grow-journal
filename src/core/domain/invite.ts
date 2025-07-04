export interface Invite {
  id: string;
  email: string;
  invitedBy?: string;
  isUsed: boolean;
  usedAt?: Date;
  expiresAt?: Date;
  createdAt: Date;
  updatedAt: Date;
}

export interface NewInvite {
  email: string;
  invitedBy?: string;
  expiresAt?: Date;
}

export interface UpdateInvite {
  isUsed?: boolean;
  usedAt?: Date;
} 