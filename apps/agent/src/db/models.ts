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

// Add Thread and ThreadMessage schemas
export const ThreadSchema = new Schema({
  threadId: { type: String, unique: true },        // e.g. "thr_xxx"
  roomId:   { type: String, index: true },
  name:     String,
  visibility:{ type: String, enum: ["public","private"], default: "public" },
  createdBy:{ type: String },                      // userId or "facilitator"
}, { timestamps: true });
export const ThreadModel = mongoose.model("Thread", ThreadSchema);

export const ThreadMessageSchema = new Schema({
  threadId:   { type: String, index: true },
  roomId:     { type: String, index: true },
  authorType: { type: String, enum: ["User","Agent"] },
  authorId:   String,
  text:       String,
  ts:         { type: Number, index: true }
}, { timestamps: true });
export const ThreadMessageModel = mongoose.model("ThreadMessage", ThreadMessageSchema);

// DocAnalysis schema for storing file analysis results
export const DocAnalysisSchema = new Schema({
  fileId: { type: String, index: true },
  roomId: { type: String, index: true },
  analysis: Schema.Types.Mixed
}, { timestamps: true });
export const DocAnalysisModel = mongoose.model("DocAnalysis", DocAnalysisSchema);

// RoomSummary schema for storing room summaries
export const RoomSummarySchema = new Schema({
  roomId: { type: String, index: true },
  threadId: { type: String, index: true },
  type: { type: String, enum: ["welcome", "rolling", "thread"] },
  ts: { type: Number, index: true },
  text: String,
  generatedBy: { type: String, default: "SummarizerAgent" }
}, { timestamps: true });
export const RoomSummaryModel = mongoose.model("RoomSummary", RoomSummarySchema);
