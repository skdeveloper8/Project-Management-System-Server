import {
  GetAllTasks,
  CreateTask,
  DeleteTask,
  UpdateTask,
  GetTask,
} from "../controllers/task/tasks.controller";
import { Router } from "express";
const router = Router();

router.get("/", GetAllTasks);
router.get("/:id", GetTask);
router.post("/", CreateTask);
router.patch("/:id", UpdateTask);
router.delete("/:id", DeleteTask);
export default router;
