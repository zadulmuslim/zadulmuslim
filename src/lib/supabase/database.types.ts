/**
 * Database types matching supabase/migrations. Regenerate after schema changes:
 *   npx supabase gen types typescript --project-id <id> > src/lib/supabase/database.types.ts
 */
export type Json = string | number | boolean | null | { [key: string]: Json | undefined } | Json[];

type UserRole = "member" | "editor" | "admin" | "super_admin";
type MediaVisibility = "public" | "authenticated" | "private";
type MediaStatus = "pending" | "ready" | "deleted";
type ContentStatus = "draft" | "published" | "archived";
type QuestionStatus = "pending" | "in_review" | "answered" | "rejected";
type LectureKind = "video" | "audio" | "nasheed";

/** Row → Insert (columns with defaults / nullable become optional). */
type Rel = { foreignKeyName: string; columns: string[]; isOneToOne: boolean; referencedRelation: string; referencedColumns: string[] };
type Table<Row, Required extends keyof Row, R extends Rel[] = []> = {
  Row: Row;
  Insert: Partial<Row> & Pick<Row, Required>;
  Update: Partial<Row>;
  Relationships: R;
};
type FK<Col extends string, Ref extends string, Name extends string> = {
  foreignKeyName: Name; columns: [Col]; isOneToOne: false; referencedRelation: Ref; referencedColumns: ["id"];
};

export type Database = {
  public: {
    Tables: {
      profiles: Table<{
        id: string; display_name: string | null; role: UserRole; avatar_media_id: string | null;
        bio: string | null; location: string | null; occupation: string | null; phone: string | null;
        created_at: string; updated_at: string;
      }, "id", [FK<"avatar_media_id", "media", "profiles_avatar_fk">]>;
      media: Table<{
        id: string; category: string; visibility: MediaVisibility; bucket: string; object_key: string;
        public_url: string | null; mime_type: string; size_bytes: number; original_filename: string;
        alt_text: string | null; width: number | null; height: number | null; duration_seconds: number | null;
        status: MediaStatus; owner_id: string | null; replaces_id: string | null; metadata: Json;
        created_at: string; updated_at: string;
      }, "category" | "bucket" | "object_key" | "mime_type" | "size_bytes" | "original_filename">;
      article_categories: Table<{ id: string; slug: string; name_bn: string; description_bn: string | null; sort_order: number }, "slug" | "name_bn">;
      articles: Table<{
        id: string; slug: string; title: string; excerpt: string | null; body: string; category_id: string | null;
        author_id: string | null; author_name: string | null; featured_media_id: string | null; reading_minutes: number | null;
        status: ContentStatus; published_at: string | null; created_at: string; updated_at: string;
      }, "slug" | "title", [
        FK<"category_id", "article_categories", "articles_category_id_fkey">,
        FK<"featured_media_id", "media", "articles_featured_media_id_fkey">,
      ]>;
      article_media: Table<{ article_id: string; media_id: string; position: number }, "article_id" | "media_id">;
      question_categories: Table<{ id: string; slug: string; name_bn: string; sort_order: number }, "slug" | "name_bn">;
      questions: Table<{
        id: string; slug: string | null; title: string; question: string; answer: string | null; category_id: string | null;
        asker_id: string | null; asker_email: string | null; status: QuestionStatus; is_public: boolean;
        answered_by: string | null; answered_at: string | null; published_at: string | null; created_at: string; updated_at: string;
        asker_name: string | null; notify_email: boolean; notified_at: string | null;
      }, "title" | "question", [FK<"category_id", "question_categories", "questions_category_id_fkey">]>;
      audit_log: Table<{
        id: number; actor_id: string | null; actor_name: string | null; action: string; entity_type: string;
        entity_id: string | null; summary: string | null; metadata: Json; created_at: string;
      }, "action" | "entity_type">;
      quran_surahs: Table<{
        number: number; name_ar: string; name_bn: string; name_translit: string; meaning_bn: string;
        revelation: "meccan" | "medinan"; ayah_count: number; revelation_order: number | null; rukus: number | null;
      }, "number" | "name_ar" | "name_bn" | "name_translit" | "meaning_bn" | "revelation" | "ayah_count">;
      quran_ayahs: Table<{
        surah: number; ayah: number; juz: number | null; text_ar: string; text_bn: string | null; footnotes_bn: string | null; has_notes: boolean;
      }, "surah" | "ayah" | "text_ar">;
      comments: Table<{
        id: string; target_type: string; target_id: string; parent_id: string | null; author_id: string; body: string;
        status: string; edited_at: string | null; created_at: string;
      }, "target_type" | "target_id" | "author_id" | "body">;
      contact_messages: Table<{
        id: string; name: string; email: string; topic: string; subject: string; message: string;
        page_url: string | null; user_id: string | null; status: string; created_at: string;
      }, "name" | "email" | "topic" | "subject" | "message">;
      post_reactions: Table<{ target_type: string; target_id: string; user_id: string; kind: string; created_at: string }, "target_type" | "target_id" | "user_id" | "kind">;
      comment_reports: Table<{ comment_id: string; user_id: string; reason: string | null; created_at: string }, "comment_id" | "user_id">;
      hadith_categories: Table<{ id: number; title_bn: string; parent_id: number | null; hadeeths_count: number }, "id" | "title_bn">;
      hadiths: Table<{
        id: number; title_bn: string; hadeeth_bn: string; hadeeth_ar: string | null; attribution_bn: string | null; attribution_ar: string | null;
        grade_bn: string | null; grade_ar: string | null; explanation_bn: string | null; hints_bn: string[]; categories: number[]; imported_at: string; search_bn: string;
      }, "id" | "title_bn" | "hadeeth_bn">;
      content_sources: Table<{
        key: string; title_bn: string; attribution: string; url: string; license: string; version: string | null; imported_at: string;
      }, "key" | "title_bn" | "attribution" | "url" | "license">;
      staff_sessions: Table<{ session_id: string; user_id: string; verified_at: string }, "session_id" | "user_id">;
      login_otps: Table<{
        session_id: string; user_id: string; code_hash: string; expires_at: string; attempts: number; sends: number; last_sent_at: string;
      }, "session_id" | "user_id" | "code_hash" | "expires_at">;
      captcha_used: Table<{ nonce: string; expires_at: string }, "nonce" | "expires_at">;
      lectures: Table<{
        id: string; slug: string; title: string; description: string | null; speaker: string | null; kind: LectureKind;
        thumbnail_media_id: string | null; video_media_id: string | null; audio_media_id: string | null;
        external_video_url: string | null; duration_seconds: number | null; status: ContentStatus;
        published_at: string | null; created_at: string; updated_at: string;
      }, "slug" | "title">;
      books: Table<{
        id: string; slug: string; title: string; author_name: string | null; description: string | null; subject: string | null;
        cover_media_id: string | null; file_media_id: string | null; status: ContentStatus; published_at: string | null;
        created_at: string; updated_at: string;
      }, "slug" | "title">;
    };
    Views: { [_ in never]: never };
    Functions: {
      app_role: { Args: Record<string, never>; Returns: UserRole };
      is_staff: { Args: Record<string, never>; Returns: boolean };
      is_admin: { Args: Record<string, never>; Returns: boolean };
      session_verified: { Args: Record<string, never>; Returns: boolean };
    };
    Enums: {
      user_role: UserRole; media_visibility: MediaVisibility; media_status: MediaStatus;
      content_status: ContentStatus; question_status: QuestionStatus; lecture_kind: LectureKind;
    };
    CompositeTypes: { [_ in never]: never };
  };
};
