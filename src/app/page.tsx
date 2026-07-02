"use client";

import { useEffect, useRef, useState } from "react";
import Link from "next/link";
import { createClient } from "@/lib/supabase";
import type { PrepTask } from "@/types/prepTask";
import type { SessionNote } from "@/types/sessionNote";

interface SessionItem {
  id: string;
  summary: string;
  start: string;
  end: string;
  studentId: string | null;
  studentName: string | null;
}

export default function Home() {
  const supabase = createClient();
  const [sessions, setSessions] = useState<SessionItem[] | null>(null);
  const [tasksByEvent, setTasksByEvent] = useState<Record<string, PrepTask[]>>({});
  const [lastNoteByStudent, setLastNoteByStudent] = useState<
    Record<string, SessionNote>
  >({});
  const [ownNoteByEvent, setOwnNoteByEvent] = useState<Record<string, SessionNote>>(
    {}
  );
  const [noteDraft, setNoteDraft] = useState<Record<string, string>>({});
  const [savingNote, setSavingNote] = useState<Record<string, boolean>>({});
  const [expanded, setExpanded] = useState<Record<string, boolean>>({});
  const [newTaskLabel, setNewTaskLabel] = useState<Record<string, string>>({});
  const [listening, setListening] = useState<Record<string, boolean>>({});
  const recognitionRef = useRef<any>(null);
  const [error, setError] = useState<string | null>(null);

  async function loadSessions() {
    setError(null);
    try {
      const res = await fetch("/api/sessions");
      const data = await res.json();
      if (!res.ok) throw new Error(data.error ?? "Failed to load sessions");
      const fetchedSessions: SessionItem[] = data.sessions;
      setSessions(fetchedSessions);

      const eventIds = fetchedSessions.map((s) => s.id);
      if (eventIds.length > 0) {
        const { data: tasks } = await supabase
          .from("prep_tasks")
          .select("*")
          .in("calendar_event_id", eventIds);
        const grouped: Record<string, PrepTask[]> = {};
        (tasks ?? []).forEach((t) => {
          grouped[t.calendar_event_id] = [...(grouped[t.calendar_event_id] ?? []), t];
        });
        setTasksByEvent(grouped);
      }

      const studentIds = Array.from(
        new Set(fetchedSessions.map((s) => s.studentId).filter(Boolean))
      ) as string[];

      if (studentIds.length > 0) {
        const { data: notes } = await supabase
          .from("session_notes")
          .select("*")
          .in("student_id", studentIds)
          .order("session_date", { ascending: false });

        const ownByEvent: Record<string, SessionNote> = {};
        const lastByStudent: Record<string, SessionNote> = {};
        (notes ?? []).forEach((note: SessionNote) => {
          if (eventIds.includes(note.calendar_event_id)) {
            ownByEvent[note.calendar_event_id] = note;
          } else if (!lastByStudent[note.student_id]) {
            lastByStudent[note.student_id] = note;
          }
        });
        setOwnNoteByEvent(ownByEvent);
        setLastNoteByStudent(lastByStudent);
      }
    } catch (e) {
      setError(e instanceof Error ? e.message : "Something went wrong");
      setSessions([]);
    }
  }

  useEffect(() => {
    loadSessions();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  function toggleExpand(eventId: string) {
    setExpanded((prev) => ({ ...prev, [eventId]: !prev[eventId] }));
  }

  async function addTask(session: SessionItem) {
    const label = (newTaskLabel[session.id] ?? "").trim();
    if (!label || !session.studentId) return;
    const { error } = await supabase.from("prep_tasks").insert({
      student_id: session.studentId,
      calendar_event_id: session.id,
      label,
      done: false,
    });
    if (!error) {
      setNewTaskLabel((prev) => ({ ...prev, [session.id]: "" }));
      loadSessions();
    }
  }

  async function toggleTask(task: PrepTask) {
    await supabase.from("prep_tasks").update({ done: !task.done }).eq("id", task.id);
    loadSessions();
  }

  async function deleteTask(task: PrepTask) {
    await supabase.from("prep_tasks").delete().eq("id", task.id);
    loadSessions();
  }

  function toggleListening(eventId: string) {
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    const w = window as any;
    const SpeechRecognition = w.SpeechRecognition ?? w.webkitSpeechRecognition;
    if (!SpeechRecognition) {
      alert("Speech recognition is not supported in this browser. Try Safari on iPhone or Chrome on Android.");
      return;
    }
    if (listening[eventId]) {
      recognitionRef.current?.stop();
      recognitionRef.current = null;
      setListening((prev) => ({ ...prev, [eventId]: false }));
      return;
    }
    const recognition = new SpeechRecognition();
    recognition.continuous = false;
    recognition.interimResults = false;
    recognition.lang = "en-US";
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    recognition.onresult = (e: any) => {
      const transcript = Array.from(e.results)
        .slice(e.resultIndex)
        .map((r: any) => (r as any)[0].transcript)
        .join(" ");
      setNoteDraft((prev) => ({
        ...prev,
        [eventId]: ((prev[eventId] ?? "") + " " + transcript).trimStart(),
      }));
    };
    recognition.onend = () => {
      recognitionRef.current = null;
      setListening((prev) => ({ ...prev, [eventId]: false }));
    };
    recognition.onerror = () => {
      recognitionRef.current = null;
      setListening((prev) => ({ ...prev, [eventId]: false }));
    };
    recognition.start();
    recognitionRef.current = recognition;
    setListening((prev) => ({ ...prev, [eventId]: true }));
  }

  async function saveNote(session: SessionItem) {
    if (!session.studentId) return;
    const text = (noteDraft[session.id] ?? "").trim();
    if (!text) return;
    setSavingNote((prev) => ({ ...prev, [session.id]: true }));
    await supabase.from("session_notes").upsert(
      {
        student_id: session.studentId,
        calendar_event_id: session.id,
        session_date: session.start,
        notes: text,
      },
      { onConflict: "calendar_event_id" }
    );
    setSavingNote((prev) => ({ ...prev, [session.id]: false }));
    loadSessions();
  }

  if (sessions === null) {
    return <p className="text-sm text-muted">Loading sessions...</p>;
  }

  if (error) {
    return (
      <div className="space-y-2">
        <h1 className="text-xl font-semibold">Upcoming</h1>
        <p className="text-sm text-red-400">{error}</p>
        <p className="text-sm text-muted">
          Make sure Google Calendar is connected in{" "}
          <Link href="/settings" className="text-accent hover:text-accent-dim">
            Settings
          </Link>
          .
        </p>
      </div>
    );
  }

  const grouped = groupByDay(sessions);

  return (
    <div className="space-y-6">
      <h1 className="text-xl font-semibold">Upcoming</h1>

      {sessions.length === 0 && (
        <p className="text-sm text-muted">No sessions in the next 3 days.</p>
      )}

      {Object.entries(grouped).map(([day, daySessions]) => (
        <div key={day} className="space-y-2">
          <h2 className="text-sm font-medium text-muted">{day}</h2>
          <ul className="space-y-2">
            {daySessions.map((session) => {
              const tasks = tasksByEvent[session.id] ?? [];
              const prepped = tasks.length > 0 && tasks.every((t) => t.done);
              const isExpanded = !!expanded[session.id];
              const lastNote = session.studentId
                ? lastNoteByStudent[session.studentId]
                : undefined;
              const ownNote = ownNoteByEvent[session.id];

              return (
                <li
                  key={session.id}
                  className="rounded-lg border border-card-border bg-card p-4"
                >
                  <button
                    onClick={() => toggleExpand(session.id)}
                    className="w-full flex items-center justify-between text-left"
                  >
                    <div>
                      <p className="font-medium">{session.summary}</p>
                      <p className="text-sm text-muted">
                        {formatTime(session.start)} – {formatTime(session.end)}
                        {!session.studentId && " · no matching student"}
                      </p>
                    </div>
                    <span
                      className={`text-xs rounded-full px-2 py-1 shrink-0 ${
                        prepped
                          ? "bg-accent/20 text-accent"
                          : "bg-card-border text-muted"
                      }`}
                    >
                      {prepped ? "Prepped" : "Not prepped"}
                    </span>
                  </button>

                  {!isExpanded && lastNote && (
                    <p className="mt-2 text-sm text-muted line-clamp-1">
                      Last time: {lastNote.notes}
                    </p>
                  )}

                  {isExpanded && (
                    <div className="mt-3 pt-3 border-t border-card-border space-y-3">
                      {!session.studentId ? (
                        <p className="text-sm text-muted">
                          No student matched this event&apos;s title — add a
                          student whose name appears in the event title to
                          track prep here.
                        </p>
                      ) : (
                        <>
                          {lastNote && (
                            <div className="rounded-md bg-background border border-card-border p-2">
                              <p className="text-xs text-muted mb-1">
                                Last time (
                                {new Date(lastNote.session_date).toLocaleDateString(
                                  undefined,
                                  { month: "short", day: "numeric" }
                                )}
                                )
                              </p>
                              <p className="text-sm">{lastNote.notes}</p>
                            </div>
                          )}

                          {tasks.length === 0 && (
                            <p className="text-sm text-muted">
                              No prep items yet.
                            </p>
                          )}
                          <ul className="space-y-1">
                            {tasks.map((task) => (
                              <li
                                key={task.id}
                                className="flex items-center gap-2 text-sm"
                              >
                                <input
                                  type="checkbox"
                                  checked={task.done}
                                  onChange={() => toggleTask(task)}
                                  className="accent-accent"
                                />
                                <span
                                  className={
                                    task.done
                                      ? "line-through text-muted flex-1"
                                      : "flex-1"
                                  }
                                >
                                  {task.label}
                                </span>
                                <button
                                  onClick={() => deleteTask(task)}
                                  className="text-red-400 hover:text-red-300 text-xs"
                                >
                                  Remove
                                </button>
                              </li>
                            ))}
                          </ul>
                          <div className="flex gap-2 pt-1">
                            <input
                              type="text"
                              value={newTaskLabel[session.id] ?? ""}
                              onChange={(e) =>
                                setNewTaskLabel((prev) => ({
                                  ...prev,
                                  [session.id]: e.target.value,
                                }))
                              }
                              onKeyDown={(e) => {
                                if (e.key === "Enter") addTask(session);
                              }}
                              placeholder="Add prep item..."
                              className="flex-1 rounded-md border border-card-border bg-background px-2 py-1 text-sm focus:outline-none focus:border-accent"
                            />
                            <button
                              onClick={() => addTask(session)}
                              className="rounded-md bg-accent text-background px-2 py-1 text-sm font-medium hover:bg-accent-dim"
                            >
                              Add
                            </button>
                          </div>

                          <div className="pt-2 border-t border-card-border space-y-1">
                            <p className="text-xs text-muted">
                              Session notes (what happened this session)
                            </p>
                            <textarea
                              value={
                                noteDraft[session.id] ?? ownNote?.notes ?? ""
                              }
                              onChange={(e) =>
                                setNoteDraft((prev) => ({
                                  ...prev,
                                  [session.id]: e.target.value,
                                }))
                              }
                              rows={2}
                              placeholder="What did you cover? How did it go?"
                              className="w-full rounded-md border border-card-border bg-background px-2 py-1.5 text-sm focus:outline-none focus:border-accent"
                            />
                            <div className="flex gap-2">
                              <button
                                onClick={() => toggleListening(session.id)}
                                disabled={listening[session.id]}
                                className={`rounded-md border px-2 py-1 text-xs font-medium ${
                                  listening[session.id]
                                    ? "border-red-400 text-red-400 animate-pulse"
                                    : "border-card-border text-muted hover:text-foreground"
                                }`}
                                title="Dictate notes"
                              >
                                {listening[session.id] ? "🎙 Listening..." : "🎙 Dictate"}
                              </button>
                              <button
                                onClick={() => saveNote(session)}
                                disabled={savingNote[session.id]}
                                className="rounded-md border border-card-border px-2 py-1 text-xs text-accent hover:text-accent-dim disabled:opacity-50"
                              >
                                {savingNote[session.id]
                                  ? "Saving..."
                                  : ownNote
                                  ? "Update notes"
                                  : "Save notes"}
                              </button>
                            </div>
                          </div>
                        </>
                      )}
                    </div>
                  )}
                </li>
              );
            })}
          </ul>
        </div>
      ))}
    </div>
  );
}

function groupByDay(sessions: SessionItem[]) {
  const groups: Record<string, SessionItem[]> = {};
  for (const s of sessions) {
    const day = new Date(s.start).toLocaleDateString(undefined, {
      weekday: "long",
      month: "short",
      day: "numeric",
    });
    groups[day] = [...(groups[day] ?? []), s];
  }
  return groups;
}

function formatTime(iso: string) {
  return new Date(iso).toLocaleTimeString(undefined, {
    hour: "numeric",
    minute: "2-digit",
  });
}
