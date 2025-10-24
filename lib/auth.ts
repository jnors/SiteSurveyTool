import type { NextAuthOptions } from 'next-auth'
import type { JWT } from 'next-auth/jwt'
import GoogleProvider from 'next-auth/providers/google'

const GOOGLE_SCOPE =
  process.env.GOOGLE_DRIVE_SCOPE ??
  'openid email profile https://www.googleapis.com/auth/drive'

const TOKEN_EXPIRY_BUFFER = 60_000

function getEnv(name: string) {
  const value = process.env[name]
  if (!value) {
    throw new Error(`Missing required env var ${name}`)
  }
  return value
}

const googleClientId = getEnv('GOOGLE_OAUTH_CLIENT_ID')
const googleClientSecret = getEnv('GOOGLE_OAUTH_CLIENT_SECRET')

async function refreshAccessToken(token: JWT): Promise<JWT> {
  if (!token.refreshToken) {
    return { ...token, error: 'MissingRefreshToken' }
  }

  try {
    const response = await fetch('https://oauth2.googleapis.com/token', {
      method: 'POST',
      headers: { 'Content-Type': 'application/x-www-form-urlencoded' },
      body: new URLSearchParams({
        client_id: googleClientId,
        client_secret: googleClientSecret,
        grant_type: 'refresh_token',
        refresh_token: token.refreshToken as string,
      }),
    })

    const refreshedTokens = await response.json()

    if (!response.ok) {
      return { ...token, error: 'RefreshAccessTokenError' }
    }

    return {
      ...token,
      accessToken: refreshedTokens.access_token as string,
      expiresAt: Date.now() + Number(refreshedTokens.expires_in ?? 0) * 1000,
      refreshToken: (refreshedTokens.refresh_token as string | undefined) ?? token.refreshToken,
      error: undefined,
    }
  } catch (error) {
    console.error('Error refreshing access token', error)
    return { ...token, error: 'RefreshAccessTokenError' }
  }
}

export const authOptions: NextAuthOptions = {
  providers: [
    GoogleProvider({
      clientId: googleClientId,
      clientSecret: googleClientSecret,
      authorization: {
        params: {
          prompt: 'consent',
          access_type: 'offline',
          scope: GOOGLE_SCOPE,
        },
      },
    }),
  ],
  session: {
    strategy: 'jwt',
  },
  callbacks: {
    async jwt({ token, account }) {
      if (account) {
        token.accessToken = account.access_token
        token.refreshToken = account.refresh_token
        token.expiresAt = account.expires_at
          ? account.expires_at * 1000
          : Date.now() + Number(account.expires_in ?? 0) * 1000
        token.error = undefined
        return token
      }

      if (!token.expiresAt) {
        return token
      }

      const isTokenExpired = Date.now() > token.expiresAt - TOKEN_EXPIRY_BUFFER
      if (!isTokenExpired) {
        return token
      }

      return refreshAccessToken(token)
    },
    async session({ session, token }) {
      session.accessToken = token.accessToken as string | undefined
      session.refreshToken = token.refreshToken as string | undefined
      session.expiresAt = token.expiresAt as number | undefined
      session.error = token.error as string | undefined
      return session
    },
  },
}
