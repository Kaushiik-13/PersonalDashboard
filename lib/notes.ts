import { createClient } from "@supabase/supabase-js";
import type { NoteBlock, NoteBlockType } from "@/lib/supabase";

export const DEFAULT_NOTE_BLOCKS: NoteBlock[] = [
  { id: "block-1", type: "paragraph", text: "" },
];

export function createBlock(type: NoteBlockType = "paragraph", text = ""): NoteBlock {
  return {
    id: globalThis.crypto?.randomUUID?.() ?? `${Date.now()}-${Math.random()}`,
    type,
    text,
    checked: type === "todo" ? false : undefined,
  };
}

export function normalizeBlocks(value: unknown): NoteBlock[] {
  if (!Array.isArray(value)) {
    return DEFAULT_NOTE_BLOCKS;
  }

  const blocks = value
    .map((block): NoteBlock | null => {
      if (!block || typeof block !== "object") {
        return null;
      }

      const candidate = block as Partial<NoteBlock>;
      const type = normalizeBlockType(candidate.type);

      return {
        id: typeof candidate.id === "string" ? candidate.id : createBlock(type).id,
        type,
        text: typeof candidate.text === "string" ? candidate.text : "",
        checked: type === "todo" ? Boolean(candidate.checked) : undefined,
      };
    })
    .filter((block): block is NoteBlock => Boolean(block));

  return blocks.length ? blocks : DEFAULT_NOTE_BLOCKS;
}

export function normalizeTags(value: unknown): string[] {
  if (!Array.isArray(value)) {
    return [];
  }

  return Array.from(
    new Set(
      value
        .filter((tag): tag is string => typeof tag === "string")
        .map((tag) => tag.trim().replace(/^#/, ""))
        .filter(Boolean)
    )
  ).slice(0, 12);
}

export function extractNotePreview(blocks: NoteBlock[]) {
  return blocks.find((block) => block.type !== "divider" && block.text.trim())?.text.trim() || "No content yet";
}

export function getNotesSupabaseClient() {
  const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL;
  const supabaseKey =
    process.env.SUPABASE_SERVICE_ROLE_KEY ||
    process.env.SUPABASE_SERVICE_KEY ||
    process.env.NEXT_PUBLIC_SUPABASE_PUBLISHABLE_KEY;

  if (!supabaseUrl || !supabaseKey) {
    return null;
  }

  return createClient(supabaseUrl, supabaseKey, {
    auth: {
      persistSession: false,
    },
  });
}

function normalizeBlockType(type: unknown): NoteBlockType {
  if (
    type === "paragraph" ||
    type === "heading" ||
    type === "bullet" ||
    type === "todo" ||
    type === "quote" ||
    type === "code" ||
    type === "divider"
  ) {
    return type;
  }

  return "paragraph";
}
