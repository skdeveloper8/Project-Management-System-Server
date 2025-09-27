import { Controller, getUserFromHeader } from "../../helper";
import { Request, Response } from "express";
import User from "../../schema/users.model";
import bcrypt from "bcrypt";
import { registerSchema } from "../../validators/user.validators";
import jwt from "jsonwebtoken";

export const RegisterUser = Controller(registerUser);
async function registerUser(req: Request, res: Response) {
  const { success, data } = registerSchema.safeParse(req.body);
  if (!success)
    return res.status(400).json({ message: "Invalid user data", errors: data });

  const { name, email, password } = data;
  const isUserExists = await User.findOne({ email });
  if (isUserExists)
    return res.status(409).json({ message: "User already exists" });

  const hashedPassword = await bcrypt.hash(password, 10);
  await User.create({ name, email, password: hashedPassword });
  return res.status(201).json({ message: "User registered successfully" });
}

export const LoginUser = Controller(loginUser);
async function loginUser(req: Request, res: Response) {
  const { email, password } = req.body as { email: string; password: string };
  const user = await User.findOne({ email });
  if (!user) return res.status(404).json({ message: "User not found" });
  try {
    const isPasswordValid = await bcrypt.compare(password, user.password);
    if (!isPasswordValid) throw Error("Invalid credentials");
  } catch (error) {
    return res.status(401).json({ message: "Internal server error" });
  }

  const accessToken = jwt.sign(
    { id: user._id.toString() },
    process.env.JWT_SECRET || "default_secret",
    { expiresIn: "15m" }
  );

  const refreshToken = jwt.sign(
    { id: user._id.toString() },
    process.env.REFRESH_SECRET || "refresh_secret",
    { expiresIn: "7d" }
  );

  user.refreshToken = refreshToken;
  await user.save();

  res.cookie("refreshToken", refreshToken, {
    httpOnly: true,
    secure: true,
    sameSite: "strict",
    maxAge: 7 * 24 * 60 * 60 * 1000, // 7 days
  });

  return res.json({
    accessToken,
    message: "Login successful",
    email: user.email,
  });
}

export const refreshAccessToken = async (req: Request, res: Response) => {
  const refreshToken = req.cookies?.refreshToken;
  if (!refreshToken) {
    return res.status(401).json({ message: "Refresh token missing" });
  }

  try {
    const decoded = jwt.verify(
      refreshToken,
      process.env.REFRESH_SECRET || "refresh_secret"
    ) as jwt.JwtPayload;

    const user = await User.findById(decoded.id);
    if (!user || user.refreshToken !== refreshToken) {
      return res.status(403).json({ message: "Invalid refresh token" });
    }

    const newAccessToken = jwt.sign(
      { id: user._id.toString() },
      process.env.JWT_SECRET || "default_secret",
      { expiresIn: "15m" }
    );

    return res.status(200).json({ accessToken: newAccessToken });
  } catch (err) {
    console.error("Refresh token error:", err);
    return res
      .status(403)
      .json({ message: "Refresh token expired or invalid" });
  }
};

export const logoutUser = async (req: Request, res: Response) => {
  const userId = getUserFromHeader(req);
  if (userId) {
    const user = await User.findById(userId);
    if (user) {
      user.refreshToken = undefined;
      await user.save();
    }
  }
  res.clearCookie("refreshToken");
  return res.json({ message: "Logged out successfully" });
};
