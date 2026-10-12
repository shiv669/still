import { Pool } from "pg"
import type { ThreadMetadata, PostMetadata } from "./types"

const pool = new Pool({ connectionString: process.env.DATABASE_URL })
const SYSTEM_USER_ID = "00000000-0000-0000-0000-000000000001"

export interface ForumsThread {
  id: string
  title: string
  body: string
  locked: boolean
  pinned: boolean
  user?: { id: string; username: string; avatar?: string }
  createdAt: string
  updatedAt: string
  extendedData?: ThreadMetadata
}

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

function mapThread(row: Record<string, any>): ForumsThread {
  return {
    id: row.id,
    title: row.title,
    body: row.body,
    locked: row.locked,
    pinned: row.pinned,
    user: row.user_id ? { id: row.user_id, username: row.display_name } : undefined,
    createdAt: new Date(row.created_at).toISOString(),
    updatedAt: new Date(row.updated_at).toISOString(),
    extendedData: row.extended_data || undefined,
  }
}

function mapPost(row: Record<string, any>): ForumsPost {
  return {
    id: row.id,
    body: row.body,
    threadId: row.thread_id,
    userId: row.user_id,
    user: row.display_name ? { id: row.user_id, username: row.display_name } : undefined,
    createdAt: new Date(row.created_at).toISOString(),
    updatedAt: new Date(row.updated_at).toISOString(),
    extendedData: row.extended_data || undefined,
  }
}

async function ensureSystemUser() {
  await pool.query(
    `INSERT INTO public.forum_users (id, display_name) VALUES ($1, $2) ON CONFLICT (id) DO NOTHING`,
    [SYSTEM_USER_ID, "Question Author"],
  )
  return SYSTEM_USER_ID
}

export async function getOrCreateUser(displayName: string): Promise<string> {
  await pool.query(
    `INSERT INTO public.forum_users (id, display_name) VALUES ($1, $2) ON CONFLICT (id) DO UPDATE SET display_name = EXCLUDED.display_name`,
    [SYSTEM_USER_ID, displayName.trim().slice(0, 80) || "Question Author"],
  )
  return SYSTEM_USER_ID
}

export const forumsClient = {
  threads: {
    async create(data: { title: string; body: string; userId?: string; extendedData?: ThreadMetadata }): Promise<ForumsThread> {
      const userId = data.userId || (await ensureSystemUser())
      const result = await pool.query(
        `INSERT INTO public.forum_threads (title, body, user_id, extended_data) VALUES ($1, $2, $3, $4) RETURNING id, title, body, user_id, locked, pinned, extended_data, created_at, updated_at`,
        [data.title.trim(), data.body.trim(), userId, data.extendedData || {}],
      )
      return mapThread(result.rows[0])
    },
    async retrieve(id: string): Promise<ForumsThread> {
      const result = await pool.query(
        `SELECT t.*, u.display_name FROM public.forum_threads t JOIN public.forum_users u ON u.id = t.user_id WHERE t.id = $1`,
        [id],
      )
      if (!result.rows[0]) throw new Error("Thread not found")
      return mapThread(result.rows[0])
    },
    async list(options?: { limit?: number; page?: number }): Promise<{ threads: ForumsThread[]; count: number }> {
      const limit = Math.min(Math.max(options?.limit || 20, 1), 100)
      const page = Math.max(options?.page || 1, 1)
      const offset = (page - 1) * limit
      const result = await pool.query(
        `SELECT t.*, u.display_name, count(*) OVER()::int AS total_count FROM public.forum_threads t JOIN public.forum_users u ON u.id = t.user_id ORDER BY t.pinned DESC, t.created_at DESC LIMIT $1 OFFSET $2`,
        [limit, offset],
      )
      return { threads: result.rows.map(mapThread), count: result.rows[0]?.total_count || 0 }
    },
    async update(id: string, data: Partial<ForumsThread>): Promise<ForumsThread> {
      const result = await pool.query(
        `UPDATE public.forum_threads SET title = COALESCE($2, title), body = COALESCE($3, body), extended_data = COALESCE($4, extended_data), updated_at = now() WHERE id = $1 RETURNING *`,
        [id, data.title, data.body, data.extendedData],
      )
      if (!result.rows[0]) throw new Error("Thread not found")
      return mapThread(result.rows[0])
    },
    async getPosts(threadId: string): Promise<{ posts: ForumsPost[] }> {
      const result = await pool.query(
        `SELECT p.*, u.display_name FROM public.forum_posts p JOIN public.forum_users u ON u.id = p.user_id WHERE p.thread_id = $1 ORDER BY p.created_at ASC`,
        [threadId],
      )
      return { posts: result.rows.map(mapPost) }
    },
  },
  posts: {
    async create(data: { threadId: string; body: string; userId?: string; extendedData?: PostMetadata }): Promise<ForumsPost> {
      const userId = data.userId || (await ensureSystemUser())
      const result = await pool.query(
        `INSERT INTO public.forum_posts (thread_id, body, user_id, extended_data) VALUES ($1, $2, $3, $4) RETURNING *`,
        [data.threadId, data.body.trim(), userId, data.extendedData || {}],
      )
      return mapPost(result.rows[0])
    },
    async retrieve(id: string): Promise<ForumsPost> {
      const result = await pool.query(
        `SELECT p.*, u.display_name FROM public.forum_posts p JOIN public.forum_users u ON u.id = p.user_id WHERE p.id = $1`,
        [id],
      )
      if (!result.rows[0]) throw new Error("Post not found")
      return mapPost(result.rows[0])
    },
    async update(id: string, data: Partial<ForumsPost>): Promise<ForumsPost> {
      const result = await pool.query(
        `UPDATE public.forum_posts SET body = COALESCE($2, body), extended_data = COALESCE($3, extended_data), updated_at = now() WHERE id = $1 RETURNING *`,
        [id, data.body, data.extendedData],
      )
      if (!result.rows[0]) throw new Error("Post not found")
      return mapPost(result.rows[0])
    },
  },
  users: { async getOrCreate(displayName: string): Promise<{ id: string }> { return { id: await getOrCreateUser(displayName) } } },
}

export function getThreadMetadata(thread: ForumsThread): ThreadMetadata | undefined { return thread.extendedData }
export function getPostMetadata(post: ForumsPost): PostMetadata | undefined { return post.extendedData }
