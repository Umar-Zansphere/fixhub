export interface JwtPayload {
  sub: string; // userId
  phone: string;
  role: string;
}

export interface AuthenticatedUser {
  userId: string;
  phone: string;
  role: string;
}
