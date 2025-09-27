import { Router } from "express";
import user from "./user.routes";
import project from "./project.routes";
import task from "./task.routes";
import { authenticate } from "../helper";
import { refreshAccessToken } from "../controllers/user/user.controllers";
const routes = Router();

//user routes
routes.use("/user", user);
// token refresh
routes.get("/refresh", refreshAccessToken);
// protected routes
routes.use(authenticate);
// project
routes.use("/project", project);
// todo
routes.use("/task", task);
export default routes;
