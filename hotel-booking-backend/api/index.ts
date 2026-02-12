
import app from "../src/index";
import { connectDB } from "../src/db";

export default async function handler(req: any, res: any) {
    // Ensure DB is connected before handling the request
    await connectDB();

    // Forward request to Express app
    return app(req, res);
}
