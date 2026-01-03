// Firebase Admin SDK for server-side operations
import { initializeApp, getApps, cert } from 'firebase-admin/app';
import { getFirestore } from 'firebase-admin/firestore';
import { getAuth } from 'firebase-admin/auth';

// Initialize Firebase Admin
if (getApps().length === 0) {
    // In production, use environment variable or service account
    // For now, initialize without credentials (uses default application credentials)
    try {
        initializeApp({
            projectId: 'vscotr-27b90',
        });
    } catch (e) {
        console.error('Firebase Admin init error:', e);
    }
}

const adminDb = getFirestore();
const adminAuth = getAuth();

// Collection names
const COLLECTIONS = {
    PROFILES: 'profiles',
    POSTS: 'posts',
    LIKES: 'likes',
    FOLLOWS: 'follows',
    REPOSTS: 'reposts',
    PROFILE_LINKS: 'profile_links'
};

// Query class to match Appwrite-style queries
class QueryBuilder {
    static equal(field: string, value: any) {
        return { type: 'equal', field, value };
    }
    static orderAsc(field: string) {
        return { type: 'orderAsc', field };
    }
    static orderDesc(field: string) {
        return { type: 'orderDesc', field };
    }
    static limit(num: number) {
        return { type: 'limit', value: num };
    }
}

export const Query = QueryBuilder;

type QueryFilter = ReturnType<typeof Query.equal>;

// Admin databases compatible with Appwrite API
export const adminDatabases = {
    async listDocuments(databaseId: string, collectionId: string, queries: QueryFilter[] = []) {
        const collName = COLLECTIONS[collectionId as keyof typeof COLLECTIONS] || collectionId;
        let query: FirebaseFirestore.Query = adminDb.collection(collName);

        let limitValue = 100;

        for (const q of queries) {
            if (q.type === 'equal') {
                if (q.field === '$id') {
                    // Handle fetching by document IDs
                    if (Array.isArray(q.value)) {
                        const docs = await Promise.all(
                            q.value.map(async (id: string) => {
                                try {
                                    const docSnap = await adminDb.collection(collName).doc(id).get();
                                    if (docSnap.exists) {
                                        return { $id: docSnap.id, ...docSnap.data() };
                                    }
                                    return null;
                                } catch {
                                    return null;
                                }
                            })
                        );
                        const validDocs = docs.filter(Boolean);
                        return { documents: validDocs, total: validDocs.length };
                    }
                    continue;
                }
                query = query.where(q.field, '==', q.value);
            } else if (q.type === 'orderAsc') {
                query = query.orderBy(q.field, 'asc');
            } else if (q.type === 'orderDesc') {
                query = query.orderBy(q.field, 'desc');
            } else if (q.type === 'limit') {
                limitValue = q.value;
            }
        }

        query = query.limit(limitValue);

        const snapshot = await query.get();
        const documents = snapshot.docs.map(doc => ({
            $id: doc.id,
            ...doc.data()
        }));

        return { documents, total: documents.length };
    },

    async getDocument(databaseId: string, collectionId: string, documentId: string) {
        const collName = COLLECTIONS[collectionId as keyof typeof COLLECTIONS] || collectionId;
        const docSnap = await adminDb.collection(collName).doc(documentId).get();

        if (!docSnap.exists) {
            throw new Error('Document not found');
        }

        return { $id: docSnap.id, ...docSnap.data() };
    }
};

export const adminUsers = {
    async get(userId: string) {
        return await adminAuth.getUser(userId);
    },

    async list() {
        return await adminAuth.listUsers();
    }
};

export const APPWRITE_CONFIG = {
    DATABASE_ID: 'vscotr-db',
    BUCKET_ID: 'photos',
    COLLECTIONS: COLLECTIONS
};
