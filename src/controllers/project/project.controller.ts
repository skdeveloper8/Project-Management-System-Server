import { Controller, getUserFromHeader } from "../../helper";
import { Request, Response } from "express";
import Project from "../../schema/projects.model";
import mongoose from "mongoose";
import Task from "../../schema/task.model";
import redisClient from "../../helper/redis/redisClient";

const ObjectId = mongoose.Types.ObjectId;
type ObjectId = mongoose.Types.ObjectId;

export const CreateProject = Controller(createProject);
async function createProject(req: Request, res: Response) {
  const {
    title,
    description,
    status,
  }: {
    title: string;
    description: string;
    status: "not started" | "active" | "completed";
  } = req.body;
  const userId = getUserFromHeader(req);

  const isTitleTaken = await Project.findOne({
    title: new RegExp(title, "i"),
    createdBy: userId,
  });
  if (isTitleTaken)
    return res.status(409).json({ message: "Project title already exists" });

  const project = await Project.create({
    title,
    description,
    status,
    createdBy: userId,
  });

  await redisClient.del(`projects:${userId}`);

  return res
    .status(201)
    .json({ message: "Project created successfully", project });
}

export const GetAllProjects = Controller(getProjects);
async function getProjects(req: Request, res: Response) {
  const userId = getUserFromHeader(req);
  const cacheKey = `projects:${userId}`;

  const cachedProjects = await redisClient.get(cacheKey);
  if (cachedProjects) {
    return res
      .status(200)
      .json({ projects: JSON.parse(cachedProjects), source: "cache" });
  }

  const projects = await Project.aggregate([
    { $match: { createdBy: new ObjectId(userId) } },
    {
      $lookup: {
        from: "users",
        localField: "createdBy",
        foreignField: "_id",
        as: "user",
        pipeline: [{ $project: { name: true, _id: false } }],
      },
    },
    { $sort: { createdAt: -1 } },
    {
      $project: {
        title: true,
        description: true,
        status: true,
        createdBy: {
          $arrayElemAt: ["$user.name", 0],
        },
        updatedAt: true,
        createdAt: true,
      },
    },
  ]);

  await redisClient.setEx(cacheKey, 600, JSON.stringify(projects));

  return res.status(200).json({ projects, source: "db" });
}

export const UpdateProject = Controller(updateProject);
async function updateProject(req: Request, res: Response) {
  const { id } = req.params;
  const {
    title,
    description,
    status,
  }: {
    title: string;
    description: string;
    status: "not started" | "active" | "completed";
  } = req.body;

  const updated = await Project.findByIdAndUpdate(
    id,
    { title, description, status },
    { new: true }
  );
  if (!updated) return res.status(404).json({ message: "Project not found" });

  const [project] = await Project.aggregate([
    { $match: { _id: new ObjectId(id) } },
    {
      $lookup: {
        from: "users",
        localField: "createdBy",
        foreignField: "_id",
        as: "creator",
        pipeline: [{ $project: { name: 1, _id: 0 } }],
      },
    },
    { $unwind: { path: "$creator", preserveNullAndEmptyArrays: true } },
    { $set: { createdBy: "$creator.name" } },
    {
      $lookup: {
        from: "tasks",
        localField: "_id",
        foreignField: "projectId",
        as: "tasks",
        pipeline: [
          {
            $lookup: {
              from: "users",
              localField: "createdBy",
              foreignField: "_id",
              as: "user",
              pipeline: [{ $project: { name: 1, _id: 0 } }],
            },
          },
          { $unwind: { path: "$user", preserveNullAndEmptyArrays: true } },
          {
            $project: {
              title: 1,
              description: 1,
              status: 1,
              createdAt: 1,
              updatedAt: 1,
              dueDate: 1,
            },
          },
        ],
      },
    },
    {
      $project: {
        title: 1,
        description: 1,
        status: 1,
        createdBy: 1,
        createdAt: 1,
        updatedAt: 1,
        tasks: 1,
      },
    },
  ]);

  await redisClient.del(`projects:${updated.createdBy.toString()}`);
  await redisClient.del(`project:${id}`);

  return res.status(200).json({
    message: "Project updated successfully",
    project,
  });
}

export const DeleteProjects = Controller(deleteProjects);
async function deleteProjects(req: Request, res: Response) {
  const { ids } = req.body as { ids: string[] };
  const createdBy = getUserFromHeader(req);
  const projectIds = (ids ?? []).map((id) => new ObjectId(id));

  await Project.deleteMany({ _id: { $in: projectIds }, createdBy });
  await Task.deleteMany({ projectId: { $in: projectIds }, createdBy });

  await redisClient.del(`projects:${createdBy}`);
  for (const id of ids) await redisClient.del(`project:${id}`);

  return res
    .status(200)
    .json({ message: "Projects and its tasks deleted successfully" });
}

export const GetProjectDetails = Controller(getProjectDetails);
async function getProjectDetails(req: Request, res: Response) {
  const { id } = req.params;
  const userId = getUserFromHeader(req);
  const cacheKey = `project:${id}`;

  const cachedProject = await redisClient.get(cacheKey);
  if (cachedProject) {
    return res
      .status(200)
      .json({ project: JSON.parse(cachedProject), source: "cache" });
  }

  const [projectWithTasks] = await Project.aggregate([
    {
      $match: { _id: new ObjectId(id), createdBy: new ObjectId(userId) },
    },
    {
      $lookup: {
        from: "tasks",
        localField: "_id",
        foreignField: "projectId",
        as: "tasks",
      },
    },
    {
      $lookup: {
        from: "users",
        localField: "createdBy",
        foreignField: "_id",
        as: "users",
        pipeline: [{ $project: { name: true, _id: false } }],
      },
    },
    { $set: { createdBy: { $arrayElemAt: ["$users.name", 0] } } },
  ]);

  if (!projectWithTasks)
    return res.status(404).json({ message: "Project not found" });

  await redisClient.setEx(cacheKey, 60, JSON.stringify(projectWithTasks));

  return res.status(200).json({ project: projectWithTasks, source: "db" });
}
