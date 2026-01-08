import jwt from 'jsonwebtoken';

const JWT_SECRET = process.env.JWT_SECRET || 'fallback_secret_dev_only';

export interface DecodedToken {
    userId: string;
    role: string;
    status: string;
}

export function verifyToken(req: Request): DecodedToken | null {
    try {
        const authHeader = req.headers.get('Authorization');
        if (!authHeader || !authHeader.startsWith('Bearer ')) {
            return null;
        }

        const token = authHeader.split(' ')[1];
        const decoded = jwt.verify(token, JWT_SECRET) as DecodedToken;
        return decoded;
    } catch (error) {
        return null;
    }
}
