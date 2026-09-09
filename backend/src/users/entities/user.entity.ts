export type UserRole = 'owner' | 'manager' | 'staff';

export class User {
  id: string; // uuid PK
  businessId: string; // FK -> businesses.id
  name: string;
  email: string;
  passwordHash: string; // never expose this in responses
  role: UserRole;
  createdAt: Date;
}
