import { authOptions } from "@/lib/auth";
import { connectToDatabase } from "@/lib/db";
import video, { IVideo } from "@/model/video";
import { getServerSession } from "next-auth";
import { NextRequest, NextResponse } from "next/server";

export async function GET(){
    try {
      await  connectToDatabase ()
     const videos = await video.find({}).sort({createdAt : -1}).
     lean()
if(!videos || videos.length === 0) {
    return NextResponse.json([], {status : 200})
}

return NextResponse.json(videos)
        
    } catch (error: any) {
      console.error("Error fetching videos:", error);
      return NextResponse.json(
        { error: error?.message || "Failed to fetch videos" },
        { status: 500 }
      );
    }
}

export async function POST(request: NextRequest) {
 try {
  const session = await getServerSession(authOptions);
  if (!session) {
    return NextResponse.json(
      { error: "Unauthorized. Please log in before publishing videos." },
      { status: 401 }
    );
  }  

  await connectToDatabase();
  const body: IVideo = await request.json();
  if (
    !body.title ||
    !body.description ||
    !body.videoUrl ||
    !body.thumbnailUrl
  ) {
    return NextResponse.json(
      { error: "Missing required fields (title, description, videoUrl, thumbnailUrl)" },
      { status: 400 }
    );
  }
  const videoData = {
    ...body,
    controls: body?.controls ?? true,
    transformation: {
      height: 1920,
      width: 1080,
      quality: body.transformation?.quality ?? 100,
    },
  };
  const newVideo = await video.create(videoData);    

  return NextResponse.json(newVideo);

 } catch (error: any) {
    console.error("Error creating video:", error);
    return NextResponse.json(
      { error: error?.message || "Failed to create video" },
      { status: 500 }
    );
 }   

 
}