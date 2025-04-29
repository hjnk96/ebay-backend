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

    // Log the scraped boat details to see what we're getting
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
You are an expert boat listing optimizer. Your task is to enhance the content of an eBay boat listing based on the provided information. Make the title and description more compelling, professional, and persuasive.

Boat Details:
Make & Model: ${boatDetails.makeModel}
RRP: ${boatDetails.rrp}
Engines: ${boatDetails.engines}
Length: ${boatDetails.length}
Fuel Type: ${boatDetails.fuel}
Speed: ${boatDetails.speed}
Condition: ${boatDetails.condition}
Accessories/Extras: ${boatDetails.accessoriesExtras}
Trailer: ${boatDetails.trailer}
Additional Information: ${boatDetails.additional}

Optimized Title and Description:`;

    // Step 3: Request OpenAI to optimize the title and description
    const optimizationResponse = await openai.chat.completions.create({
      model: "gpt-3.5-turbo",
      messages: [{ role: "user", content: prompt }],
    });

    // Step 4: Extract the optimized title and description
    const optimizedContent = optimizationResponse.choices[0].message.content;
    console.log("Optimized Content:", optimizedContent);

    // Step 5: Send back the optimized title and description
    res.json({
      optimizedTitleAndDescription: optimizedContent,
    });
  } catch (error) {
    console.error("Error during the optimization process:", error);
    res.status(500).json({ error: "Failed to optimize listing" });
  }
});

app.listen(port, () => {
  console.log(`Server is running on port ${port}`);
});
