"use client";

import { useEffect, useState } from "react";
import { createClient } from "@/lib/supabase";
import type { Student, StudentInput } from "@/types/student";

const emptyForm: StudentInput = {
  name: "",
  exam_type: "",
  location: "",
  parent_contact: "",
  goals: "",
  focus_areas: "",
  watch_points: "",
  strengths: "",
};

export default function StudentsPage() {
  const supabase = createClient();
  const [students, setStudents] = useState<Student[]>([]);
  const [loading, setLoading] = useState(true);
  const [editingId, setEditingId] = useState<string | null>(null);
  const [showForm, setShowForm] = useState(false);
  const [form, setForm] = useState<StudentInput>(emptyForm);
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState<string | null>(null);

  async function loadStudents() {
    setLoading(true);
    const { data, error } = await supabase
      .from("students")
      .select("*")
      .order("name", { ascending: true });
    if (error) {
      setError(error.message);
    } else {
      setStudents(data ?? []);
    }
    setLoading(false);
  }

  useEffect(() => {
    loadStudents();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  function startAdd() {
    setEditingId(null);
    setForm(emptyForm);
    setShowForm(true);
  }

  function startEdit(student: Student) {
    setEditingId(student.id);
    setForm({
      name: student.name,
      exam_type: student.exam_type ?? "",
      location: student.location ?? "",
      parent_contact: student.parent_contact ?? "",
      goals: student.goals ?? "",
      focus_areas: student.focus_areas ?? "",
      watch_points: student.watch_points ?? "",
      strengths: student.strengths ?? "",
    });
    setShowForm(true);
  }

  function cancelForm() {
    setShowForm(false);
    setEditingId(null);
    setForm(emptyForm);
    setError(null);
  }

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    if (!form.name.trim()) {
      setError("Name is required.");
      return;
    }
    setSaving(true);
    setError(null);

    if (editingId) {
      const { error } = await supabase
        .from("students")
        .update({ ...form, updated_at: new Date().toISOString() })
        .eq("id", editingId);
      if (error) setError(error.message);
    } else {
      const { error } = await supabase.from("students").insert(form);
      if (error) setError(error.message);
    }

    setSaving(false);
    if (!error) {
      cancelForm();
      loadStudents();
    }
  }

  async function handleDelete(id: string) {
    if (!confirm("Delete this student? This cannot be undone.")) return;
    const { error } = await supabase.from("students").delete().eq("id", id);
    if (error) {
      setError(error.message);
    } else {
      loadStudents();
    }
  }

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <h1 className="text-xl font-semibold">Students</h1>
        {!showForm && (
          <button
            onClick={startAdd}
            className="rounded-md bg-accent text-background px-3 py-1.5 text-sm font-medium hover:bg-accent-dim"
          >
            + Add student
          </button>
        )}
      </div>

      {showForm && (
        <form
          onSubmit={handleSubmit}
          className="rounded-lg border border-card-border bg-card p-4 space-y-3"
        >
          <h2 className="text-sm font-medium text-muted">
            {editingId ? "Edit student" : "New student"}
          </h2>

          {error && <p className="text-sm text-red-400">{error}</p>}

          <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
            <Field
              label="Name"
              value={form.name}
              onChange={(v) => setForm({ ...form, name: v })}
              required
            />
            <Field
              label="Exam type"
              value={form.exam_type ?? ""}
              onChange={(v) => setForm({ ...form, exam_type: v })}
            />
            <Field
              label="Location"
              value={form.location ?? ""}
              onChange={(v) => setForm({ ...form, location: v })}
            />
            <Field
              label="Parent contact"
              value={form.parent_contact ?? ""}
              onChange={(v) => setForm({ ...form, parent_contact: v })}
            />
          </div>

          <TextAreaField
            label="Goals"
            value={form.goals ?? ""}
            onChange={(v) => setForm({ ...form, goals: v })}
          />
          <TextAreaField
            label="Focus areas"
            value={form.focus_areas ?? ""}
            onChange={(v) => setForm({ ...form, focus_areas: v })}
          />
          <TextAreaField
            label="Watch points"
            value={form.watch_points ?? ""}
            onChange={(v) => setForm({ ...form, watch_points: v })}
          />
          <TextAreaField
            label="Strengths"
            value={form.strengths ?? ""}
            onChange={(v) => setForm({ ...form, strengths: v })}
          />

          <div className="flex gap-2 pt-2">
            <button
              type="submit"
              disabled={saving}
              className="rounded-md bg-accent text-background px-3 py-1.5 text-sm font-medium hover:bg-accent-dim disabled:opacity-50"
            >
              {saving ? "Saving..." : editingId ? "Save changes" : "Add student"}
            </button>
            <button
              type="button"
              onClick={cancelForm}
              className="rounded-md border border-card-border px-3 py-1.5 text-sm text-muted hover:text-foreground"
            >
              Cancel
            </button>
          </div>
        </form>
      )}

      {loading ? (
        <p className="text-sm text-muted">Loading...</p>
      ) : students.length === 0 ? (
        <p className="text-sm text-muted">No students yet. Add one to get started.</p>
      ) : (
        <ul className="space-y-2">
          {students.map((student) => (
            <li
              key={student.id}
              className="rounded-lg border border-card-border bg-card p-4 flex items-start justify-between gap-4"
            >
              <div>
                <p className="font-medium">{student.name}</p>
                <p className="text-sm text-muted">
                  {[student.exam_type, student.location]
                    .filter(Boolean)
                    .join(" · ") || "No details yet"}
                </p>
              </div>
              <div className="flex gap-2 shrink-0">
                <button
                  onClick={() => startEdit(student)}
                  className="text-sm text-accent hover:text-accent-dim"
                >
                  Edit
                </button>
                <button
                  onClick={() => handleDelete(student.id)}
                  className="text-sm text-red-400 hover:text-red-300"
                >
                  Delete
                </button>
              </div>
            </li>
          ))}
        </ul>
      )}
    </div>
  );
}

function Field({
  label,
  value,
  onChange,
  required,
}: {
  label: string;
  value: string;
  onChange: (v: string) => void;
  required?: boolean;
}) {
  return (
    <label className="block text-sm">
      <span className="text-muted">{label}</span>
      <input
        type="text"
        value={value}
        onChange={(e) => onChange(e.target.value)}
        required={required}
        className="mt-1 w-full rounded-md border border-card-border bg-background px-2 py-1.5 text-foreground focus:outline-none focus:border-accent"
      />
    </label>
  );
}

function TextAreaField({
  label,
  value,
  onChange,
}: {
  label: string;
  value: string;
  onChange: (v: string) => void;
}) {
  return (
    <label className="block text-sm">
      <span className="text-muted">{label}</span>
      <textarea
        value={value}
        onChange={(e) => onChange(e.target.value)}
        rows={2}
        className="mt-1 w-full rounded-md border border-card-border bg-background px-2 py-1.5 text-foreground focus:outline-none focus:border-accent"
      />
    </label>
  );
}
