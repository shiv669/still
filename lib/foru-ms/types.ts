// Still-specific metadata extensions
export interface ThreadMetadata {
  question_type?: "fast-changing-tech" | "stable-concept" | "opinion" | "policy"
  freshness_window_days?: number
  classification_confidence?: number
  classification_reason?: string
}

export interface PostMetadata {
  freshness?: {
    created_at: string
    last_verified_at: string
    freshness_window_days: number
    state: FreshnessState
    verification_score: number
    verification_count: number
    outdated_reports: number
  }
}

export type FreshnessState = "VERIFIED" | "POSSIBLY_OUTDATED" | "OUTDATED"

// Types matching Foru.ms API response
export interface ForumThread {
  id: string
  title: string
  body: string
  slug?: string
  locked?: boolean
  pinned?: boolean
  userId: string
  user?: { id: string; username: string; avatar?: string }
  tags?: Array<{ id: string; name: string }>
  createdAt: string
  updatedAt: string
  extendedData?: ThreadMetadata
}

export interface ForumPost {
  id: string
  body: string
  threadId: string
  userId: string
  user?: { id: string; username: string; avatar?: string }
  createdAt: string
  updatedAt: string
  extendedData?: PostMetadata
}

export interface ForumUser {
  id: string
  username: string
  email?: string
  avatar?: string
  createdAt: string
}

// API Response types
export interface ThreadsResponse {
  threads: ForumThread[]
  total: number
  page: number
  limit: number
}

export interface PostsResponse {
  posts: ForumPost[]
  total: number
  page: number
  limit: number
}
