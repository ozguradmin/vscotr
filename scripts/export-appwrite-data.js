const sdk = require('node-appwrite');
const fs = require('fs');
const path = require('path');

// Configuration
const APPWRITE_ENDPOINT = 'https://fra.cloud.appwrite.io/v1';
const APPWRITE_PROJECT_ID = '6957b3910033ab037a0e';
const APPWRITE_API_KEY = 'standard_b8268ffd102edf024acddbd0856b645fd4f9727efe081c89401f8d0795810adaf561ec6a603f295b0143830595e464dd3e21012e66cb0621d9e11007c8301324bed57683750def7eace537396be855a636a8c95a8c6164825e1204aa5403a6ba03a7e5ecec77b3b5252e4384225760790e8a294946c1dbf9d21f69116e9ac60d';
const DATABASE_ID = '6957b6300034b83e7358';

// Collection IDs
const COLLECTIONS = {
    profiles: '6957b63100394b3f1a3e',
    posts: '6957b637000a08b4e66d',
    likes: '6957b63f0012313e1f33',
    reposts: '6957b642003546f4e485',
    follows: '6957b6460033a44fc87f',
    profile_links: 'profile_links'
};

// Initialize Appwrite
const client = new sdk.Client();
client
    .setEndpoint(APPWRITE_ENDPOINT)
    .setProject(APPWRITE_PROJECT_ID)
    .setKey(APPWRITE_API_KEY);

const databases = new sdk.Databases(client);

// Export directory
const EXPORT_DIR = path.join(__dirname, 'appwrite_export');
if (!fs.existsSync(EXPORT_DIR)) {
    fs.mkdirSync(EXPORT_DIR, { recursive: true });
}

async function exportCollection(name, collectionId) {
    console.log(`Exporting ${name}...`);
    try {
        let allDocs = [];
        let offset = 0;
        const limit = 100;

        while (true) {
            const response = await databases.listDocuments(
                DATABASE_ID,
                collectionId,
                [
                    sdk.Query.limit(limit),
                    sdk.Query.offset(offset)
                ]
            );

            allDocs = allDocs.concat(response.documents);
            console.log(`  Fetched ${response.documents.length} documents (total: ${allDocs.length})`);

            if (response.documents.length < limit) {
                break;
            }
            offset += limit;
        }

        // Save to file
        const filePath = path.join(EXPORT_DIR, `${name}.json`);
        fs.writeFileSync(filePath, JSON.stringify(allDocs, null, 2));
        console.log(`✓ ${name}: ${allDocs.length} documents exported to ${filePath}`);
        return allDocs.length;
    } catch (error) {
        console.error(`✗ ${name}: Failed - ${error.message}`);
        return 0;
    }
}

async function main() {
    console.log('='.repeat(50));
    console.log('APPWRITE DATA EXPORT');
    console.log('='.repeat(50));
    console.log(`Export directory: ${EXPORT_DIR}\n`);

    let totalDocs = 0;

    for (const [name, collectionId] of Object.entries(COLLECTIONS)) {
        const count = await exportCollection(name, collectionId);
        totalDocs += count;
    }

    console.log('\n' + '='.repeat(50));
    console.log(`EXPORT COMPLETE: ${totalDocs} total documents`);
    console.log(`Files saved to: ${EXPORT_DIR}`);
    console.log('='.repeat(50));
}

main().catch(console.error);
