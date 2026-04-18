import { GoogleGenerativeAI } from "@google/generative-ai";

console.log("Starting test...");
const genAI = new GoogleGenerativeAI("AIzaSyBN4ah7NbhskExETkb3i_DVACAcaUL6kJA");

async function run() {
    try {
        const model = genAI.getGenerativeModel({ model: "gemini-1.5-flash" });
        const result = await model.generateContent("Hello world");
        const response = await result.response;
        console.log("SUCCESS! Result:", response.text());
    } catch (e) {
        console.error("FAILED! Error:", e);
    }
}

run();
