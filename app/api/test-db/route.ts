import { connectToDatabase } from "@/lib/db";
import mongoose from "mongoose";
import { NextResponse } from "next/server";

export async function GET() {
  const uri = process.env.MONGODB_URI;

  if (!uri) {
    return NextResponse.json(
      {
        status: "error",
        message: "MONGODB_URI is not set in .env.local",
      },
      { status: 500 }
    );
  }

  // Mask credentials if present
  const maskedUri = uri.replace(/\/\/([^:]+):([^@]+)@/, "//$1:****@");

  try {
    const startTime = Date.now();
    await connectToDatabase();
    const pingTime = Date.now() - startTime;

    const dbState = mongoose.connection.readyState;
    const stateMap: Record<number, string> = {
      0: "disconnected",
      1: "connected",
      2: "connecting",
      3: "disconnecting",
    };

    return NextResponse.json({
      status: "success",
      message: "Successfully connected to MongoDB!",
      connection: {
        state: stateMap[dbState] || "unknown",
        database: mongoose.connection.name,
        host: mongoose.connection.host,
        pingMs: pingTime,
        targetUri: maskedUri,
      },
    });
  } catch (error: any) {
    console.error("MongoDB test connection failed:", error);
    return NextResponse.json(
      {
        status: "error",
        message: "Failed to connect to MongoDB",
        error: error?.message || "Unknown error",
        targetUri: maskedUri,
        hint: maskedUri.includes("localhost") || maskedUri.includes("127.0.0.1")
          ? "Local MongoDB is not running. Consider using MongoDB Atlas (cloud) or starting your local mongod service."
          : "Please check your MongoDB Atlas username, password, network access (IP whitelist 0.0.0.0/0), and cluster status.",
      },
      { status: 500 }
    );
  }
}
