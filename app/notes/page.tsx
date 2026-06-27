import { Logo } from "@/components/logo";
import { getNotes } from "@/lib/supabase";
import { NotesClient } from "./notes-client";

export const dynamic = "force-dynamic";

export default async function NotesPage() {
  const notes = await getNotes(false, 100);

  return (
    <main className="shell">
      <Logo />
      <section className="main">
        <div className="page-container">
          <NotesClient initialNotes={notes} />
        </div>
      </section>
    </main>
  );
}
