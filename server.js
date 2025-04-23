require("dotenv").config();
const express = require("express");
const cors = require("cors");
const { Configuration, OpenAIApi } = require("openai");

const app = express();
const port = process.env.PORT || 3000;

app.use(cors());
app.use(express.json());

// 🔑 Setup OpenAI
const configuration = new Configuration({
  apiKey: process.env.OPENAI_API_KEY, // Make sure it's set on Render!
});
const openai = new OpenAIApi(configuration);

// 🧠 AI-powered route
app.post("/optimize-listing-url", async (req, res) => {
  const ebayUrl = req.body.ebayUrl;

  if (!ebayUrl) {
    return res.status(400).json({ error: "eBay URL is required" });
  }

  try {
    const prompt = `
You are an expert eBay listing optimizer. Given this eBay URL:
${ebayUrl}

Generate a compelling eBay title and description to help it sell better. Be concise, keyword-rich, and professional.
`;

    const response = await openai.createChatCompletion({
      model: "gpt-3.5-turbo",
      messages: [{ role: "user", content: prompt }],
      max_tokens: 300,
    });

    const aiText = response.data.choices[0].message.content;

    // Basic split into title and description
    const [titleLine, ...descLines] = aiText.split("\n").filter(Boolean);
    const title = titleLine.replace(/^Title:\s*/i, "").trim();
    const description = descLines.join("\n").replace(/^Description:\s*/i, "").trim();

    res.json({
      response: {
        title,
        description,
      },
    });
  } catch (error) {
    console.error("OpenAI error:", error);
    res.status(500).json({ error: "Failed to generate listing. Try again later." });
  }
});

// Optional health check
app.get("/", (req, res) => {
  res.send("Backend is running!");
});

app.listen(port, () => {
  console.log(`Server is running on port ${port}`);
});
