import NextAuth from "next-auth";
import CredentialsProvider from "next-auth/providers/credentials";
import GoogleProvider from "next-auth/providers/google";
import axios from "axios";
import { jwtDecode } from "jwt-decode";
import { BACKEND_URL, IS_DEMO_MODE } from "../../../../utils/config";

// inside docker the server reaches the api at http://backend:8000/api/
const backend = axios.create({ baseURL: process.env.INTERNAL_BACKEND_URL || BACKEND_URL, timeout: 15_000 });

function tokensFromBackend({ access, refresh }) {
    const claims = jwtDecode(access);
    return { accessToken: access, refreshToken: refresh, accessTokenExpires: claims.exp * 1000 };
}

async function refreshAccessToken(token) {
    try {
        const { data } = await backend.post("token/refresh/", { refresh: token.refreshToken });
        return {
            ...token,
            ...tokensFromBackend({ access: data.access, refresh: data.refresh ?? token.refreshToken }),
            error: undefined,
        };
    } catch {
        return { ...token, error: "RefreshAccessTokenError" };
    }
}

function signInErrorMessage(error) {
    if (error.response?.status === 401) return "Incorrect username or password.";
    if (error.response) return "The server could not sign you in. Please try again later.";
    return "The SuperRay server could not be reached. Please try again later.";
}

const providers = [
    CredentialsProvider({
        name: "Credentials",
        credentials: {
            username: { label: "Username", type: "text" },
            password: { label: "Password", type: "password" },
        },
        async authorize(credentials) {
            if (IS_DEMO_MODE) {
                throw new Error("Sign-in is unavailable while the backend is offline.");
            }
            try {
                const { data } = await backend.post("token/", {
                    username: credentials.username,
                    password: credentials.password,
                });
                const claims = jwtDecode(data.access);
                return {
                    id: String(claims.user_id),
                    name: [claims.first_name, claims.last_name].filter(Boolean).join(" ") || claims.username,
                    email: claims.email,
                    username: claims.username,
                    access: data.access,
                    refresh: data.refresh,
                };
            } catch (error) {
                throw new Error(signInErrorMessage(error));
            }
        },
    }),
];

if (!IS_DEMO_MODE && process.env.GOOGLE_CLIENT_ID && process.env.GOOGLE_CLIENT_SECRET) {
    providers.push(
        GoogleProvider({
            clientId: process.env.GOOGLE_CLIENT_ID,
            clientSecret: process.env.GOOGLE_CLIENT_SECRET,
        })
    );
}

const handler = NextAuth({
    providers,
    pages: { signIn: "/login" },
    callbacks: {
        async signIn({ account }) {
            if (account?.provider !== "google") return true;
            try {
                const { data } = await backend.post("google/", { access_token: account.id_token });
                account.backendResponse = data;
                return true;
            } catch (error) {
                console.error("Google sign-in was rejected by the backend:", error.response?.status ?? error.code);
                return false;
            }
        },
        async jwt({ token, user, account }) {
            if (account?.provider === "credentials" && user) {
                return {
                    ...token,
                    ...tokensFromBackend(user),
                    name: user.name,
                    email: user.email,
                    username: user.username,
                };
            }
            if (account?.provider === "google" && account.backendResponse) {
                const { access, refresh, user: backendUser } = account.backendResponse;
                return { ...token, ...tokensFromBackend({ access, refresh }), username: backendUser.username };
            }
            if (!token.accessToken || Date.now() < token.accessTokenExpires - 60_000) {
                return token;
            }
            return refreshAccessToken(token);
        },
        async session({ session, token }) {
            // keep the refresh token server-side (encrypted cookie only)
            session.user = {
                name: token.name,
                email: token.email,
                image: token.picture,
                username: token.username,
            };
            session.accessToken = token.accessToken;
            session.error = token.error;
            return session;
        },
    },
    events: {
        async signOut({ token }) {
            if (!token?.refreshToken) return;
            try {
                await backend.post("logout/", { refresh_token: token.refreshToken });
            } catch (error) {
                console.warn("Could not revoke refresh token on sign-out:", error.response?.status ?? error.code);
            }
        },
    },
});

export { handler as GET, handler as POST };
