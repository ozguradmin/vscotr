import { Client, Account, Databases, Storage } from "appwrite";

const client = new Client();

const ENDPOINT = process.env.NEXT_PUBLIC_APPWRITE_ENDPOINT || "https://cloud.appwrite.io/v1";
const PROJECT_ID = process.env.NEXT_PUBLIC_APPWRITE_PROJECT_ID || "";

client
    .setEndpoint(ENDPOINT)
    .setProject(PROJECT_ID);

export const account = new Account(client);
export const databases = new Databases(client);
export const storage = new Storage(client);

export const APPWRITE_CONFIG = {
    DATABASE_ID: process.env.NEXT_PUBLIC_APPWRITE_DATABASE_ID || "",
    BUCKET_ID: process.env.NEXT_PUBLIC_APPWRITE_BUCKET_ID || "",
    COLLECTIONS: {
        PROFILES: 'profiles',
        POSTS: 'posts',
        LIKES: 'likes',
        REPOSTS: 'reposts',
        FOLLOWS: 'follows',
        PROFILE_LINKS: 'profile_links'
    }
};

export default client;
