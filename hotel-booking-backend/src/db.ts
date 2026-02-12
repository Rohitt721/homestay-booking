import mongoose from "mongoose";

let isConnected = false;

export const connectDB = async () => {
    if (isConnected) {
        console.log("=> Using existing database connection");
        return;
    }

    try {
        const db = await mongoose.connect(process.env.MONGODB_CONNECTION_STRING as string, {
            serverSelectionTimeoutMS: 5000,
            socketTimeoutMS: 45000,
        });

        isConnected = db.connections[0].readyState === 1;
        console.log("=> Database connected successfully");
    } catch (error) {
        console.error("=> Error connecting to database:", error);
        // Don't exit process in serverless, just throw
        throw error;
    }
};
