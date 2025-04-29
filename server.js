require("dotenv").config();
const express = require("express");
const cors = require("cors");
const OpenAI = require("openai");
const axios = require("axios");
const cheerio = require("cheerio");

const app = express();
const port = process.env.PORT || 10000;

app.use(cors());
app.use(express.json());

const openai = new OpenAI({
  apiKey: process.env.OPENAI_API_KEY,
});

// Helper to scrape eBay
const scrapeEbayPage = async (url) => {
  try {
    const response = await axios.get(url);
    const $ = cheerio.load(response.data);

    const makeModel = $("h1 span span[itemprop='name']").text() || "Unknown model";
    const rrp = $("span#mm-saleDscPrc").text() || "Not listed";
    const engines = $("li[data-id='engine']").text() || "Not listed";
    const length = $("li[data-id='length']").text() || "Not listed";
    const fuel = $("li[data-id='fuel']").text() || "Not listed";
    const speed = $("li[data-id='speed']").text() || "Not listed";
    const condition = $("div.item-condition span").text() || "Unknown";
    const accessoriesExtras = $("li[data-id='accessories']").text() || "Not listed";
    const trailer = $("li[data-id='trailer']").text() || "Not listed";

    return {
      makeModel,
      rrp,
      engines,
      length,
      fuel,
      speed,
      condition,
      accessoriesExtras,
      trailer
    };
  } catch (err) {
    console.error("Scraping error:", err.message);
    throw new Error("Failed to scrape eBay page.");
  }
};

// API endpoint
app.post("/optimize-listing-url", async (req, res) => {
  const ebayUrl = req.body.ebayUrl;

  if (!ebayUrl) {
    return res.status(400).json({ error: "eBay URL is required." });
  }

  try {
    const scraped = await scrapeEbayPage(ebayUrl);

    const prompt = `You are a professional boat listing copywriter. Based on the following details, write a compelling eBay listing title and description:\n\n
Make & Model: ${scraped.makeModel}
RRP: ${scraped.rrp}
Engine(s): ${scraped.engines}
Length: ${scraped.length}
Fuel: ${scraped.fuel}
Speed: ${scraped.speed}
Condition: ${scraped.condition}
Accessories/Extras: ${scraped.accessoriesExtras}
Trailer: ${scraped.trailer}

Respond with a JSON in the format: { "title": "...", "description": "..." }
`;

    const chatResponse = await openai.chat.completions.create({
      model: "gpt-4",
      messages: [{ role: "user", content: prompt }],
      temperature: 0.7
    });

    const text = chatResponse.choices[0].message.content.trim();

    // Try to safely parse the result
    let result;
    try {
      result = JSON.parse(text);
    } catch (err) {
      return res.status(500).json({ error: "Failed to parse OpenAI response", raw: text });
    }

    return res.json({ ...result, scraped });

  } catch (err) {
    console.error("Error:", err.message);
    return res.status(500).json({ error: err.message });
  }
});

app.listen(port, () => {
  console.log(`Server is running on port ${port}`);
});
