import { NextAuthOptions } from "next-auth";
import { JWT } from "next-auth/jwt";
import CredentialsProvider from "next-auth/providers/credentials";
import GoogleProvider from "next-auth/providers/google";
import { connectToDatabase } from "./db";
import bcrypt from "bcryptjs";
import User from "@/model/user";

// Refresh expired Google OAuth access tokens using the stored refresh_token
async function refreshGoogleAccessToken(token: JWT): Promise<JWT> {
  try {
    if (!token.googleRefreshToken) {
      return { ...token, error: "RefreshAccessTokenError" };
    }

    const clientId = process.env.GOOGLE_CLIENT_ID;
    const clientSecret = process.env.GOOGLE_CLIENT_SECRET;
    if (!clientId || !clientSecret) {
      return { ...token, error: "MissingGoogleOAuthCredentials" };
    }

    const response = await fetch("https://oauth2.googleapis.com/token", {
      method: "POST",
      headers: { "Content-Type": "application/x-www-form-urlencoded" },
      body: new URLSearchParams({
        client_id: clientId,
        client_secret: clientSecret,
        grant_type: "refresh_token",
        refresh_token: token.googleRefreshToken,
      }),
    });

    const refreshedTokens = await response.json();

    if (!response.ok) {
      console.error("[NextAuth] Google token refresh failed:", refreshedTokens);
      return { ...token, error: "RefreshAccessTokenError" };
    }

    return {
      ...token,
      googleAccessToken: refreshedTokens.access_token,
      googleExpiresAt: Math.floor(Date.now() / 1000 + (refreshedTokens.expires_in || 3600)),
      // Fall back to old refresh_token if Google didn't return a new one
      googleRefreshToken: refreshedTokens.refresh_token ?? token.googleRefreshToken,
      error: undefined,
    };
  } catch (error) {
    console.error("[NextAuth] Exception during Google token refresh:", error);
    return {
      ...token,
      error: "RefreshAccessTokenError",
    };
  }
}

export const authOptions: NextAuthOptions = {
  providers: [
    CredentialsProvider({
      name: "Credentials",
      credentials: {
        email: { label: "Email", type: "text" },
        password: { label: "Password", type: "password" },
      },
      async authorize(credentials) {
        if (!credentials?.email || !credentials?.password) {
          throw new Error("Missing email or password");
        }

        try {
          await connectToDatabase();
          const user = await User.findOne({ email: credentials.email });
          if (!user) {
            throw new Error("No user found with this email");
          }

          const isValid = await bcrypt.compare(credentials.password, user.password);
          if (!isValid) {
            throw new Error("Invalid password");
          }

          return {
            id: user._id.toString(),
            email: user.email,
          };
        } catch (error) {
          console.error("Auth error: ", error);
          throw error;
        }
      },
    }),

    GoogleProvider({
      clientId: process.env.GOOGLE_CLIENT_ID || "placeholder-google-client-id",
      clientSecret: process.env.GOOGLE_CLIENT_SECRET || "placeholder-google-client-secret",
      authorization: {
        params: {
          scope: "openid email profile https://www.googleapis.com/auth/youtube.force-ssl",
          access_type: "offline",
          prompt: "consent",
          response_type: "code",
        },
      },
    }),
  ],

  callbacks: {
    async jwt({ token, user, account }) {
      // Initial sign in
      if (account) {
        token.provider = account.provider;
        if (account.provider === "google") {
          token.googleAccessToken = account.access_token;
          token.googleRefreshToken = account.refresh_token;
          token.googleExpiresAt = account.expires_at;
          token.googleScope = account.scope;
        }
      }

      if (user) {
        token.id = user.id || token.sub;
        token.name = user.name || token.name;
        token.picture = (user as { image?: string }).image || token.picture;
      }

      // Check if Google OAuth token has expired and refresh if necessary
      if (
        token.provider === "google" &&
        token.googleExpiresAt &&
        Date.now() / 1000 > token.googleExpiresAt - 60
      ) {
        return refreshGoogleAccessToken(token);
      }

      return token;
    },

    async session({ session, token }) {
      if (session.user) {
        session.user.id = (token.id || token.sub) as string;
        session.provider = token.provider;

        // Security check: Only inform the client whether YouTube commenting permission is active.
        // NEVER expose raw googleAccessToken or refreshToken to client session!
        const hasScope = typeof token.googleScope === "string" && token.googleScope.includes("youtube.force-ssl");
        session.hasYouTubeAccess = Boolean(
          token.googleAccessToken &&
          hasScope &&
          token.error !== "RefreshAccessTokenError"
        );
      }
      return session;
    },
  },

  pages: {
    signIn: "/login",
    error: "/login",
  },

  session: {
    strategy: "jwt",
    maxAge: 30 * 24 * 60 * 60, // 30 days
  },

  secret: process.env.NEXTAUTH_SECRET || "default_development_secret_streamflix_super_secure_key",
};
