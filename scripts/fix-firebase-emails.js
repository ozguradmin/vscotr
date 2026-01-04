// Firebase User Email Fix Script - By Email
// Run with: node scripts/fix-firebase-emails.js

const admin = require('firebase-admin');
const serviceAccount = require('../firebase-service-account.json');

admin.initializeApp({
    credential: admin.credential.cert(serviceAccount)
});

const auth = admin.auth();

// Map: wrong placeholder email -> correct email
const emailFixes = {
    'ozgur@vscotr.placeholder.com': 'ozgurglr256@gmail.com',
    'ozguradmin@vscotr.placeholder.com': 'ozgur@gmail.com',
    'guler@vscotr.placeholder.com': 'guler@gmail.com',
    'admin@vscotr.placeholder.com': 'admin@gmail.com',
    'xxx@vscotr.placeholder.com': 'xxx@gmail.com',
    '123@vscotr.placeholder.com': '123@gmail.com',
    'llewelyn@vscotr.placeholder.com': 'hkeremsahin11@gmail.com',
};

async function fixEmails() {
    console.log('Starting email fix...\n');

    for (const [wrongEmail, correctEmail] of Object.entries(emailFixes)) {
        try {
            console.log(`Looking for: ${wrongEmail}`);
            const user = await auth.getUserByEmail(wrongEmail);
            console.log(`  Found user: ${user.uid} (${user.displayName})`);

            await auth.updateUser(user.uid, {
                email: correctEmail,
                emailVerified: false
            });
            console.log(`  ✓ Updated to: ${correctEmail}\n`);
        } catch (error) {
            if (error.code === 'auth/user-not-found') {
                console.log(`  User not found with this email, skipping...\n`);
            } else {
                console.error(`  ✗ Error:`, error.message, '\n');
            }
        }
    }

    console.log('Done!');
    process.exit(0);
}

fixEmails();
