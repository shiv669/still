import { betterAuth } from "better-auth"
import { magicLink } from "better-auth/plugins"
import { Pool } from "pg"
import nodemailer from "nodemailer"

const pool = new Pool({ connectionString: process.env.DATABASE_URL })
const transporter = nodemailer.createTransport({
  host: process.env.BREVO_SMTP_HOST,
  port: Number(process.env.BREVO_SMTP_PORT || 587),
  secure: Number(process.env.BREVO_SMTP_PORT) === 465,
  auth: { user: process.env.BREVO_SMTP_USER, pass: process.env.BREVO_SMTP_PASSWORD },
})

const baseURL = process.env.BETTER_AUTH_URL
  || (process.env.VERCEL_URL ? `https://${process.env.VERCEL_URL}` : undefined)
  || process.env.V0_RUNTIME_URL
  || "http://localhost:3000"

export const auth = betterAuth({
  database: pool,
  baseURL,
  // Reuse the existing Neon secret when BETTER_AUTH_SECRET is not provisioned.
  secret: process.env.BETTER_AUTH_SECRET || process.env.NEON_AUTH_COOKIE_SECRET,
  trustedOrigins: [
    baseURL,
    "http://localhost:3000",
    process.env.V0_RUNTIME_URL,
    process.env.V0_DEV_APP_URL,
    process.env.V0_BUILD_URL,
    process.env.V0_SANDBOX_URL,
    process.env.VERCEL_URL ? `https://${process.env.VERCEL_URL}` : undefined,
    process.env.VERCEL_PROJECT_PRODUCTION_URL ? `https://${process.env.VERCEL_PROJECT_PRODUCTION_URL}` : undefined,
  ].filter((origin, index, origins): origin is string => Boolean(origin) && origins.indexOf(origin) === index),
  plugins: [magicLink({
    async sendMagicLink({ email, url }) {
      const result = await transporter.sendMail({
        from: `${process.env.BREVO_FROM_NAME || "Still"} <${process.env.BREVO_FROM_EMAIL}>`,
        to: email,
        subject: "Your Still sign-in link",
        text: `Continue to Still: ${url}`,
        html: `<p>Continue to Still by clicking the link below.</p><p><a href="${url}">Sign in to Still</a></p><p>This link expires shortly and can only be used once.</p>`,
      })
      if (!result.messageId) throw new Error("Brevo did not accept the magic-link email")
    },
  })],
  advanced: process.env.NODE_ENV === "development" ? {
    defaultCookieAttributes: { sameSite: "none", secure: true },
  } : undefined,
})
