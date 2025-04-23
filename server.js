require("dotenv").config();
const express = require("express");
const cors = require("cors");
const OpenAI = require("openai"); // updated for SDK v4.x

const app = express();
const port = process.env.PORT || 3000;

app.use(cors());
app.use(express.json());

// Setup OpenAI
const openai = new OpenAI({
  apiKey: process.env.OPENAI_API_KEY,
});

// POST request to optimize eBay listing
app.post("/optimize-listing-url", async (req, res) => {
  const ebayUrl = req.body.ebayUrl;

  if (!ebayUrl) {
    return res.status(400).json({ error: "eBay URL is required" });
  }

  try {
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

    const completion = await openai.chat.completions.create({
      model: "gpt-3.5-turbo",
      messages: [
        { role: "system", content: "You are a helpful eBay listing optimizer." },
        { role: "user", content: prompt },
      ],
    });

    const textResponse = completion.choices[0].message.content;
    const parsed = JSON.parse(textResponse);

    res.json({ response: parsed });
  } catch (err) {
    console.error("Error generating AI response:", err);
    res.status(500).json({ error: "Failed to generate optimized listing" });
  }
});

app.get("/", (req, res) => {
  res.send("Backend is running!");
});

app.listen(port, () => {
  console.log(`Server is running on port ${port}`);
});
