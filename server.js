require("dotenv").config();
const express = require("express");

const app = express();
const port = process.env.PORT || 3000;

app.use(express.json());

// POST request to optimize eBay listing (using dummy data)
app.post("/optimize-listing-url", async (req, res) => {
  const ebayUrl = req.body.ebayUrl;

  if (!ebayUrl) {
    return res.status(400).json({ error: "eBay URL is required" });
  }

  // Mock response as if the OpenAI API and eBay API were called
  const dummyOptimizedListing = {
    title: "Optimized eBay Listing Title",
    description: "Here’s the optimized description based on the eBay URL you provided."
  };

  // Simulating a success response with dummy data
  res.json({ response: dummyOptimizedListing });
});

app.listen(port, () => {
  console.log(`Server is running on port ${port}`);
});
