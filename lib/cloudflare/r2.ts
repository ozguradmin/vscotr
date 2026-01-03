import { S3Client } from "@aws-sdk/client-s3";

export const r2Client = new S3Client({
    region: "auto",
    endpoint: `https://${process.env.CLOUDFLARE_ACCOUNT_ID}.r2.cloudflarestorage.com`,
    credentials: {
        accessKeyId: process.env.R2_ACCESS_KEY_ID || "",
        secretAccessKey: process.env.R2_SECRET_ACCESS_KEY || "",
    },
});

export const R2_BUCKET_NAME = "vscotr-images";
// Note: This public URL will be used for reading images via Weserv or directly
// Currently relying on user to provide the public R2.dev or custom domain
export const R2_PUBLIC_URL_BASE = process.env.R2_PUBLIC_URL || "";
