const admin = require('firebase-admin');
const fs = require('fs');
const path = require('path');

// Initialize Firebase Admin
const serviceAccount = require('../firebase-service-account.json');
admin.initializeApp({
    credential: admin.credential.cert(serviceAccount)
});

const db = admin.firestore();
const auth = admin.auth();

// Load exported data
const EXPORT_DIR = path.join(__dirname, 'appwrite_export');
const users = JSON.parse(fs.readFileSync(path.join(EXPORT_DIR, 'users.json'), 'utf8'));
const profiles = JSON.parse(fs.readFileSync(path.join(EXPORT_DIR, 'profiles.json'), 'utf8'));
const posts = JSON.parse(fs.readFileSync(path.join(EXPORT_DIR, 'posts.json'), 'utf8'));
const follows = JSON.parse(fs.readFileSync(path.join(EXPORT_DIR, 'follows.json'), 'utf8'));
const likes = JSON.parse(fs.readFileSync(path.join(EXPORT_DIR, 'likes.json'), 'utf8'));
const reposts = JSON.parse(fs.readFileSync(path.join(EXPORT_DIR, 'reposts.json'), 'utf8'));
const profileLinks = JSON.parse(fs.readFileSync(path.join(EXPORT_DIR, 'profile_links.json'), 'utf8'));

// Map old Appwrite IDs to new Firebase IDs
const userIdMap = {};

async function migrateUsers() {
    console.log('\n=== Migrating Users ===');

    for (const user of users) {
        try {
            // Create user in Firebase Auth
            // Note: We can't migrate passwords, users will need to reset
            const email = user.email || `${user.name}@vscotr.placeholder.com`;

            const firebaseUser = await auth.createUser({
                email: email,
                displayName: user.name,
                emailVerified: false,
                disabled: false
            });

            userIdMap[user.id] = firebaseUser.uid;
            console.log(`✓ User: ${user.name} -> ${firebaseUser.uid}`);
        } catch (error) {
            if (error.code === 'auth/email-already-exists') {
                // Try to get existing user
                try {
                    const existingUser = await auth.getUserByEmail(user.email || `${user.name}@vscotr.placeholder.com`);
                    userIdMap[user.id] = existingUser.uid;
                    console.log(`⚠ User exists: ${user.name} -> ${existingUser.uid}`);
                } catch (e) {
                    console.error(`✗ User ${user.name}: ${error.message}`);
                }
            } else {
                console.error(`✗ User ${user.name}: ${error.message}`);
            }
        }
    }

    console.log(`Mapped ${Object.keys(userIdMap).length} users`);
}

async function migrateProfiles() {
    console.log('\n=== Migrating Profiles ===');

    const batch = db.batch();
    let count = 0;

    for (const profile of profiles) {
        const newUserId = userIdMap[profile.$id] || profile.$id;

        const docRef = db.collection('profiles').doc(newUserId);
        batch.set(docRef, {
            username: profile.username,
            display_name: profile.display_name,
            bio: profile.bio,
            avatar_url: profile.avatar_url,
            member_badge: profile.member_badge,
            location: profile.location,
            grid_sort: profile.grid_sort,
            grid_filter: profile.grid_filter,
            created_at: admin.firestore.FieldValue.serverTimestamp(),
            updated_at: admin.firestore.FieldValue.serverTimestamp()
        });
        count++;
    }

    await batch.commit();
    console.log(`✓ Migrated ${count} profiles`);
}

async function migratePosts() {
    console.log('\n=== Migrating Posts ===');

    let count = 0;

    for (const post of posts) {
        const newUserId = userIdMap[post.user_id] || post.user_id;

        await db.collection('posts').doc(post.$id).set({
            user_id: newUserId,
            image_url: post.image_url,
            caption: post.caption,
            aspect_ratio: post.aspect_ratio,
            created_at: new Date(post.created_at),
            order_index: post.order_index
        });
        count++;
    }

    console.log(`✓ Migrated ${count} posts`);
}

async function migrateFollows() {
    console.log('\n=== Migrating Follows ===');

    let count = 0;

    for (const follow of follows) {
        const newFollowerId = userIdMap[follow.follower_id] || follow.follower_id;
        const newFollowingId = userIdMap[follow.following_id] || follow.following_id;

        await db.collection('follows').doc(follow.$id).set({
            follower_id: newFollowerId,
            following_id: newFollowingId,
            created_at: admin.firestore.FieldValue.serverTimestamp()
        });
        count++;
    }

    console.log(`✓ Migrated ${count} follows`);
}

async function migrateLikes() {
    console.log('\n=== Migrating Likes ===');

    let count = 0;

    for (const like of likes) {
        const newUserId = userIdMap[like.user_id] || like.user_id;

        await db.collection('likes').doc(like.$id).set({
            user_id: newUserId,
            post_id: like.post_id,
            created_at: admin.firestore.FieldValue.serverTimestamp()
        });
        count++;
    }

    console.log(`✓ Migrated ${count} likes`);
}

async function migrateReposts() {
    console.log('\n=== Migrating Reposts ===');

    let count = 0;

    for (const repost of reposts) {
        const newUserId = userIdMap[repost.user_id] || repost.user_id;

        await db.collection('reposts').doc(repost.$id).set({
            user_id: newUserId,
            post_id: repost.post_id,
            created_at: admin.firestore.FieldValue.serverTimestamp()
        });
        count++;
    }

    console.log(`✓ Migrated ${count} reposts`);
}

async function migrateProfileLinks() {
    console.log('\n=== Migrating Profile Links ===');

    let count = 0;

    for (const link of profileLinks) {
        const newProfileId = userIdMap[link.profile_id] || link.profile_id;

        await db.collection('profile_links').doc(link.$id).set({
            profile_id: newProfileId,
            label: link.label,
            url: link.url,
            order_index: link.order_index
        });
        count++;
    }

    console.log(`✓ Migrated ${count} profile links`);
}

async function main() {
    console.log('='.repeat(50));
    console.log('FIREBASE MIGRATION');
    console.log('='.repeat(50));

    try {
        await migrateUsers();
        await migrateProfiles();
        await migratePosts();
        await migrateFollows();
        await migrateLikes();
        await migrateReposts();
        await migrateProfileLinks();

        console.log('\n' + '='.repeat(50));
        console.log('MIGRATION COMPLETE!');
        console.log('='.repeat(50));

        // Save user ID mapping for reference
        fs.writeFileSync(
            path.join(EXPORT_DIR, 'user_id_mapping.json'),
            JSON.stringify(userIdMap, null, 2)
        );
        console.log('User ID mapping saved to user_id_mapping.json');

    } catch (error) {
        console.error('Migration failed:', error);
    }

    process.exit(0);
}

main();
