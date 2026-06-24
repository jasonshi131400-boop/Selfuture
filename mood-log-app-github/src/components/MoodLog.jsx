import { useEffect, useState } from "react";
import { supabase } from "../lib/supabaseClient";

const MOODS = [
  { id: "great", emoji: "😄", label: "Great", color: "#7FB069" },
  { id: "good", emoji: "🙂", label: "Good", color: "#9CC177" },
  { id: "okay", emoji: "😐", label: "Okay", color: "#D9B86C" },
  { id: "low", emoji: "🙁", label: "Low", color: "#E0966F" },
  { id: "rough", emoji: "😣", label: "Rough", color: "#E0735F" },
];

function moodById(id) {
  return MOODS.find((m) => m.id === id) || MOODS[2];
}

function formatTime(timestamp) {
  if (!timestamp) return "";
  const d = new Date(timestamp);
  const hh = String(d.getHours()).padStart(2, "0");
  const mm = String(d.getMinutes()).padStart(2, "0");
  const ss = String(d.getSeconds()).padStart(2, "0");
  return `${hh}:${mm}:${ss}`;
}

function formatFullDate(timestamp) {
  const d = new Date(timestamp);
  return d.toLocaleDateString(undefined, {
    month: "short",
    day: "numeric",
    year: "numeric",
  });
}

function isToday(timestamp) {
  const d = new Date(timestamp);
  const now = new Date();
  return (
    d.getFullYear() === now.getFullYear() &&
    d.getMonth() === now.getMonth() &&
    d.getDate() === now.getDate()
  );
}

export default function MoodLog({ session }) {
  const [entries, setEntries] = useState([]);
  const [loading, setLoading] = useState(true);
  const [selectedMood, setSelectedMood] = useState(null);
  const [note, setNote] = useState("");
  const [error, setError] = useState(null);
  const [justSaved, setJustSaved] = useState(false);

  const userId = session.user.id;
  const userEmail = session.user.email;

  useEffect(() => {
    let mounted = true;

    async function load() {
      const { data, error } = await supabase
        .from("mood_entries")
        .select("*")
        .order("saved_at", { ascending: false });

      if (!mounted) return;
      if (error) {
        console.error("Failed to load entries:", error);
        setError("Couldn't load your entries. Try refreshing.");
      } else {
        setEntries(data || []);
      }
      setLoading(false);
    }

    load();

    // Real-time updates: if this account is open in two tabs/devices,
    // both stay in sync automatically.
    const channel = supabase
      .channel("mood_entries_changes")
      .on(
        "postgres_changes",
        { event: "*", schema: "public", table: "mood_entries", filter: `user_id=eq.${userId}` },
        () => {
          load();
        }
      )
      .subscribe();

    return () => {
      mounted = false;
      supabase.removeChannel(channel);
    };
  }, [userId]);

  async function handleSave() {
    if (!selectedMood) return;
    setError(null);

    const newEntry = {
      user_id: userId,
      mood: selectedMood,
      note: note.trim(),
      saved_at: new Date().toISOString(),
    };

    // Optimistic UI: show it immediately, reconcile with the server after.
    const tempId = `temp-${Date.now()}`;
    setEntries((prev) => [{ ...newEntry, id: tempId }, ...prev]);
    setJustSaved(true);
    setTimeout(() => setJustSaved(false), 1800);
    setNote("");
    setSelectedMood(null);

    const { data, error } = await supabase
      .from("mood_entries")
      .insert(newEntry)
      .select()
      .single();

    if (error) {
      console.error("Save failed:", error);
      setError("Couldn't save that entry. Check your connection and try again.");
      setEntries((prev) => prev.filter((e) => e.id !== tempId));
    } else {
      setEntries((prev) => prev.map((e) => (e.id === tempId ? data : e)));
    }
  }

  async function handleDelete(id) {
    const prevEntries = entries;
    setEntries((prev) => prev.filter((e) => e.id !== id));

    const { error } = await supabase.from("mood_entries").delete().eq("id", id);
    if (error) {
      console.error("Delete failed:", error);
      setError("Couldn't delete that entry. Try again.");
      setEntries(prevEntries);
    }
  }

  async function handleSignOut() {
    await supabase.auth.signOut();
  }

  return (
    <div
      style={{
        minHeight: "100%",
        background: "#F7F5F2",
        color: "#2B2A33",
        fontFamily: "-apple-system, BlinkMacSystemFont, 'Segoe UI', system-ui, sans-serif",
        display: "flex",
        justifyContent: "center",
      }}
    >
      <style>{`
        @keyframes fadeUp { from { opacity: 0; transform: translateY(6px); } to { opacity: 1; transform: translateY(0); } }
        @keyframes popIn { 0% { transform: scale(0.85); opacity: 0; } 60% { transform: scale(1.08); opacity: 1; } 100% { transform: scale(1); } }
        .mood-log * { box-sizing: border-box; }
        .mood-swatch { transition: transform 0.15s ease; cursor: pointer; }
        .mood-swatch:hover { transform: translateY(-3px); }
        .save-btn { transition: background 0.15s ease, transform 0.1s ease; }
        .save-btn:hover:not(:disabled) { background: #756bc0; }
        .save-btn:active:not(:disabled) { transform: scale(0.98); }
        .save-btn:disabled { opacity: 0.5; cursor: not-allowed; }
        .entry-row { animation: fadeUp 0.35s ease backwards; }
        .delete-btn { opacity: 0; transition: opacity 0.15s ease, color 0.15s ease; cursor: pointer; }
        .entry-row:hover .delete-btn { opacity: 0.55; }
        .delete-btn:hover { opacity: 1 !important; color: #E0735F; }
        textarea.note-input { resize: none; }
        .signout-btn { background: none; border: none; color: #A39E91; font-size: 13px; cursor: pointer; text-decoration: underline; }
        .signout-btn:hover { color: #2B2A33; }
      `}</style>

      <div className="mood-log" style={{ width: "100%", maxWidth: "560px", padding: "40px 24px 64px" }}>
        <header style={{ marginBottom: "32px", display: "flex", justifyContent: "space-between", alignItems: "flex-start" }}>
          <div>
            <h1 style={{ fontFamily: "Georgia, 'Source Serif 4', serif", fontSize: "28px", fontWeight: 500, margin: "0 0 4px" }}>
              Mood Log
            </h1>
            <p style={{ margin: 0, fontSize: "14px", color: "#8B8579" }}>{userEmail}</p>
          </div>
          <button className="signout-btn" onClick={handleSignOut}>
            Sign out
          </button>
        </header>

        <section
          style={{
            background: "#FFFFFF",
            border: "1px solid #E5E1D8",
            borderRadius: "14px",
            padding: "24px",
            marginBottom: "40px",
            boxShadow: "0 1px 2px rgba(43,42,51,0.04)",
          }}
        >
          <div role="radiogroup" aria-label="Select your mood" style={{ display: "flex", gap: "10px", marginBottom: "18px", flexWrap: "wrap" }}>
            {MOODS.map((m) => {
              const sel = selectedMood === m.id;
              return (
                <button
                  key={m.id}
                  className="mood-swatch"
                  role="radio"
                  aria-checked={sel}
                  aria-label={m.label}
                  onClick={() => setSelectedMood(m.id)}
                  style={{
                    flex: "1 1 0",
                    minWidth: "56px",
                    display: "flex",
                    flexDirection: "column",
                    alignItems: "center",
                    gap: "6px",
                    padding: "12px 8px",
                    borderRadius: "12px",
                    border: sel ? `2px solid ${m.color}` : "2px solid transparent",
                    background: sel ? `${m.color}22` : "#F7F5F2",
                  }}
                >
                  <span style={{ fontSize: "26px", lineHeight: 1 }}>{m.emoji}</span>
                  <span style={{ fontSize: "11px", fontWeight: sel ? 700 : 500, color: sel ? m.color : "#8B8579" }}>
                    {m.label}
                  </span>
                </button>
              );
            })}
          </div>

          <textarea
            className="note-input"
            value={note}
            onChange={(e) => setNote(e.target.value)}
            placeholder="Anything you want to remember about today? (optional)"
            rows={3}
            maxLength={280}
            style={{
              width: "100%",
              border: "1px solid #E5E1D8",
              borderRadius: "10px",
              padding: "12px 14px",
              fontSize: "14px",
              fontFamily: "inherit",
              color: "#2B2A33",
              background: "#FBFAF8",
              marginBottom: "14px",
            }}
          />

          <div style={{ display: "flex", alignItems: "center", gap: "12px" }}>
            <button className="save-btn" onClick={handleSave} disabled={!selectedMood}
              style={{ background: "#8B7FD1", color: "#FFFFFF", border: "none", borderRadius: "10px", padding: "10px 20px", fontSize: "14px", fontWeight: 600, cursor: "pointer" }}>
              Save entry
            </button>
            {justSaved && <span style={{ fontSize: "13px", color: "#7FB069", fontWeight: 600, animation: "popIn 0.3s ease" }}>✓ Saved</span>}
            {error && <span style={{ fontSize: "13px", color: "#E0735F" }}>{error}</span>}
          </div>
        </section>

        <section>
          <h2 style={{ fontSize: "13px", fontWeight: 600, letterSpacing: "0.06em", textTransform: "uppercase", color: "#A39E91", margin: "0 0 16px" }}>
            All entries
          </h2>

          {loading ? (
            <p style={{ fontSize: "14px", color: "#A39E91" }}>Loading your history…</p>
          ) : entries.length === 0 ? (
            <div style={{ border: "1px dashed #D9D4C9", borderRadius: "12px", padding: "28px 20px", textAlign: "center", color: "#A39E91", fontSize: "14px" }}>
              Get a mood log.
            </div>
          ) : (
            <div style={{ position: "relative", paddingLeft: "20px" }}>
              <div
                style={{
                  position: "absolute",
                  left: "5px",
                  top: "8px",
                  bottom: "8px",
                  width: "2px",
                  background: "linear-gradient(to bottom, " + entries.map((e) => moodById(e.mood).color).join(", ") + ")",
                  opacity: 0.5,
                  borderRadius: "2px",
                }}
              />
              <ul style={{ listStyle: "none", margin: 0, padding: 0 }}>
                {entries.map((entry, i) => {
                  const mood = moodById(entry.mood);
                  const today = isToday(entry.saved_at);
                  return (
                    <li key={entry.id} className="entry-row" style={{ position: "relative", marginBottom: "18px", animationDelay: `${Math.min(i, 8) * 0.04}s` }}>
                      <div style={{ position: "absolute", left: "-20px", top: "6px", width: "12px", height: "12px", borderRadius: "50%", background: mood.color, border: "2px solid #F7F5F2" }} />
                      <div style={{ background: "#FFFFFF", border: today ? `1px solid ${mood.color}` : "1px solid #E5E1D8", borderRadius: "12px", padding: "14px 16px", display: "flex", gap: "12px", alignItems: "flex-start" }}>
                        <span style={{ fontSize: "22px", lineHeight: 1.3 }}>{mood.emoji}</span>
                        <div style={{ flex: 1, minWidth: 0 }}>
                          <div style={{ display: "flex", justifyContent: "space-between", alignItems: "flex-start", gap: "8px" }}>
                            <span style={{ fontSize: "13px", fontWeight: 700, color: mood.color }}>{mood.label}</span>
                            <div style={{ textAlign: "right", lineHeight: 1.35 }}>
                              <div style={{ fontSize: "12px", color: "#A39E91", whiteSpace: "nowrap", fontWeight: 600 }}>{formatTime(entry.saved_at)}</div>
                              <div style={{ fontSize: "11px", color: "#C2BCAE", whiteSpace: "nowrap" }}>{formatFullDate(entry.saved_at)}</div>
                            </div>
                          </div>
                          {entry.note && <p style={{ margin: "4px 0 0", fontSize: "14px", color: "#4A4842", lineHeight: 1.45, wordBreak: "break-word" }}>{entry.note}</p>}
                        </div>
                        <button className="delete-btn" onClick={() => handleDelete(entry.id)} aria-label="Delete entry"
                          style={{ background: "none", border: "none", color: "#A39E91", fontSize: "13px", padding: "2px 4px" }}>
                          ✕
                        </button>
                      </div>
                    </li>
                  );
                })}
              </ul>
            </div>
          )}
        </section>
      </div>
    </div>
  );
}
