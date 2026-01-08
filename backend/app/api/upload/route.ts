import { NextResponse } from 'next/server';
import { writeFile, mkdir } from 'fs/promises';
import path from 'path';
import { verifyToken } from '@/lib/auth';



export async function POST(req: Request) {
    try {
        // 1. Security Check: Verify User
        const user = verifyToken(req);
        if (!user) {
            return NextResponse.json({ error: 'Unauthorized: No user linked' }, { status: 401 });
        }

        const formData = await req.formData();
        const file = formData.get('file') as File;

        if (!file) {
            return NextResponse.json({ error: 'No file provided' }, { status: 400 });
        }

        // 2. Security Check: Validate File Type
        const validTypes = ['image/jpeg', 'image/png', 'image/jpg', 'application/pdf'];
        if (!validTypes.includes(file.type)) {
            return NextResponse.json({ error: 'Invalid file type' }, { status: 400 });
        }

        const buffer = Buffer.from(await file.arrayBuffer());

        // 3. Linkage: Generate Filename with User ID
        // Format: userID_timestamp_originalName
        const timestamp = Date.now();
        const safeName = file.name.replace(/[^a-zA-Z0-9.]/g, '_'); // Sanitize
        const filename = `${user.userId}_${timestamp}_${safeName}`;

        // Ensure directory exists
        const uploadDir = path.join(process.cwd(), 'public', 'uploads');
        await mkdir(uploadDir, { recursive: true });

        // Save File
        await writeFile(path.join(uploadDir, filename), buffer);

        // 4. Return the public URL
        // In production, this would be an S3 URL. Locally, it's served from public.
        const fileUrl = `/uploads/${filename}`;

        return NextResponse.json({
            success: true,
            url: fileUrl,
            message: 'File uploaded and linked to user'
        });

    } catch (error: any) {
        console.error('Upload Error:', error);
        return NextResponse.json({ error: error.message }, { status: 500 });
    }
}
