import { error } from "console";
import mongoose from "mongoose";
import { Ruthie } from "next/font/google";
import { cache } from "react";

const MONGODB_URI = process.env.MONGODB_URI!
if(!MONGODB_URI) {
    throw new Error("please define mongo_uri in env variables") ;
}

let cached = global.mongoose

if(!cached){global.mongoose = { conn: null, promise: null};
  
}

export async function connectToDatabase() {
   if (cached.conn){
    return cached.conn
   } 
   if(!cached.promise){
   const opts = {
    buffercommands :true,
    maxPoolSize : 10
   }
    mongoose
    .connect(MONGODB_URI, opts)
    .then(() => mongoose.connection)
   }

   try {
   cached.conn = await cached.promise
   } catch (error) {
    cached.promise = null 
    throw error
   }
   return cached.conn
}
