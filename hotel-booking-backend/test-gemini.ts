import { GoogleGenerativeAI } from "@google/generative-ai";

console.log("Starting test...");
const genAI = new GoogleGenerativeAI("AIzaSyBN4ah7NbhskExETkb3i_DVACAcaUL6kJA");

async function run() {
    try {
        const model = genAI.getGenerativeModel({ model: "gemini-flash-latest" });
        const result = await model.generateContent("Hello world");
        const response = await result.response;
        console.log("SUCCESS! Result:", response.text());
    } catch (e: any) {
        console.error("FAILED! Error name:", e.name);
        console.error("Message:", e.message);
        if (e.status) console.error("Status:", e.status);
    }
}

run();
