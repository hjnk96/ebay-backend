require("dotenv").config();
const express = require("express");
const axios = require("axios");

const app = express();
const port = process.env.PORT || 3000;

app.use(express.json());

// POST request to optimize eBay listing
app.post("/optimize-listing-url", async (req, res) => {
  const ebayUrl = req.body.ebayUrl;

  if (!ebayUrl) {
    return res.status(400).json({ error: "eBay URL is required" });
  }

  try {
    // Extract eBay item ID from URL
    const ebayItemId = ebayUrl.split("/").pop();

    // Fetch item details from eBay API (using Finding API for example)
    const ebayApiResponse = await axios.get(
      `https://svcs.ebay.com/services/search/FindingService/v1`,
      {
        params: {
          OPERATION-NAME: "findItemsByKeywords",
          SERVICE-VERSION: "1.0.0",
          SECURITY-APPNAME: process.env.EBAY_APP_ID,  // Your eBay App ID
          REST-PAYLOAD: true,
          keywords: ebayItemId,
        },
      }
    );

    // Send data to OpenAI API for optimization
    const optimizationResponse = await axios.post(
      "https://api.openai.com/v1/completions",
      {
        model: "text-davinci-003",
        prompt: `Optimize this eBay listing: ${ebayApiResponse.data}`,
        max_tokens: 200,
      },
      {
        headers: {
          "Authorization": `Bearer ${process.env.OPENAI_API_KEY}`,  // Your OpenAI API key
        },
      }
    );

    res.json({ response: optimizationResponse.data.choices[0].text });

  } catch (error) {
    console.error(error);
    res.status(500).json({ error: "Something went wrong" });
  }
});

app.listen(port, () => {
  console.log(`Server is running on port ${port}`);
});
