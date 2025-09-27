import { Request, Response, NextFunction } from "express";
import { isValidObjectId } from "mongoose";
import jwt from "jsonwebtoken";

export const authenticate = (
  req: Request,
  res: Response,
  next: NextFunction
) => {
  const authHeader = req.headers["authorization"];
  const token = authHeader?.split(" ")[1]; // Bearer <token>

  if (!token) return res.status(401).json({ message: "Unauthorized" });

  try {
    const decoded = jwt.verify(
      token,
      process.env.JWT_SECRET || "default_secret"
    ) as jwt.JwtPayload;
    req.headers["x_user_id"] = decoded.id;
    next();
  } catch (err) {
    return res.status(401).json({ message: "Access token expired or invalid" });
  }
};

type AsyncController = (
  req: Request,
  res: Response,
  next: NextFunction
) => Promise<void | Response | undefined>;

export const Controller = function (asyncFn: AsyncController) {
  return (req: Request, res: Response, next: NextFunction) =>
    asyncFn(req, res, next).catch(next);
};

export function getUserFromHeader(req: Request) {
  const userId = req.headers["x_user_id"] as string;
  if (!userId) throw Error("User ID header missing");
  if (!isValidObjectId(userId)) throw Error("Invalid User ID");
  return userId;
}

export const requestLogger = (
  req: Request,
  res: Response,
  next: NextFunction
) => {
  const start = Date.now();

  // Listen for when the response finishes
  res.on("finish", () => {
    const duration = Date.now() - start;
    console.log(
      `${req.method} ${req.originalUrl} ${res.statusCode} - ${duration}ms`
    );
  });

  next();
};
