import { Client, Account, Databases, Storage } from "appwrite";

const client = new Client();

const ENDPOINT = process.env.NEXT_PUBLIC_APPWRITE_ENDPOINT || "https://fra.cloud.appwrite.io/v1";
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
        PROFILES: '6957b63100394b3f1a3e',
        POSTS: '6957b637000a08b4e66d',
        LIKES: '6957b63f0012313e1f33',
        REPOSTS: '6957b642003546f4e485',
        FOLLOWS: '6957b6460033a44fc87f',
        PROFILE_LINKS: 'profile_links' // This one might not be created or uses manual ID? Let's assume standard creation logic didn't cover it or listed it. Wait, debug output didn't show profiles_links. Let's check debug output once more.
    }
};

export default client;
