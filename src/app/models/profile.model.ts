export interface Profile {
  uid: string;
  email: string;
  role: UserRole;
  notify: boolean;
  created_on: string;
  displayName: string;
  idDomaine: string;
  last_connected: string;
  photoURL: string;
}

export const enum UserRole {
  Admin = "admin",
  User = "user",
}
