import { Client, Databases, Users } from "node-appwrite";

const client = new Client();

client
    .setEndpoint(process.env.NEXT_PUBLIC_APPWRITE_ENDPOINT!)
    .setProject(process.env.NEXT_PUBLIC_APPWRITE_PROJECT_ID!)
    .setKey(process.env.APPWRITE_API_KEY!);

export const adminDatabases = new Databases(client);
export const adminUsers = new Users(client);

export const APPWRITE_CONFIG = {
    DATABASE_ID: process.env.NEXT_PUBLIC_APPWRITE_DATABASE_ID!,
    BUCKET_ID: process.env.NEXT_PUBLIC_APPWRITE_BUCKET_ID!,
    COLLECTIONS: {
        PROFILES: 'profiles',
        POSTS: 'posts',
        LIKES: 'likes',
        REPOSTS: 'reposts',
        FOLLOWS: 'follows'
    }
};
