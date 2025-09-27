import mongoose, { InferSchemaType, Schema } from "mongoose";
type ObjectId = mongoose.Types.ObjectId;
const projectSchema = new Schema(
  {
    title: { type: String, required: true },
    description: { type: String, required: true },
    status: {
      type: String,
      enum: ["not started", "active", "completed"],
      default: "not started",
    },
    createdBy: { type: Schema.Types.ObjectId, required: true },
  },
  { timestamps: true }
);

const Project = mongoose.model("Project", projectSchema);
export default Project;

export type Project = InferSchemaType<typeof projectSchema> & {
  _id: ObjectId;
  id: string;
};
