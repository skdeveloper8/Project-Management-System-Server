import zod from "zod";
export const registerSchema = zod.object({
  name: zod.string().min(2).max(100),
  email: zod.string(),
  password: zod.string().min(6).max(100),
});
