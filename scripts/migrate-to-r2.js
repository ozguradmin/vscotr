const { Client, Databases, Storage, ID, Query } = require('node-appwrite');
const { S3Client, PutObjectCommand } = require('@aws-sdk/client-s3');
const fs = require('fs');
const https = require('https');
const path = require('path');

// --- CONFIGURATION ---
const APPWRITE_ENDPOINT = 'https://cloud.appwrite.io/v1';
const APPWRITE_PROJECT_ID = '6957b3910033ab037a0e';
// Bu key'i güvenli bir şekilde alın veya hardcode edin (kullanıcıya bırakıyoruz)
const APPWRITE_API_KEY = process.env.APPWRITE_API_KEY || 'BURAYA_APPWRITE_API_KEY_YAPISTIRIN';
const APPWRITE_DATABASE_ID = '6957cda6002f231f8510';
const COLLECTIONS = {
    POSTS: 'posts',
    PROFILES: 'profiles'
};

const R2_ACCOUNT_ID = '3c39c225b3a27de7822833feb24b65b1';
const R2_ACCESS_KEY_ID = '5ffee2ee3386bdb777158280245b58fb';
const R2_SECRET_ACCESS_KEY = '59117ce6e59c4cc901d99a80bc7de399184863ccbdd55974d19b82c4a0dfda34';
const R2_BUCKET_NAME = 'vscotr-images';
const R2_PUBLIC_URL_BASE = 'https://pub-1b9c5522d5434b5f99b1bc7a372d31fb.r2.dev';

// --- INIT ---

if (!APPWRITE_API_KEY || APPWRITE_API_KEY.includes('BURAYA')) {
    console.error("HATA: APPWRITE_API_KEY tanımlı değil. Script dosyasını açıp API Key'inizi yapıştırın.");
    process.exit(1);
}

const client = new Client()
    .setEndpoint(APPWRITE_ENDPOINT)
    .setProject(APPWRITE_PROJECT_ID)
    .setKey(APPWRITE_API_KEY);

const databases = new Databases(client);

const r2 = new S3Client({
    region: "auto",
    endpoint: `https://${R2_ACCOUNT_ID}.r2.cloudflarestorage.com`,
    credentials: {
        accessKeyId: R2_ACCESS_KEY_ID,
        secretAccessKey: R2_SECRET_ACCESS_KEY,
    },
});

async function downloadFile(url) {
    return new Promise((resolve, reject) => {
        https.get(url, (res) => {
            if (res.statusCode !== 200) {
                reject(new Error(`Failed to download: ${res.statusCode}`));
                return;
            }
            const data = [];
            res.on('data', (chunk) => data.push(chunk));
            res.on('end', () => resolve(Buffer.concat(data)));
        }).on('error', reject);
    });
}

async function uploadToR2(buffer, filename, contentType) {
    const key = filename;
    await r2.send(new PutObjectCommand({
        Bucket: R2_BUCKET_NAME,
        Key: key,
        Body: buffer,
        ContentType: contentType
    }));
    return `${R2_PUBLIC_URL_BASE}/${key}`;
}

async function migrateCollection(collectionName, collectionId, urlField) {
    console.log(`Checking collection: ${collectionName} (${collectionId})...`);

    let offset = 0;
    const limit = 25;
    let totalMigrated = 0;

    while (true) {
        const response = await databases.listDocuments(
            APPWRITE_DATABASE_ID,
            collectionId,
            [
                Query.limit(limit),
                Query.offset(offset)
            ]
        );

        if (response.documents.length === 0) break;

        for (const doc of response.documents) {
            const currentUrl = doc[urlField];

            if (currentUrl && currentUrl.includes('cloud.appwrite.io')) {
                console.log(`Migrating doc ${doc.$id}...`);

                try {
                    // 1. Download
                    const buffer = await downloadFile(currentUrl);

                    // 2. Determine Filename
                    // Try to guess extension or default to webp
                    const ext = currentUrl.includes('.png') ? 'png' : (currentUrl.includes('.jpg') ? 'jpg' : 'webp');
                    const newFilename = `${doc.$id}_migrated.${ext}`;

                    // 3. Upload to R2
                    const contentType = `image/${ext === 'jpg' ? 'jpeg' : ext}`;
                    await uploadToR2(buffer, newFilename, contentType);

                    const newR2Url = `${R2_PUBLIC_URL_BASE}/${newFilename}`;

                    // 4. Update DB
                    await databases.updateDocument(
                        APPWRITE_DATABASE_ID,
                        collectionId,
                        doc.$id,
                        {
                            [urlField]: newR2Url
                        }
                    );

                    console.log(`✓ Updated: ${newR2Url}`);
                    totalMigrated++;

                } catch (err) {
                    console.error(`✗ Failed to migrate ${doc.$id}:`, err.message);
                }
            }
        }

        offset += limit;
    }
    console.log(`Collection ${collectionName} DONE. Total migrated: ${totalMigrated}`);
}

async function main() {
    console.log('Starting Migration: Appwrite -> R2');
    await migrateCollection('POSTS', 'posts', 'image_url');
    await migrateCollection('PROFILES', 'profiles', 'avatar_url');
    console.log('Migration Completed.');
}

main().catch(console.error);
