import { connectToDatabase } from "@/lib/db";
import User from "@/model/user";
import { NextRequest, NextResponse } from "next/server";

export async function POST(request: NextRequest) {
  try {
    const { email, password } = await request.json();
    if (!email || !password) {
      return NextResponse.json(
        { error: "Email and password are required" },
        { status: 400 }
      );
    }

    await connectToDatabase();
    const existingUser = await User.findOne({ email });
    if (existingUser) {
      return NextResponse.json(
        { error: "User already registered" },
        { status: 400 }
      );
    }

    await User.create({
      email,
      password,
    });

    return NextResponse.json(
      { message: "User registered successfully" },
      { status: 201 }
    );
  } catch (error: any) {
    console.error("Registration error:", error);
    const msg = error?.message?.includes("ECONNREFUSED")
      ? "Database connection failed. Ensure MongoDB is running and MONGODB_URI is configured in .env.local"
      : error?.message || "Failed to register user";
    return NextResponse.json(
      { error: msg },
      { status: 500 }
    );
  }
}