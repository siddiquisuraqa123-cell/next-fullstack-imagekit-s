import NextAuth, { DefaultSession } from "next-auth";
import { JWT as DefaultJWT } from "next-auth/jwt";

declare module "next-auth" {
  interface Session {
    user: {
      id: string;
    } & DefaultSession["user"];
    hasYouTubeAccess?: boolean;
    provider?: string;
  }
}

declare module "next-auth/jwt" {
  interface JWT extends DefaultJWT {
    id?: string;
    provider?: string;
    googleAccessToken?: string;
    googleRefreshToken?: string;
    googleExpiresAt?: number;
    googleScope?: string;
    error?: string;
  }
}
