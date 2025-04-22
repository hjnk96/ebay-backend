require("dotenv").config();
const express = require("express");
const cors = require("cors"); // ✅ Step 1: Import CORS

const app = express();
const port = process.env.PORT || 3000;

app.use(cors()); // ✅ Step 2: Enable CORS for all origins (for now)
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

  res.json({ response: dummyOptimizedListing });
});

// Optional health check route
app.get("/", (req, res) => {
  res.send("Backend is running!");
});

app.listen(port, () => {
  console.log(`Server is running on port ${port}`);
});
