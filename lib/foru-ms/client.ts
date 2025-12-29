import { ForumClient } from "@foru-ms/sdk"
import type { ThreadMetadata, PostMetadata } from "./types"

const API_KEY = "272e5341-475c-474d-a450-ae60d0d512c6"

// Initialize the SDK with API key
const client = new ForumClient({
  apiKey: API_KEY,
})

// Thread interface matching Foru.ms API response
export interface ForumsThread {
  id: string
  title: string
  body: string
  slug?: string
  locked?: boolean
  pinned?: boolean
  user?: { id: string; username: string; avatar?: string }
  tags?: Array<{ id: string; name: string }>
  createdAt: string
  updatedAt: string
  extendedData?: ThreadMetadata
}

// Post interface matching Foru.ms API response
export interface ForumsPost {
  id: string
  body: string
  threadId: string
  userId: string
  user?: { id: string; username: string; avatar?: string }
  createdAt: string
  updatedAt: string
  extendedData?: PostMetadata
}

let cachedUser: { id: string; token: string } | null = null

const lastRegistrationCredentials: { email: string; password: string } | null = null

async function getOrCreateAuthenticatedUser(): Promise<{ id: string; token: string }> {
  if (cachedUser) {
    // Set the token for authenticated requests
    client.setToken(cachedUser.token)
    return cachedUser
  }

  const timestamp = Date.now()
  const randomStr = Math.random().toString(36).slice(2, 8)
  const email = `still_${timestamp}_${randomStr}@still.forum`
  const username = `still_user_${randomStr}`
  const password = `StillPass_${timestamp}!Aa1`

  try {
    // First try to list existing users to use one
    console.log("[v0] Checking for existing users...")
    const usersResponse = await client.users.list({})

    if (usersResponse.users && usersResponse.users.length > 0) {
      const existingUser = usersResponse.users[0]
      console.log("[v0] Found existing user:", existingUser.id)

      cachedUser = { id: existingUser.id, token: "" }
      return cachedUser
    }

    // No existing users, register a new one
    console.log("[v0] No existing users, registering new user...")

    try {
      const registerResponse = await client.auth.register({
        email,
        username,
        password,
      })

      console.log("[v0] Registration response:", JSON.stringify(registerResponse))

      console.log("[v0] Registration complete, logging in to get token...")
      const loginResponse = await client.auth.login({
        login: email,
        password,
      })

      if (loginResponse && loginResponse.token) {
        client.setToken(loginResponse.token)
        const me = await client.auth.me()
        cachedUser = { id: me.id, token: loginResponse.token }
        console.log("[v0] Logged in successfully, user:", cachedUser.id)
        return cachedUser
      }

      // If login didn't return token but register returned user info
      if (registerResponse && (registerResponse as any).user) {
        const userId = (registerResponse as any).user.id
        console.log("[v0] Using user ID from registration:", userId)
        cachedUser = { id: userId, token: "" }
        return cachedUser
      }

      throw new Error("Could not get user ID or token")
    } catch (regError: unknown) {
      const err = regError as Error
      console.log("[v0] Registration/login error:", err.message)

      if (err.message.includes("already exists")) {
        console.log("[v0] User exists, trying to list users again...")
        const retryUsers = await client.users.list({})
        if (retryUsers.users && retryUsers.users.length > 0) {
          const existingUser = retryUsers.users[0]
          console.log("[v0] Using existing user:", existingUser.id)
          cachedUser = { id: existingUser.id, token: "" }
          return cachedUser
        }
      }
      throw err
    }
  } catch (error: unknown) {
    const err = error as Error
    console.error("[v0] Auth error:", err.message)
    throw new Error(`Cannot create user: ${err.message}`)
  }
}

export async function getOrCreateUser(displayName: string): Promise<string> {
  const user = await getOrCreateAuthenticatedUser()
  return user.id
}

// Unified client interface wrapping the SDK
export const forumsClient = {
  threads: {
    async create(data: {
      title: string
      body: string
      userId?: string
      extendedData?: ThreadMetadata
    }): Promise<ForumsThread> {
      console.log("[v0] Creating thread:", { title: data.title.substring(0, 50) })

      const user = await getOrCreateAuthenticatedUser()

      const payload = {
        title: data.title,
        body: data.body,
        userId: user.id,
        extendedData: data.extendedData as Record<string, unknown>,
      }

      console.log("[v0] Thread payload:", {
        title: payload.title.substring(0, 30),
        userId: payload.userId,
        hasExtendedData: !!payload.extendedData,
      })

      try {
        const thread = await client.threads.create(payload)
        console.log("[v0] Thread created successfully:", thread.id)
        return thread as unknown as ForumsThread
      } catch (error: unknown) {
        const err = error as Error
        console.error("[v0] Thread creation error:", err.message)
        throw new Error(`Failed to create thread: ${err.message}`)
      }
    },

    async retrieve(id: string): Promise<ForumsThread> {
      console.log("[v0] Retrieving thread:", id)
      try {
        const thread = await client.threads.retrieve(id)
        return thread as unknown as ForumsThread
      } catch (error: unknown) {
        const err = error as Error
        console.error("[v0] Thread retrieve error:", err.message)
        throw new Error("Thread not found")
      }
    },

    async list(options?: { limit?: number; page?: number }): Promise<{ threads: ForumsThread[]; count: number }> {
      console.log("[v0] Listing threads...")
      try {
        const response = await client.threads.list({
          limit: options?.limit || 20,
        })

        console.log("[v0] Got", response.threads?.length || 0, "threads")

        return {
          threads: (response.threads || []) as unknown as ForumsThread[],
          count: response.threads?.length || 0,
        }
      } catch (error: unknown) {
        const err = error as Error
        console.error("[v0] Thread list error:", err.message)
        return { threads: [], count: 0 }
      }
    },

    async update(id: string, data: Partial<ForumsThread>): Promise<ForumsThread> {
      try {
        const thread = await client.threads.update(id, {
          title: data.title,
          body: data.body,
          extendedData: data.extendedData as Record<string, unknown>,
        })
        return thread as unknown as ForumsThread
      } catch (error: unknown) {
        const err = error as Error
        console.error("[v0] Thread update error:", err.message)
        throw error
      }
    },

    async getPosts(threadId: string, options?: object): Promise<{ posts: ForumsPost[] }> {
      console.log("[v0] Getting posts for thread:", threadId)
      try {
        const response = await client.threads.getPosts(threadId, options || {})
        return {
          posts: (response.posts || []) as unknown as ForumsPost[],
        }
      } catch (error: unknown) {
        const err = error as Error
        console.error("[v0] Get posts error:", err.message)
        return { posts: [] }
      }
    },
  },

  posts: {
    async create(data: {
      threadId: string
      body: string
      userId?: string
      extendedData?: PostMetadata
    }): Promise<ForumsPost> {
      console.log("[v0] Creating post for thread:", data.threadId)

      const user = await getOrCreateAuthenticatedUser()

      try {
        const post = await client.posts.create({
          threadId: data.threadId,
          body: data.body,
          userId: user.id,
          extendedData: data.extendedData as Record<string, unknown>,
        })

        console.log("[v0] Post created:", post.id)
        return post as unknown as ForumsPost
      } catch (error: unknown) {
        const err = error as Error
        console.error("[v0] Post creation error:", err.message)
        throw error
      }
    },

    async retrieve(id: string): Promise<ForumsPost> {
      try {
        const post = await client.posts.retrieve(id)
        return post as unknown as ForumsPost
      } catch (error: unknown) {
        const err = error as Error
        console.error("[v0] Post retrieve error:", err.message)
        throw new Error("Post not found")
      }
    },

    async update(id: string, data: Partial<ForumsPost>): Promise<ForumsPost> {
      try {
        const post = await client.posts.update(id, {
          body: data.body,
          extendedData: data.extendedData as Record<string, unknown>,
        })
        return post as unknown as ForumsPost
      } catch (error: unknown) {
        const err = error as Error
        console.error("[v0] Post update error:", err.message)
        throw error
      }
    },
  },

  users: {
    async getOrCreate(displayName: string): Promise<{ id: string }> {
      const user = await getOrCreateAuthenticatedUser()
      return { id: user.id }
    },
  },
}

// Helper functions
export function getThreadMetadata(thread: ForumsThread): ThreadMetadata | undefined {
  return thread.extendedData
}

export function getPostMetadata(post: ForumsPost): PostMetadata | undefined {
  return post.extendedData
}
