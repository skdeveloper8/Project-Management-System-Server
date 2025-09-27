import zod from "zod";
export const createTaskSchema = zod.object({
  title: zod.string().min(1, "Title is required"),
  description: zod.string().min(1, "Description is required"),
  status: zod.enum(["todo", "in-progress", "done"]),
  dueDate: zod.string().min(1, "Due date is required"),
  createdBy: zod.string().optional(),
  projectId: zod.string().optional(),
});
