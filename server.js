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

// Helper function to fetch and scrape the eBay page content
const scrapeEbayPage = async (url) => {
  try {
    console.log("Fetching eBay page:", url); // Log URL
    const response = await axios.get(url);
    const $ = cheerio.load(response.data);

    // Scrape boat details from eBay page
    const makeModel = $("h1 span span[itemprop='name']").text() || "Need to Add!";
    const rrp = $("span#mm-saleDscPrc").text() || "Need to Add!";
    const engines = $("li[data-id='engine']").text() || "Need to Add!";
    const length = $("li[data-id='length']").text() || "Need to Add!";
    const fuel = $("li[data-id='fuel']").text() || "Need to Add!";
    const speed = $("li[data-id='speed']").text() || "Need to Add!";
    const condition = $("div.item-condition span").text() || "Need to Add!";
    const accessoriesExtras = $("li[data-id='accessories']").text() || "Need to Add!";
    const trailer = $("li[data-id='trailer']").text() || "Need to Add!";
    const additional = $("div#desc_ifr").text() || "Need to Add!";

    // Log the scraped boat details
    console.log("Scraped Boat Details:", {
      makeModel,
      rrp,
      engines,
      length,
      fuel,
      speed,
      condition,
      accessoriesExtras,
      trailer,
      additional
    });

    return {
      makeModel,
      rrp,
      engines,
      length,
      fuel,
      speed,
      condition,
      accessoriesExtras,
      trailer,
      additional,
    };
  } catch (error) {
    console.error("Error fetching or scraping eBay page:", error);
    throw new Error("Failed to scrape eBay page.");
  }
};

app.post("/optimize-listing-url", async (req, res) => {
  const ebayUrl = req.body.ebayUrl;

  if (!ebayUrl) {
    return res.status(400).json({ error: "eBay URL is required" });
  }

  try {
    // Step 1: Scrape eBay page content
    const boatDetails = await scrapeEbayPage(ebayUrl);
    console.log("Scraped Boat Details:", boatDetails); // Log scraped details

    // Step 2: Create the prompt for OpenAI with scraped data
    const prompt = `
You are an expert boat listing optimizer.

Here are the boat details scraped from an eBay page:

Make/Model: ${boatDetails.makeModel}
RRP (£): ${boatDetails.rrp}
Engines: ${boatDetails.engines}
Length: ${boatDetails.length}
Fuel: ${boatDetails.fuel}
Speed: ${boatDetails.speed}
Condition: ${boatDetails.condition}
Accessories/Extras: ${boatDetails.accessoriesExtras}
Trailer: ${boatDetails.trailer}
Additional: ${boatDetails.additional}

⚡ If any field is missing, write "Need to Add!" next to it.

Return the result in this JSON format:
{
  "makeModel": "...",
  "rrp": "...",
  "engines": "...",
  "length": "...",
  "fuel": "...",
  "speed": "...",
  "condition": "...",
  "accessoriesExtras": "...",
  "trailer": "...",
  "additional": "..."
}
    `.trim();

    console.log("Prompt for OpenAI:", prompt); // Log prompt before sending

    // Step 3: Ask OpenAI to optimize the boat listing based on the scraped details
    const completion = await openai.chat.completions.create({
      model: "gpt-3.5-turbo", // you can use "gpt-4" for richer results
      messages: [
        { role: "system", content: "You are a helpful assistant that optimizes boat listings based on extracted details." },
        { role: "user", content: prompt },
      ],
    });

    const textResponse = completion.choices[0].message.content;
    console.log("AI response:", textResponse); // Log AI response

    let parsed;
    try {
      parsed = JSON.parse(textResponse);
    } catch (parseError) {
      console.error("Error parsing AI response:", parseError);
      console.error("AI raw response:", textResponse);
      return res.status(500).json({ error: "Failed to parse AI response." });
    }

    // Step 4: Send back the optimized response
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
