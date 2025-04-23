require("dotenv").config();  // Load environment variables from .env file

// Log to check if the API key is loaded properly
console.log('Loaded OpenAI API Key:', process.env.OPENAI_API_KEY ? "✔️" : "❌");

const express = require("express");
const cors = require("cors");
const { OpenAI } = require("openai");  // Destructure OpenAI correctly for SDK v4.x

const app = express();
const port = process.env.PORT || 3000;

app.use(cors());
app.use(express.json());

// Setup OpenAI API client
const openai = new OpenAI({
  apiKey: process.env.OPENAI_API_KEY,  // Using the API key from the environment
});

// POST request to optimize eBay listing
app.post("/optimize-listing-url", async (req, res) => {
  const ebayUrl = req.body.ebayUrl;

  if (!ebayUrl) {
    return res.status(400).json({ error: "eBay URL is required" });
  }

  try {
    // Craft the prompt for optimization
    const prompt = `
You are an expert in online sales optimization.

Given this eBay product listing URL: ${ebayUrl}

Generate:
1. An optimized, eye-catching title (max 80 characters)
2. A professional, engaging product description (max 600 characters)

Return the result in this JSON format:
{
  "title": "...",
  "description": "..."
}
    `.trim();

    // Send request to OpenAI API for the optimized result
    const completion = await openai.chat.completions.create({
      model: "gpt-3.5-turbo",  // Using gpt-3.5-turbo model
      messages: [
        { role: "system", content: "You are a helpful eBay listing optimizer." },
        { role: "user", content: prompt },
      ],
    });

    const textResponse = completion.choices[0].message.content;
    const parsed = JSON.parse(textResponse);  // Parsing the returned result

    res.json({ response: parsed });  // Send the response back to the client
  } catch (err) {
    console.error("Error generating AI response:", err);  // Log the error for debugging
    res.status(500).json({ error: "Failed to generate optimized listing" });
  }
});

// Simple route to check if backend is running
app.get("/", (req, res) => {
  res.send("Backend is running!");
});

// Start the server on the specified port
app.listen(port, () => {
  console.log(`Server is running on port ${port}`);
});
