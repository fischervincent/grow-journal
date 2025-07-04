import {
    betterAuth
} from 'better-auth';
import { drizzleAdapter } from "better-auth/adapters/drizzle";
import { nextCookies } from 'better-auth/next-js';
import { db } from "./postgres-drizzle/database";
import { accounts, sessions, users, verifications } from './postgres-drizzle/schema/auth-schema';
import { invites } from './postgres-drizzle/schema/invite-schema';

export const auth = betterAuth({
    database: drizzleAdapter(db, {
        provider: 'pg',
        schema: {
            accounts, sessions, users, verifications, invites,
        },
        usePlural: true,
    }),
    emailAndPassword: {
        enabled: true,
        async sendResetPassword() {
            // Send an email to the user with a link to reset their password
        },
    },
    socialProviders: {
        google: {
            prompt: "select_account",
            clientId: process.env.GOOGLE_CLIENT_ID!,
            clientSecret: process.env.GOOGLE_CLIENT_SECRET!
        },
    },
    plugins: [nextCookies()],
});