const sdk = require('node-appwrite');

// Config from user's provided info
const ENDPOINT = 'https://fra.cloud.appwrite.io/v1';
const PROJECT_ID = '6957b3910033ab037a0e';
const API_KEY = process.env.APPWRITE_API_KEY; // Will be passed from env
const DATABASE_ID = '6957b6300034b83e7358';

const COLLECTIONS = {
    PROFILES: '6957b63100394b3f1a3e',
    POSTS: '6957b637000a08b4e66d', // Verify ID from summary
    PROFILE_LINKS: 'profile_links' // Hardcoded ID we want
};

const BUCKET_ID = 'photos';

const client = new sdk.Client();
client
    .setEndpoint(ENDPOINT)
    .setProject(PROJECT_ID)
    .setKey(API_KEY);

const databases = new sdk.Databases(client);
const storage = new sdk.Storage(client);

async function fixResources() {
    console.log('Starting Resource Fix...');

    // 1. Fix Bucket
    try {
        await storage.getBucket(BUCKET_ID);
        console.log(`✅ Bucket '${BUCKET_ID}' exists.`);
    } catch (e) {
        if (e.code === 404) {
            console.log(`⚠️ Bucket '${BUCKET_ID}' missing. Creating...`);
            try {
                await storage.createBucket(BUCKET_ID, BUCKET_ID, ['read("any")'], false, true, undefined, ['jpg', 'png', 'gif', 'jpeg', 'webp', 'heic']);
                console.log(`✅ Bucket '${BUCKET_ID}' created.`);
            } catch (err) {
                console.error(`❌ Failed to create bucket:`, err.message);
            }
        } else {
            console.error(`❌ Error checking bucket:`, e.message);
        }
    }

    // 2. Fix Profile Links Collection
    try {
        await databases.getCollection(DATABASE_ID, COLLECTIONS.PROFILE_LINKS);
        console.log(`✅ Collection '${COLLECTIONS.PROFILE_LINKS}' exists.`);
    } catch (e) {
        if (e.code === 404) {
            console.log(`⚠️ Collection '${COLLECTIONS.PROFILE_LINKS}' missing. Creating...`);
            try {
                await databases.createCollection(DATABASE_ID, COLLECTIONS.PROFILE_LINKS, 'Profile Links');
                console.log(`✅ Collection '${COLLECTIONS.PROFILE_LINKS}' created.`);

                // Add Attributes
                await databases.createStringAttribute(DATABASE_ID, COLLECTIONS.PROFILE_LINKS, 'profile_id', 255, true);
                await databases.createStringAttribute(DATABASE_ID, COLLECTIONS.PROFILE_LINKS, 'label', 255, false);
                await databases.createUrlAttribute(DATABASE_ID, COLLECTIONS.PROFILE_LINKS, 'url', true);
                await databases.createIntegerAttribute(DATABASE_ID, COLLECTIONS.PROFILE_LINKS, 'order_index', false, 0);

                console.log(`✅ Attributes for '${COLLECTIONS.PROFILE_LINKS}' created.`);
            } catch (err) {
                console.error(`❌ Failed to create collection/attributes:`, err.message);
            }
        } else {
            console.error(`❌ Error checking collection '${COLLECTIONS.PROFILE_LINKS}':`, e.message);
        }
    }

    // 3. Fix Profile Attributes (Location, UpdatedAt)
    try {
        console.log(`Checking attributes for 'profiles'...`);
        // We can't easily list attributes and check existence without fetching all, but creating if exists throws 409 usually, which is fine to ignore.

        try {
            await databases.createStringAttribute(DATABASE_ID, COLLECTIONS.PROFILES, 'location', 100, false);
            console.log(`✅ Attribute 'location' added to profiles.`);
        } catch (e) {
            if (e.code === 409) console.log(`☑️ Attribute 'location' already exists.`);
            else console.error(`❌ Error creating 'location':`, e.message);
        }

        try {
            await databases.createDatetimeAttribute(DATABASE_ID, COLLECTIONS.PROFILES, 'updated_at', false);
            console.log(`✅ Attribute 'updated_at' added to profiles.`);
        } catch (e) {
            if (e.code === 409) console.log(`☑️ Attribute 'updated_at' already exists.`);
            else console.error(`❌ Error creating 'updated_at':`, e.message);
        }
        try {
            await databases.createDatetimeAttribute(DATABASE_ID, COLLECTIONS.PROFILES, 'created_at', false);
            console.log(`✅ Attribute 'created_at' added to profiles.`);
        } catch (e) {
            if (e.code === 409) console.log(`☑️ Attribute 'created_at' already exists.`);
            else console.error(`❌ Error creating 'created_at':`, e.message);
        }
    } catch (e) {
        console.error(`❌ Error fixing profiles:`, e.message);
    }

    // 4. Fix Posts Attributes (order_index)
    try {
        console.log(`Checking attributes for 'posts'...`);
        try {
            await databases.createIntegerAttribute(DATABASE_ID, COLLECTIONS.POSTS, 'order_index', false, 0);
            console.log(`✅ Attribute 'order_index' added to posts.`);
        } catch (e) {
            if (e.code === 409) console.log(`☑️ Attribute 'order_index' already exists.`);
            else console.error(`❌ Error creating 'order_index':`, e.message);
        }
    } catch (e) {
        console.error(`❌ Error fixing posts:`, e.message);
    }

    console.log('Fix script completed. Please wait a few seconds for attributes to be indexed.');
}

fixResources();
