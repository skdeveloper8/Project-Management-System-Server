import { Controller, getUserFromHeader } from "../../helper";
import { Request, Response } from "express";
import Task from "../../schema/task.model";
import { createTaskSchema } from "../../validators/task.validators";
import redisClient from "../../helper/redis/redisClient";

export const CreateTask = Controller(createTask);
async function createTask(req: Request, res: Response) {
  const { success, data } = createTaskSchema.safeParse(req.body);
  if (!success)
    return res.status(400).json({ message: "Invalid task data", errors: data });
  const userId = getUserFromHeader(req);
  const isTitleTaken = await Task.findOne({
    title: new RegExp(data.title, "i"),
    createdBy: userId,
  });
  if (isTitleTaken)
    return res.status(409).json({ message: "Task title already exists" });

  const task = await Task.create({
    ...data,
    createdBy: userId,
  });
  await redisClient.del(`projects:${userId}`);
  if (task?.projectId)
    await redisClient.del(`project:${task.projectId.toString()}`);

  return res.status(201).json({ message: "Task created successfully", task });
}

export const GetTask = Controller(getTask);
async function getTask(req: Request, res: Response) {
  const { id } = req.params;
  const userId = getUserFromHeader(req);
  const task = await Task.findOne({ _id: id, createdBy: userId });
  if (!task) return res.status(404).json({ message: "Task not found" });
  return res.status(200).json({ task });
}

export const GetAllTasks = Controller(getTasks);
async function getTasks(req: Request, res: Response) {
  const userId = getUserFromHeader(req);
  const tasks = await Task.find({ createdBy: userId });
  return res.status(200).json({ tasks });
}

export const UpdateTask = Controller(updateTask);
async function updateTask(req: Request, res: Response) {
  const { id } = req.params;
  const userId = getUserFromHeader(req);
  const {
    title,
    description,
    status,
    dueDate,
  }: {
    title: string;
    description: string;
    status: "not started" | "active" | "completed";
    dueDate: Date;
  } = req.body;

  const task = await Task.findOneAndUpdate(
    { _id: id, createdBy: userId },
    { $set: { title, description, status, dueDate } },
    { new: true }
  );
  if (!task) return res.status(404).json({ message: "Task not found" });
  await redisClient.del(`projects:${userId}`);
  if (task?.projectId)
    await redisClient.del(`project:${task.projectId.toString()}`);

  return res.status(200).json({ message: "Task updated successfully", task });
}

export const DeleteTask = Controller(deleteTask);
async function deleteTask(req: Request, res: Response) {
  const { id } = req.params;
  const task = await Task.findByIdAndDelete(id);
  if (!task) return res.status(404).json({ message: "Task not found" });
  await redisClient.del(`projects:${task.createdBy.toString()}`);
  if (task?.projectId)
    await redisClient.del(`project:${task.projectId.toString()}`);
  return res.status(200).json({ message: "Task deleted successfully" });
}
