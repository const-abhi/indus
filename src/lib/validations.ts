import { z } from "zod";

// Roll number format: YYDDNNN — 7 digits total
// YY = series (e.g. 22), DD = dept code (e.g. 03 for CSE), NNN = serial (e.g. 033)
const ROLL_NUMBER_REGEX = /^\d{7}$/;

export const signUpSchema = z
  .object({
    name: z.string().min(2, "Name must be at least 2 characters"),
    email: z.string().email("Invalid email address"),
    password: z.string().min(8, "Password must be at least 8 characters"),
    role: z.enum(["STUDENT", "TEACHER"]),
    rollNumber: z.string().optional(),
  })
  .refine(
    (data) => {
      if (data.role === "STUDENT") {
        return !!data.rollNumber && data.rollNumber.trim().length > 0;
      }
      return true;
    },
    { message: "Roll number is required for students", path: ["rollNumber"] }
  )
  .refine(
    (data) => {
      if (data.role === "STUDENT" && data.rollNumber) {
        return ROLL_NUMBER_REGEX.test(data.rollNumber.trim());
      }
      return true;
    },
    {
      message: "Roll number must be exactly 7 digits (e.g. 2203033)",
      path: ["rollNumber"],
    }
  );

export const signInSchema = z.object({
  email: z.string().email("Invalid email address"),
  password: z.string().min(1, "Password is required"),
});

export const createCourseSchema = z.object({
  name: z.string().min(3, "Course name must be at least 3 characters").max(80),
  description: z.string().max(400).optional(),
});

// Join course: code only — name and roll pulled from user account
export const joinCourseSchema = z.object({
  code: z.string().length(6, "Course code must be exactly 6 characters"),
});

const attachmentSchema = z.array(
  z.object({
    type: z.enum(["file", "link"]),
    url: z.string().url(),
    name: z.string().min(1),
  })
);

export const createTaskSchema = z.object({
  title: z.string().min(3, "Title must be at least 3 characters").max(120),
  description: z.string().min(5, "Description must be at least 5 characters"),
  postType: z.enum(["ASSIGNMENT", "ANNOUNCEMENT"]).default("ASSIGNMENT"),
  dueDate: z.string().optional(),
  evaluationDeadline: z.string().optional(),
  courseId: z.string().cuid("Invalid course"),
  attachments: attachmentSchema.optional(),
});

export const submitTaskSchema = z.object({
  taskId: z.string().cuid(),
  fileUrl: z.string().url("Invalid file URL"),
  fileName: z.string().min(1),
  fileSize: z.number().optional(),
  notes: z.string().max(500).optional(),
});

export const evaluateSchema = z.object({
  evaluations: z.array(
    z.object({
      submissionId: z.string().cuid(),
      evalScore: z.number().int().min(0).max(100),
    })
  ),
});

export type SignUpInput = z.infer<typeof signUpSchema>;
export type SignInInput = z.infer<typeof signInSchema>;
export type CreateCourseInput = z.infer<typeof createCourseSchema>;
export type JoinCourseInput = z.infer<typeof joinCourseSchema>;
export type CreateTaskInput = z.infer<typeof createTaskSchema>;
export type SubmitTaskInput = z.infer<typeof submitTaskSchema>;
export type EvaluateInput = z.infer<typeof evaluateSchema>;
export type Attachment = { type: "file" | "link"; url: string; name: string };
