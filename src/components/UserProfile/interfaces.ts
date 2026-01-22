export interface Role {
  id?: number;
  name: string;
}

export interface User {
  email: string;
  enabled: boolean;
  id: number;
  name: string;
  password: string;
  roles: Role[];
  surname: string;
  username: string;
  userProfile: UserProfile;
  jwt: string;
}

export interface UserProfile {
  id: number;
  bio: string;
  avatar: string;
  pseudo: string;
  pseudoDiscord: string;
}
