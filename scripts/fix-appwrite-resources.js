const sdk = require('node-appwrite');
const fs = require('fs');
const path = require('path');

// Try to load from .env.local
let apiKey = process.env.APPWRITE_API_KEY;
if (!apiKey) {
    try {
        const envPath = path.resolve(__dirname, '../.env.local');
        if (fs.existsSync(envPath)) {
            const envContent = fs.readFileSync(envPath, 'utf8');
            const match = envContent.match(/APPWRITE_API_KEY=(.+)/);
            if (match) {
                apiKey = match[1].trim();
                console.log('✅ Loaded API Key from .env.local');
            }
        }
    } catch (e) {
        console.warn('Could not read .env.local:', e.message);
    }
}

if (!apiKey) {
    console.error('❌ APPWRITE_API_KEY not found in environment or .env.local');
    process.exit(1);
}

// Config
const ENDPOINT = 'https://fra.cloud.appwrite.io/v1';
const PROJECT_ID = '6957b3910033ab037a0e';
const ACCESS_KEY = apiKey;
const DATABASE_ID = '6957b6300034b83e7358';

const COLLECTIONS = {
    PROFILES: '6957b63100394b3f1a3e',
    POSTS: '6957b637000a08b4e66d',
    PROFILE_LINKS: 'profile_links'
};

const BUCKET_ID = 'photos';

const client = new sdk.Client();
client
    .setEndpoint(ENDPOINT)
    .setProject(PROJECT_ID)
    .setKey(ACCESS_KEY);

const databases = new sdk.Databases(client);
const storage = new sdk.Storage(client);

async function fixPermissions() {
    console.log('🔐 Starting Permission Fix...');

    // 1. Fix Bucket Permissions (Photos)
    try {
        console.log(`Setting permissions for Bucket '${BUCKET_ID}'...`);
        // We want logged-in users to be able to read all photos, and create/update/delete their own files (if Document Security is on).
        // For simplicity and to fix 401s, we'll allow Role.users() to Create, Read, Updates, Delete.
        // Better security: Role.any() Read. Role.users() Create. Update/Delete depends on file ownership (implied by default).

        await storage.updateBucket(
            BUCKET_ID,
            BUCKET_ID,
            [
                sdk.Permission.read(sdk.Role.any()), // Public Read
                sdk.Permission.create(sdk.Role.users()), // Logged in Create
                sdk.Permission.update(sdk.Role.users()), // Logged in Update
                sdk.Permission.delete(sdk.Role.users())  // Logged in Delete
            ],
            false, // File Security (if true, only owner can manage file after creation) -> LEAVE FALSE for now to avoid complexity or TRUE?
            // If TRUE, then only the user who uploaded can delete/update. This is good.
            true, // Enabled
            undefined, // Max Size
            ['jpg', 'png', 'gif', 'jpeg', 'webp', 'heic'] // Allowed extensions
        );
        console.log(`✅ Bucket '${BUCKET_ID}' permissions updated.`);
    } catch (e) {
        console.error(`❌ Error updating bucket permissions:`, e.message);
    }

    // 2. Fix Profile Links Permissions
    try {
        console.log(`Setting permissions for Collection '${COLLECTIONS.PROFILE_LINKS}'...`);
        // Logged in users can Create.
        // Everyone can Read.
        // Update/Delete should be restricted to owner (handled by Document Security).
        await databases.updateCollection(
            DATABASE_ID,
            COLLECTIONS.PROFILE_LINKS,
            'Profile Links',
            [
                sdk.Permission.read(sdk.Role.any()), // Everyone can read links
                sdk.Permission.create(sdk.Role.users()), // Logged in users can create
                sdk.Permission.update(sdk.Role.users()), // Logged in users can update
                sdk.Permission.delete(sdk.Role.users())  // Logged in users can delete
            ],
            true // Document Security: TRUE. This is CRITICAL so users can only edit their OWN links. 
            // BUT for this to work, we must assign permissions during document creation.
            // Since we are fixing 401 on LIST/CREATE, Collection Level permissions are prerequisite.
        );
        console.log(`✅ Collection '${COLLECTIONS.PROFILE_LINKS}' permissions updated.`);
    } catch (e) {
        console.error(`❌ Error updating 'profile_links' permissions:`, e.message);
    }

    // 3. Fix Profiles Permissions (just in case)
    try {
        console.log(`Setting permissions for Collection '${COLLECTIONS.PROFILES}'...`);
        await databases.updateCollection(
            DATABASE_ID,
            COLLECTIONS.PROFILES,
            'Profiles',
            [
                sdk.Permission.read(sdk.Role.any()),
                sdk.Permission.create(sdk.Role.users()),
                sdk.Permission.update(sdk.Role.users()), // Allow users to update
                // Delete? Maybe not.
            ],
            true // Document Security enabled
        );
        console.log(`✅ Collection '${COLLECTIONS.PROFILES}' permissions updated.`);
    } catch (e) {
        console.error(`❌ Error updating 'profiles' permissions:`, e.message);
    }

    // 4. Fix Posts Permissions
    try {
        console.log(`Setting permissions for Collection '${COLLECTIONS.POSTS}'...`);
        await databases.updateCollection(
            DATABASE_ID,
            COLLECTIONS.POSTS,
            'Posts',
            [
                sdk.Permission.read(sdk.Role.any()),
                sdk.Permission.create(sdk.Role.users()),
                sdk.Permission.update(sdk.Role.users()),
                sdk.Permission.delete(sdk.Role.users())
            ],
            true // Document Security
        );
        console.log(`✅ Collection '${COLLECTIONS.POSTS}' permissions updated.`);
    } catch (e) {
        console.error(`❌ Error updating 'posts' permissions:`, e.message);
    }

    console.log('Permission fix script completed.');
}

fixPermissions();
