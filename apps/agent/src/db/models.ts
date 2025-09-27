import mongoose, { Schema } from "mongoose";

export const UserSchema = new Schema({
  userId: { type: String, index: true },  // Clerk or demo id
  displayName: String,
  orgId: String,
  roles: [String]
}, { timestamps: true });
export const UserModel = mongoose.model("User", UserSchema);

export const RoomSchema = new Schema({
  roomId: { type: String, unique: true },
  name: String,
  orgId: String,
  participants: [String],   // userIds
  teacherPresent: { type: Boolean, default: true } // keep field for later
}, { timestamps: true });
export const RoomModel = mongoose.model("Room", RoomSchema);

export const MessageSchema = new Schema({
  roomId: { type: String, index: true },
  authorType: { type: String, enum: ["User","Agent"] },
  authorId: String,
  text: String,
  ts: { type: Number, index: true }
}, { timestamps: true });
export const MessageModel = mongoose.model("Message", MessageSchema);
