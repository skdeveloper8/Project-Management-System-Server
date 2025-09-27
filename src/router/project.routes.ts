import {
  CreateProject,
  DeleteProjects,
  GetAllProjects,
  GetProjectDetails,
  UpdateProject,
} from "../controllers/project/project.controller";
import { Router } from "express";
const router = Router();

router.get("/", GetAllProjects);
router.get("/:id", GetProjectDetails);
router.post("/", CreateProject);
router.patch("/:id", UpdateProject);
router.delete("/", DeleteProjects);

export default router;
