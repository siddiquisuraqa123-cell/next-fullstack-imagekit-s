import { getUploadAuthParams } from "@imagekit/next/server";
import { NextResponse } from "next/server";

export async function GET() {
  try {
    const privateKey = process.env.IMAGEKIT_PRIVATE_KEY;
    const publicKey =
      process.env.NEXT_PUBLIC_PUBLIC_KEY ||
      process.env.NEXT_PUBLIC_IMAGEKIT_PUBLIC_KEY;

    if (!privateKey || !publicKey) {
      console.error("Missing ImageKit keys in environment variables:", {
        hasPrivateKey: !!privateKey,
        hasPublicKey: !!publicKey,
      });
      return NextResponse.json(
        { error: "ImageKit configuration keys are missing in .env.local" },
        { status: 500 }
      );
    }

    const authenticationParameters = getUploadAuthParams({
      privateKey,
      publicKey,
    });

    return NextResponse.json({
      ...authenticationParameters,
      publicKey,
    });
  } catch (error) {
    console.error("ImageKit auth error:", error);
    return NextResponse.json(
      { error: "Authentication for ImageKit failed" },
      { status: 500 }
    );
  }
}