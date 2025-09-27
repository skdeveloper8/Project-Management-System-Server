import { Router } from "express";
import {
  RegisterUser,
  LoginUser,
  logoutUser,
} from "../controllers/user/user.controllers";
import { authenticate } from "../helper";
const router = Router();

router.post("/register", RegisterUser);
router.post("/login", LoginUser);
router.post("/logout", authenticate, logoutUser);

export default router;
