// Firebase Compatibility Layer - Appwrite-like API for easy migration
import { db, COLLECTIONS } from './client';
import {
    collection,
    doc,
    getDoc,
    getDocs,
    setDoc,
    addDoc,
    updateDoc,
    deleteDoc,
    query,
    where,
    orderBy,
    limit,
    startAfter,
    DocumentData,
    QueryConstraint
} from 'firebase/firestore';

// Appwrite Query compatibility
export const Query = {
    equal: (field: string, value: any) => ({ type: 'equal', field, value }),
    notEqual: (field: string, value: any) => ({ type: 'notEqual', field, value }),
    limit: (num: number) => ({ type: 'limit', value: num }),
    offset: (num: number) => ({ type: 'offset', value: num }),
    orderAsc: (field: string) => ({ type: 'orderAsc', field }),
    orderDesc: (field: string) => ({ type: 'orderDesc', field }),
};

type QueryFilter = ReturnType<typeof Query.equal>;

function buildFirestoreQuery(collectionRef: any, queries: QueryFilter[] = []) {
    const constraints: QueryConstraint[] = [];
    let limitValue = 100;

    for (const q of queries) {
        if (q.type === 'equal') {
            // Handle $id specially
            if (q.field === '$id') {
                // This will be handled separately for getDocument
                continue;
            }
            constraints.push(where(q.field, '==', q.value));
        } else if (q.type === 'notEqual') {
            constraints.push(where(q.field, '!=', q.value));
        } else if (q.type === 'orderAsc') {
            constraints.push(orderBy(q.field, 'asc'));
        } else if (q.type === 'orderDesc') {
            constraints.push(orderBy(q.field, 'desc'));
        } else if (q.type === 'limit') {
            limitValue = q.value;
        }
    }

    constraints.push(limit(limitValue));

    return query(collectionRef, ...constraints);
}

// Map collection names from Appwrite to Firebase
function getCollectionName(appwriteCollection: string): string {
    const map: Record<string, string> = {
        'profiles': COLLECTIONS.PROFILES,
        'posts': COLLECTIONS.POSTS,
        'likes': COLLECTIONS.LIKES,
        'follows': COLLECTIONS.FOLLOWS,
        'reposts': COLLECTIONS.REPOSTS,
        'profile_links': COLLECTIONS.PROFILE_LINKS,
    };
    return map[appwriteCollection] || appwriteCollection;
}

// Databases compatibility object
export const databases = {
    async getDocument(databaseId: string, collectionId: string, documentId: string) {
        const collName = getCollectionName(collectionId);
        const docRef = doc(db, collName, documentId);
        const docSnap = await getDoc(docRef);

        if (!docSnap.exists()) {
            throw new Error('Document not found');
        }

        return {
            $id: docSnap.id,
            ...docSnap.data()
        };
    },

    async listDocuments(databaseId: string, collectionId: string, queries: QueryFilter[] = []) {
        const collName = getCollectionName(collectionId);
        const collRef = collection(db, collName);

        // Check if we have an $id query (for fetching multiple specific documents)
        const idQuery = queries.find(q => q.field === '$id');

        if (idQuery && Array.isArray(idQuery.value)) {
            // Fetch multiple documents by ID
            const docs = await Promise.all(
                idQuery.value.map(async (id: string) => {
                    try {
                        const docSnap = await getDoc(doc(db, collName, id));
                        if (docSnap.exists()) {
                            return { $id: docSnap.id, ...docSnap.data() };
                        }
                        return null;
                    } catch {
                        return null;
                    }
                })
            );

            const validDocs = docs.filter(Boolean);
            return {
                documents: validDocs,
                total: validDocs.length
            };
        }

        const q = buildFirestoreQuery(collRef, queries);
        const querySnapshot = await getDocs(q);

        const documents = querySnapshot.docs.map(docSnap => ({
            $id: docSnap.id,
            ...docSnap.data()
        }));

        return {
            documents,
            total: documents.length
        };
    },

    async createDocument(databaseId: string, collectionId: string, documentId: string, data: any) {
        const collName = getCollectionName(collectionId);

        // If documentId looks like a unique ID generator call, create with auto ID
        if (documentId === 'unique()' || documentId.startsWith('unique')) {
            const docRef = await addDoc(collection(db, collName), {
                ...data,
                created_at: new Date().toISOString()
            });
            return { $id: docRef.id, ...data };
        }

        // Otherwise use the provided ID
        await setDoc(doc(db, collName, documentId), {
            ...data,
            created_at: new Date().toISOString()
        });

        return { $id: documentId, ...data };
    },

    async updateDocument(databaseId: string, collectionId: string, documentId: string, data: any) {
        const collName = getCollectionName(collectionId);
        const docRef = doc(db, collName, documentId);

        await updateDoc(docRef, {
            ...data,
            updated_at: new Date().toISOString()
        });

        return { $id: documentId, ...data };
    },

    async deleteDocument(databaseId: string, collectionId: string, documentId: string) {
        const collName = getCollectionName(collectionId);
        const docRef = doc(db, collName, documentId);
        await deleteDoc(docRef);
        return { $id: documentId };
    }
};

// ID generator compatibility
export const ID = {
    unique: () => 'unique()'
};

// Storage compatibility (placeholder - we use R2 now)
export const storage = {
    createFile: async () => { throw new Error('Use R2 for storage') },
    getFileView: () => { throw new Error('Use R2 for storage') }
};

// Account compatibility
export { auth as account } from './client';

// Config compatibility
export const APPWRITE_CONFIG = {
    DATABASE_ID: 'vscotr-db',
    COLLECTIONS: COLLECTIONS,
    BUCKET_ID: 'photos'
};
