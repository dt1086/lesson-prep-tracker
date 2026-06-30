export interface Student {
  id: string;
  name: string;
  exam_type: string | null;
  location: string | null;
  parent_contact: string | null;
  goals: string | null;
  focus_areas: string | null;
  watch_points: string | null;
  strengths: string | null;
  created_at: string;
  updated_at: string;
}

export type StudentInput = Omit<Student, "id" | "created_at" | "updated_at">;
