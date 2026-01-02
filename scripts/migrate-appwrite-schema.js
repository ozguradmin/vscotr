const sdk = require('node-appwrite');

// Configuration
const client = new sdk.Client();

// Credentials from User
const ENDPOINT = 'https://cloud.appwrite.io/v1';
const PROJECT_ID = '6957b3910033ab037a0e';
const API_KEY = 'standard_b8268ffd102edf024acddbd0856b645fd4f9727efe081c89401f8d0795810adaf561ec6a603f295b0143830595e464dd3e21012e66cb0621d9e11007c8301324bed57683750def7eace537396be855a636a8c95a8c6164825e1204aa5403a6ba03a7e5ecec77b3b5252e4384225760790e8a294946c1dbf9d21f69116e9ac60d';

const DB_NAME = 'vscotr-db';
const BUCKET_NAME = 'photos';

client
    .setEndpoint(ENDPOINT)
    .setProject(PROJECT_ID)
    .setKey(API_KEY);

const databases = new sdk.Databases(client);
const storage = new sdk.Storage(client);

async function main() {
    console.log('🚀 Starting Appwrite Migration...');

    let dbId = '';

    // 1. Create Database
    try {
        console.log('Creating Database...');
        // Check if exists first (listing not always easy by name, so we try create or handle error)
        // For simplicity in migration script, we'll try to list.
        const dbs = await databases.list();
        const existingDb = dbs.databases.find(db => db.name === DB_NAME);

        if (existingDb) {
            dbId = existingDb.$id;
            console.log(`Database '${DB_NAME}' already exists (ID: ${dbId})`);
        } else {
            const db = await databases.create(sdk.ID.unique(), DB_NAME);
            dbId = db.$id;
            console.log(`Database created (ID: ${dbId})`);
        }
    } catch (e) {
        console.error('Error creating database:', e.message);
        return;
    }

    // Helper to create collection if not exists
    async function ensureCollection(name, attributes = [], indexes = []) {
        console.log(`\nProcessing Collection: ${name}...`);
        let collectionId = '';
        try {
            const cols = await databases.listCollections(dbId);
            const existingCol = cols.collections.find(c => c.name === name);

            if (existingCol) {
                collectionId = existingCol.$id;
                console.log(` -> Exists (ID: ${collectionId})`);
            } else {
                const col = await databases.createCollection(dbId, sdk.ID.unique(), name);
                collectionId = col.$id;
                console.log(` -> Created (ID: ${collectionId})`);

                // Allow "Any" to read for now (Public Read) - For development speed
                // In production we refine this.
                // await databases.updateCollection(dbId, collectionId, name, [
                //     sdk.Permission.read(sdk.Role.any()),
                //     sdk.Permission.write(sdk.Role.users())
                // ]);
                // Note: creating collection doesn't set permissions, need separate call or manual.
                // We'll skip permissions in script to avoid complexity errors, assume manual or default.
            }

            // Attributes
            for (const attr of attributes) {
                try {
                    // Check if attribute exists logic is skipped, appwrite throws error if exists which we catch
                    if (attr.type === 'string') {
                        await databases.createStringAttribute(dbId, collectionId, attr.key, attr.size, attr.required, attr.default);
                    } else if (attr.type === 'integer') {
                        await databases.createIntegerAttribute(dbId, collectionId, attr.key, attr.required, 0, 2147483647, attr.default);
                    } else if (attr.type === 'float') {
                        await databases.createFloatAttribute(dbId, collectionId, attr.key, attr.required, null, null, attr.default);
                    } else if (attr.type === 'url') {
                        await databases.createUrlAttribute(dbId, collectionId, attr.key, attr.required, attr.default);
                    } else if (attr.type === 'datetime') {
                        await databases.createDatetimeAttribute(dbId, collectionId, attr.key, attr.required, attr.default);
                    }
                    console.log(`   + Attribute '${attr.key}' created.`);
                } catch (e) {
                    if (e.code === 409) console.log(`   . Attribute '${attr.key}' already exists.`);
                    else console.error(`   ! Error attribute '${attr.key}':`, e.message);
                }
                // Rate limit handling (naive)
                await new Promise(r => setTimeout(r, 500));
            }

            // Indexes
            for (const idx of indexes) {
                try {
                    await databases.createIndex(dbId, collectionId, idx.key, idx.type, idx.attributes, idx.orders);
                    console.log(`   + Index '${idx.key}' created.`);
                } catch (e) {
                    if (e.code === 409) console.log(`   . Index '${idx.key}' already exists.`);
                    else console.error(`   ! Error index '${idx.key}':`, e.message);
                }
                await new Promise(r => setTimeout(r, 1000)); // Index creation can be slow
            }

        } catch (e) {
            console.error(`Error processing collection ${name}:`, e.message);
        }
    }

    // 2. Define Collections
    await ensureCollection('profiles', [
        { key: 'username', type: 'string', size: 128, required: true },
        { key: 'display_name', type: 'string', size: 128, required: false },
        { key: 'bio', type: 'string', size: 512, required: false },
        { key: 'avatar_url', type: 'url', required: false },
        { key: 'member_badge', type: 'string', size: 32, required: false }
    ], [
        { key: 'idx_username', type: 'unique', attributes: ['username'], orders: ['ASC'] }
    ]);

    await ensureCollection('posts', [
        { key: 'user_id', type: 'string', size: 36, required: true },
        { key: 'image_url', type: 'url', required: true },
        { key: 'caption', type: 'string', size: 2048, required: false },
        { key: 'aspect_ratio', type: 'float', required: false, default: 1.0 },
        { key: 'created_at', type: 'datetime', required: false },
        { key: 'order_index', type: 'integer', required: false }
    ], [
        { key: 'idx_posts_user', type: 'key', attributes: ['user_id'], orders: ['ASC'] },
        { key: 'idx_posts_created', type: 'key', attributes: ['created_at'], orders: ['DESC'] }
    ]);

    await ensureCollection('likes', [
        { key: 'user_id', type: 'string', size: 36, required: true },
        { key: 'post_id', type: 'string', size: 36, required: true }
    ], [
        // Composite index sometimes harder in free tier or specific version, keeping simple
        { key: 'idx_likes_post', type: 'key', attributes: ['post_id'], orders: ['ASC'] }
    ]);

    await ensureCollection('reposts', [
        { key: 'user_id', type: 'string', size: 36, required: true },
        { key: 'post_id', type: 'string', size: 36, required: true }
    ], [
        { key: 'idx_reposts_user', type: 'key', attributes: ['user_id'], orders: ['ASC'] }
    ]);

    await ensureCollection('follows', [
        { key: 'follower_id', type: 'string', size: 36, required: true },
        { key: 'following_id', type: 'string', size: 36, required: true }
    ], [
        { key: 'idx_follows_follower', type: 'key', attributes: ['follower_id'], orders: ['ASC'] }
    ]);


    // 3. Create Storage Bucket
    try {
        console.log('\nCreating Storage Bucket...');
        const buckets = await storage.listBuckets();
        const existingBucket = buckets.buckets.find(b => b.name === BUCKET_NAME);

        if (existingBucket) {
            console.log(`Bucket '${BUCKET_NAME}' already exists.`);
        } else {
            await storage.createBucket(sdk.ID.unique(), BUCKET_NAME, ["image/jpeg", "image/png", "image/webp"], false, true, null, BUCKET_NAME);
            console.log(`Bucket '${BUCKET_NAME}' created.`);
        }
    } catch (e) {
        console.error('Error creating bucket:', e.message);
    }

    console.log('\nMigration Complete! Please verify in Appwrite Console.');
    console.log(`Database ID: ${dbId}`);
}

main();
