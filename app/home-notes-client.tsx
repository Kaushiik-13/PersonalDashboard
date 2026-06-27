"use client";

import { useState } from "react";
import { ExternalLink, FileText, Plus, Star } from "lucide-react";
import Link from "next/link";
import type { Note } from "@/lib/supabase";
import { extractNotePreview } from "@/lib/notes";

function timeAgo(date: Date): string {
  const seconds = Math.floor((Date.now() - date.getTime()) / 1000);
  if (seconds < 60) return "just now";
  const minutes = Math.floor(seconds / 60);
  if (minutes < 60) return `${minutes}m ago`;
  const hours = Math.floor(minutes / 60);
  if (hours < 24) return `${hours}h ago`;
  const days = Math.floor(hours / 24);
  return `${days}d ago`;
}

export function HomeNotesClient({ notes }: { notes: Note[] }) {
  const [list, setList] = useState(notes);
  const [creating, setCreating] = useState(false);

  async function handleCreate() {
    setCreating(true);
    try {
      const res = await fetch("/api/notes", { method: "POST" });
      const data = await res.json();
      if (data.success) {
        setList((prev) => [data.note, ...prev].slice(0, 5));
      }
    } finally {
      setCreating(false);
    }
  }

  return (
    <section className="insights-block">
      <div className="insights-header">
        <div className="insights-header-left">
          <div className="insights-icon">
            <FileText size={16} />
          </div>
          <Link href="/notes" className="insights-title-link">
            <h3 className="insights-title">
              Notes
              <ExternalLink size={14} className="insights-external" />
            </h3>
          </Link>
        </div>
        <div className="insights-header-right">
          <button className="insights-add-btn" onClick={handleCreate} disabled={creating} title="New note">
            <Plus size={14} />
          </button>
        </div>
      </div>

      {list.length > 0 ? (
        <div className="insights-list">
          {list.map((note) => (
            <Link key={note.id} href="/notes" className="insights-list-row">
              <div className="insights-list-icon">
                {note.is_pinned ? <Star size={18} /> : <FileText size={18} />}
              </div>
              <div className="insights-list-info">
                <span className="insights-list-title">{note.title || "Untitled"}</span>
                <span className="insights-list-meta">
                  {extractNotePreview(note.blocks)} · {timeAgo(new Date(note.updated_at))}
                </span>
              </div>
            </Link>
          ))}
        </div>
      ) : (
        <div className="insights-empty">
          <p>No notes yet</p>
          <span>Create a quick note to start capturing ideas</span>
        </div>
      )}
    </section>
  );
}
