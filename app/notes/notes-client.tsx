"use client";

import { useCallback, useEffect, useMemo, useRef, useState } from "react";
import type { ComponentType } from "react";
import {
  Archive,
  Check,
  CheckSquare,
  Code2,
  FileText,
  Hash,
  Heading1,
  List,
  Plus,
  Quote,
  Search,
  Star,
  Trash2,
} from "lucide-react";
import type { Note, NoteBlock, NoteBlockType } from "@/lib/supabase";
import { createBlock, extractNotePreview, normalizeBlocks, normalizeTags } from "@/lib/notes";

type SaveState = "saved" | "saving" | "error";

const blockOptions: Array<{ type: NoteBlockType; label: string; icon: ComponentType<{ size?: number }> }> = [
  { type: "paragraph", label: "Text", icon: FileText },
  { type: "heading", label: "Heading", icon: Heading1 },
  { type: "bullet", label: "Bullet", icon: List },
  { type: "todo", label: "Todo", icon: CheckSquare },
  { type: "quote", label: "Quote", icon: Quote },
  { type: "code", label: "Code", icon: Code2 },
  { type: "divider", label: "Divider", icon: Hash },
];

function formatNoteTime(date: string) {
  return new Intl.DateTimeFormat("en", {
    month: "short",
    day: "numeric",
    hour: "numeric",
    minute: "2-digit",
  }).format(new Date(date));
}

function sortNotes(notes: Note[]) {
  return [...notes].sort((a, b) => {
    if (a.is_pinned !== b.is_pinned) return a.is_pinned ? -1 : 1;
    return new Date(b.updated_at).getTime() - new Date(a.updated_at).getTime();
  });
}

function applyMarkdownShortcut(value: string): { type: NoteBlockType; text: string; checked?: boolean } | null {
  if (value === "# ") return { type: "heading", text: "" };
  if (value === "- ") return { type: "bullet", text: "" };
  if (value === "> ") return { type: "quote", text: "" };
  if (value === "```") return { type: "code", text: "" };
  if (value === "[] " || value === "[ ] ") return { type: "todo", text: "", checked: false };
  if (value === "---") return { type: "divider", text: "" };
  return null;
}

export function NotesClient({ initialNotes }: { initialNotes: Note[] }) {
  const [notes, setNotes] = useState<Note[]>(() => sortNotes(initialNotes));
  const [selectedId, setSelectedId] = useState(initialNotes[0]?.id ?? "");
  const [query, setQuery] = useState("");
  const [tagFilter, setTagFilter] = useState("");
  const [tagDraft, setTagDraft] = useState("");
  const [saveState, setSaveState] = useState<SaveState>("saved");
  const [dirtyNoteId, setDirtyNoteId] = useState<string | null>(null);
  const [dirtyVersion, setDirtyVersion] = useState(0);
  const [creating, setCreating] = useState(false);
  const blockRefs = useRef<Record<string, HTMLTextAreaElement | null>>({});
  const latestNotesRef = useRef<Note[]>(notes);
  const dirtyNoteIdRef = useRef<string | null>(dirtyNoteId);
  const dirtyVersionRef = useRef(dirtyVersion);

  const selectedNote = notes.find((note) => note.id === selectedId) ?? notes[0] ?? null;

  useEffect(() => {
    if (!selectedId && notes[0]) {
      setSelectedId(notes[0].id);
    }
  }, [notes, selectedId]);

  useEffect(() => {
    latestNotesRef.current = notes;
  }, [notes]);

  useEffect(() => {
    dirtyNoteIdRef.current = dirtyNoteId;
  }, [dirtyNoteId]);

  useEffect(() => {
    dirtyVersionRef.current = dirtyVersion;
  }, [dirtyVersion]);

  useEffect(() => {
    if (!dirtyNoteId) return;

    const note = latestNotesRef.current.find((item) => item.id === dirtyNoteId);
    if (!note) return;
    const version = dirtyVersion;

    setSaveState("saving");
    const timer = window.setTimeout(async () => {
      try {
        const res = await fetch(`/api/notes/${note.id}`, {
          method: "PATCH",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({
            title: note.title,
            blocks: note.blocks,
            tags: note.tags,
            is_pinned: note.is_pinned,
            is_archived: note.is_archived,
          }),
        });
        const data = await res.json();
        if (!data.success) throw new Error(data.error || "Save failed");

        setNotes((prev) =>
          sortNotes(prev.map((item) => (item.id === note.id ? { ...item, updated_at: data.note.updated_at } : item)))
        );
        if (dirtyVersionRef.current === version) {
          setSaveState("saved");
          setDirtyNoteId(null);
        }
      } catch {
        setSaveState("error");
      }
    }, 650);

    return () => window.clearTimeout(timer);
  }, [dirtyNoteId, dirtyVersion]);

  useEffect(() => {
    function flushPendingSave() {
      const noteId = dirtyNoteIdRef.current;
      if (!noteId) return;

      const note = latestNotesRef.current.find((item) => item.id === noteId);
      if (!note) return;

      void fetch(`/api/notes/${note.id}`, {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          title: note.title,
          blocks: note.blocks,
          tags: note.tags,
          is_pinned: note.is_pinned,
          is_archived: note.is_archived,
        }),
        keepalive: true,
      });
    }

    window.addEventListener("pagehide", flushPendingSave);
    window.addEventListener("beforeunload", flushPendingSave);

    return () => {
      window.removeEventListener("pagehide", flushPendingSave);
      window.removeEventListener("beforeunload", flushPendingSave);
    };
  }, []);

  const allTags = useMemo(
    () => Array.from(new Set(notes.flatMap((note) => note.tags))).sort((a, b) => a.localeCompare(b)),
    [notes]
  );

  const filteredNotes = useMemo(() => {
    const lower = query.trim().toLowerCase();
    return notes.filter((note) => {
      if (note.is_archived) return false;
      if (tagFilter && !note.tags.includes(tagFilter)) return false;
      if (!lower) return true;

      const body = note.blocks.map((block) => block.text).join(" ").toLowerCase();
      return (
        note.title.toLowerCase().includes(lower) ||
        body.includes(lower) ||
        note.tags.some((tag) => tag.toLowerCase().includes(lower))
      );
    });
  }, [notes, query, tagFilter]);

  const updateSelectedNote = useCallback(
    (updater: (note: Note) => Note) => {
      if (!selectedNote) return;
      const nextNote = updater(selectedNote);
      setNotes((prev) => {
        const nextNotes = prev.map((note) => (note.id === nextNote.id ? nextNote : note));
        latestNotesRef.current = nextNotes;
        return nextNotes;
      });
      setDirtyNoteId(nextNote.id);
      setDirtyVersion((prev) => prev + 1);
    },
    [selectedNote]
  );

  const handleCreate = useCallback(async () => {
    setCreating(true);
    try {
      const res = await fetch("/api/notes", { method: "POST" });
      const data = await res.json();
      if (data.success) {
        setNotes((prev) => sortNotes([data.note, ...prev]));
        setSelectedId(data.note.id);
        setSaveState("saved");
      }
    } finally {
      setCreating(false);
    }
  }, []);

  const handleArchive = useCallback(async () => {
    if (!selectedNote) return;

    const archivedId = selectedNote.id;
    setNotes((prev) => prev.map((note) => (note.id === archivedId ? { ...note, is_archived: true } : note)));
    setSelectedId(notes.find((note) => note.id !== archivedId && !note.is_archived)?.id ?? "");

    await fetch(`/api/notes/${archivedId}/delete`, { method: "POST" });
  }, [notes, selectedNote]);

  function updateBlock(blockId: string, text: string) {
    updateSelectedNote((note) => ({
      ...note,
      blocks: normalizeBlocks(
        note.blocks.map((block) => {
          if (block.id !== blockId) return block;
          const shortcut = block.text === "" ? applyMarkdownShortcut(text) : null;
          if (shortcut) {
            return { ...block, type: shortcut.type, text: shortcut.text, checked: shortcut.checked };
          }
          return { ...block, text };
        })
      ),
    }));
  }

  function changeBlockType(blockId: string, type: NoteBlockType) {
    updateSelectedNote((note) => ({
      ...note,
      blocks: note.blocks.map((block) =>
        block.id === blockId ? { ...block, type, checked: type === "todo" ? Boolean(block.checked) : undefined } : block
      ),
    }));
  }

  function replaceBlockFromMenu(blockId: string, type: NoteBlockType) {
    updateSelectedNote((note) => ({
      ...note,
      blocks: note.blocks.map((block) =>
        block.id === blockId
          ? { ...block, type, text: "", checked: type === "todo" ? Boolean(block.checked) : undefined }
          : block
      ),
    }));
    window.setTimeout(() => blockRefs.current[blockId]?.focus(), 0);
  }

  function toggleTodo(blockId: string) {
    updateSelectedNote((note) => ({
      ...note,
      blocks: note.blocks.map((block) =>
        block.id === blockId ? { ...block, checked: !block.checked } : block
      ),
    }));
  }

  function insertBlock(afterBlockId: string, type: NoteBlockType = "paragraph") {
    if (!selectedNote) return;
    const block = createBlock(type);
    const index = selectedNote.blocks.findIndex((item) => item.id === afterBlockId);
    updateSelectedNote((note) => ({
      ...note,
      blocks: [...note.blocks.slice(0, index + 1), block, ...note.blocks.slice(index + 1)],
    }));
    window.setTimeout(() => blockRefs.current[block.id]?.focus(), 0);
  }

  function removeEmptyBlock(blockId: string) {
    if (!selectedNote || selectedNote.blocks.length === 1) return;
    const index = selectedNote.blocks.findIndex((block) => block.id === blockId);
    const previous = selectedNote.blocks[index - 1];
    updateSelectedNote((note) => ({
      ...note,
      blocks: note.blocks.filter((block) => block.id !== blockId),
    }));
    if (previous) {
      window.setTimeout(() => blockRefs.current[previous.id]?.focus(), 0);
    }
  }

  function addTag() {
    if (!selectedNote || !tagDraft.trim()) return;
    const tags = normalizeTags([...selectedNote.tags, tagDraft]);
    updateSelectedNote((note) => ({ ...note, tags }));
    setTagDraft("");
  }

  function removeTag(tag: string) {
    updateSelectedNote((note) => ({ ...note, tags: note.tags.filter((item) => item !== tag) }));
  }

  return (
    <>
      <header className="page-header">
        <div>
          <h1 className="page-title">Notes</h1>
          <p className="page-subtitle">{notes.filter((note) => !note.is_archived).length} notes in your workspace</p>
        </div>
        <button className="btn-primary" onClick={handleCreate} disabled={creating}>
          <Plus size={16} />
          {creating ? "Creating" : "New note"}
        </button>
      </header>

      <div className="notes-shell">
        <aside className="notes-sidebar">
          <div className="notes-search">
            <Search size={15} className="search-icon" />
            <input value={query} onChange={(event) => setQuery(event.target.value)} placeholder="Search notes" />
          </div>

          {allTags.length > 0 && (
            <div className="notes-tags-filter">
              <button className={`pill ${tagFilter === "" ? "active" : ""}`} onClick={() => setTagFilter("")}>
                All
              </button>
              {allTags.map((tag) => (
                <button
                  key={tag}
                  className={`pill ${tagFilter === tag ? "active" : ""}`}
                  onClick={() => setTagFilter(tag)}
                >
                  #{tag}
                </button>
              ))}
            </div>
          )}

          <div className="notes-list">
            {filteredNotes.map((note) => (
              <button
                key={note.id}
                className={`note-list-item ${selectedNote?.id === note.id ? "active" : ""}`}
                onClick={() => setSelectedId(note.id)}
              >
                <span className="note-list-title">
                  {note.is_pinned && <Star size={12} />}
                  {note.title || "Untitled"}
                </span>
                <span className="note-list-preview">{extractNotePreview(note.blocks)}</span>
                <span className="note-list-date">{formatNoteTime(note.updated_at)}</span>
              </button>
            ))}
          </div>
        </aside>

        <section className="notes-editor-panel">
          {selectedNote ? (
            <>
              <div className="notes-editor-toolbar">
                <span className={`save-state ${saveState}`}>{saveState === "error" ? "Save failed" : saveState}</span>
                <div className="notes-editor-actions">
                  <button
                    className={`icon-btn ${selectedNote.is_pinned ? "saved" : ""}`}
                    title={selectedNote.is_pinned ? "Unpin note" : "Pin note"}
                    onClick={() => updateSelectedNote((note) => ({ ...note, is_pinned: !note.is_pinned }))}
                  >
                    <Star size={16} />
                  </button>
                  <button className="icon-btn" title="Archive note" onClick={handleArchive}>
                    <Archive size={16} />
                  </button>
                </div>
              </div>

              <input
                className="note-title-input"
                value={selectedNote.title}
                onChange={(event) => updateSelectedNote((note) => ({ ...note, title: event.target.value }))}
                placeholder="Untitled"
              />

              <div className="note-tag-row">
                {selectedNote.tags.map((tag) => (
                  <button key={tag} className="note-tag" onClick={() => removeTag(tag)} title="Remove tag">
                    #{tag}
                  </button>
                ))}
                <input
                  value={tagDraft}
                  onChange={(event) => setTagDraft(event.target.value)}
                  onKeyDown={(event) => {
                    if (event.key === "Enter") {
                      event.preventDefault();
                      addTag();
                    }
                  }}
                  placeholder="Add tag"
                />
              </div>

              <div className="note-blocks">
                {selectedNote.blocks.map((block) => {
                  const showSlash = block.text.startsWith("/");
                  return (
                    <div key={block.id} className={`note-block note-block-${block.type}`}>
                      <div className="note-block-controls">
                        {block.type === "todo" ? (
                          <button className="note-todo-toggle" onClick={() => toggleTodo(block.id)} title="Toggle todo">
                            {block.checked && <Check size={13} />}
                          </button>
                        ) : (
                          <button className="note-block-menu" onClick={() => changeBlockType(block.id, "paragraph")}>
                            +
                          </button>
                        )}
                      </div>

                      {block.type === "divider" ? (
                        <button className="note-divider" onClick={() => changeBlockType(block.id, "paragraph")}>
                          <span />
                        </button>
                      ) : (
                        <textarea
                          ref={(element) => {
                            blockRefs.current[block.id] = element;
                          }}
                          value={block.text}
                          rows={block.type === "code" ? 4 : 1}
                          className="note-block-input"
                          placeholder={selectedNote.blocks[0]?.id === block.id ? "Start writing, or type /" : "Type /"}
                          onChange={(event) => updateBlock(block.id, event.target.value)}
                          onKeyDown={(event) => {
                            if (event.key === "Enter" && !event.shiftKey) {
                              event.preventDefault();
                              insertBlock(block.id);
                            }
                            if (event.key === "Backspace" && block.text === "") {
                              event.preventDefault();
                              removeEmptyBlock(block.id);
                            }
                          }}
                        />
                      )}

                      {showSlash && (
                        <div className="slash-menu">
                          {blockOptions.map((option) => {
                            const Icon = option.icon;
                            return (
                              <button
                                key={option.type}
                                onClick={() => replaceBlockFromMenu(block.id, option.type)}
                              >
                                <Icon size={14} />
                                {option.label}
                              </button>
                            );
                          })}
                        </div>
                      )}
                    </div>
                  );
                })}
              </div>
            </>
          ) : (
            <div className="empty-state">
              <FileText size={48} className="empty-icon" />
              <h3>No notes yet</h3>
              <p>Create a note to start writing.</p>
            </div>
          )}
        </section>
      </div>
    </>
  );
}
