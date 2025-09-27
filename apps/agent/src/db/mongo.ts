import mongoose from "mongoose";

const uri = process.env.MONGODB_URI || "mongodb://localhost:27017";
let ready: Promise<typeof mongoose> | null = null;

export function connectMongo() {
  if (!ready) {
    ready = mongoose.connect(uri, { dbName: "ai-chat" });
  }
  return ready;
}
