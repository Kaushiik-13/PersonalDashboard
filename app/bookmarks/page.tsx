import { getBookmarkSignals } from "@/lib/supabase";
import { BookmarksClient } from "./bookmarks-client";
import { Logo } from "@/components/logo";

export const dynamic = "force-dynamic";

export default async function BookmarksPage() {
  const bookmarks = await getBookmarkSignals(undefined, 50);

  return (
    <main className="shell">
      <Logo />
      <section className="main">
        <div className="page-container">
          <BookmarksClient initialBookmarks={bookmarks} />
        </div>
      </section>
    </main>
  );
}