import { NextRequest, NextResponse } from "next/server";
import { getSignedUrl } from "@aws-sdk/s3-request-presigner";
import { PutObjectCommand } from "@aws-sdk/client-s3";
import { r2Client, R2_BUCKET_NAME, R2_PUBLIC_URL_BASE } from "@/lib/cloudflare/r2";
import { ID } from "@/lib/appwrite/client";

export async function POST(req: NextRequest) {
    try {
        const { filename, contentType } = await req.json();

        // Unique file ID
        const fileId = ID.unique();
        const fileExtension = filename.split('.').pop();
        const key = `${fileId}.${fileExtension}`;

        const command = new PutObjectCommand({
            Bucket: R2_BUCKET_NAME,
            Key: key,
            ContentType: contentType,
        });

        const uploadUrl = await getSignedUrl(r2Client, command, { expiresIn: 3600 });
        const publicUrl = `${R2_PUBLIC_URL_BASE}/${key}`;

        return NextResponse.json({ uploadUrl, publicUrl, fileId });
    } catch (error: any) {
        console.error("R2 Presign Error:", error);
        return NextResponse.json({ error: error.message }, { status: 500 });
    }
}
