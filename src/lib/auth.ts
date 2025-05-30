import {
  betterAuth
} from 'better-auth';
import { nextCookies } from 'better-auth/next-js';

export const auth = betterAuth({
  emailAndPassword: {
      enabled: true,
      async sendResetPassword(data, request) {
          // Send an email to the user with a link to reset their password
      },
      plugins: [nextCookies()]
  },
  socialProviders: {
      google: {
          clientId: process.env.GOOGLE_CLIENT_ID!,
          clientSecret: process.env.GOOGLE_CLIENT_SECRET!
      },
  },

  /** if no database is provided, the user data will be stored in memory.
   * Make sure to provide a database to persist user data **/
});