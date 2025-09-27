import mongoose, { InferSchemaType, Schema } from "mongoose";
type ObjectId = mongoose.Types.ObjectId;
const taskSchema = new Schema(
  {
    title: { type: String, required: true, unique: true },
    description: { type: String, required: true },
    status: {
      type: String,
      enum: ["todo", "in-progress", "done"],
      default: "todo",
    },
    dueDate: { type: Date, required: true },
    projectId: { type: Schema.Types.ObjectId },
    createdBy: { type: Schema.Types.ObjectId, required: true },
  },
  { timestamps: true }
);

const Task = mongoose.model("Task", taskSchema);
export default Task;

export type Task = InferSchemaType<typeof taskSchema> & {
  _id: ObjectId;
  id: string;
};
