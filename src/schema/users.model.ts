import mongoose, { InferSchemaType, Schema } from "mongoose";
type ObjectId = mongoose.Types.ObjectId;
const userSchema = new Schema({
  name: { type: String, required: true },
  email: { type: String, required: true, unique: true },
  password: { type: String, required: true },
  refreshToken: { type: String },
});

const User = mongoose.model("User", userSchema);
export default User;

export type User = InferSchemaType<typeof userSchema> & {
  _id: ObjectId;
  id: string;
};
