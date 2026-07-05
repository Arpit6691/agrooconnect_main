const { GoogleGenAI } = require('@google/genai');

const getMockRecommendation = (soilType, season, location) => {
  // Validate location spelling/gibberish for the mock
  if (!location || location.trim().length < 3 || /^[0-9]+$/.test(location) || /(.)\1{3,}/.test(location)) {
    return { error: "Please enter a valid, correctly spelled location or region." };
  }

  let crop = "Wheat & Soybeans";
  let yieldAmt = "3.5 tons/ha";
  
  if (soilType === 'Clay') { crop = "Rice & Cotton"; yieldAmt = "4.2 tons/ha"; }
  else if (soilType === 'Sandy') { crop = "Carrots & Melons"; yieldAmt = "2.8 tons/ha"; }
  else if (soilType === 'Silt') { crop = "Lettuce & Cabbage"; yieldAmt = "5.1 tons/ha"; }
  
  if (season && season.includes('Winter')) { crop = "Winter Wheat & Garlic"; }
  else if (season && season.includes('Summer')) { crop = "Corn & Sunflowers"; }

  return {
    crop: crop,
    confidence: Math.floor(Math.random() * 10 + 85) + "%",
    yield: yieldAmt,
    demand: "Very High",
    priceTrend: "Upward (+8%)"
  };
};

const getMockMarketDemand = (crop, location) => {
  if (!location || location.trim().length < 3 || /^[0-9]+$/.test(location) || /(.)\1{3,}/.test(location)) {
    return { error: "Please enter a valid, correctly spelled location or region." };
  }

  return {
    trend: "Upward",
    demand: "High",
    priceForecast: "Expected to rise by 10-15% over the next quarter."
  };
};

exports.getRecommendation = async (req, res) => {
  try {
    const { soilType, season, location } = req.body;

    if (!process.env.GEMINI_API_KEY || process.env.GEMINI_API_KEY === 'dummy_gemini_key') {
      return res.status(200).json({ success: true, data: getMockRecommendation(soilType, season, location) });
    }

    const ai = new GoogleGenAI({ apiKey: process.env.GEMINI_API_KEY });
    const response = await ai.models.generateContent({
      model: 'gemini-2.5-flash',
      contents: `Act as an expert agricultural advisor. Recommend the best crop to plant based on: Soil Type: ${soilType}, Season: ${season}, Location: ${location}. 
      CRITICAL INSTRUCTION: If the Location provided (${location}) is spelled incorrectly, does not exist, or is gibberish, you MUST respond ONLY with the JSON object: {"error": "Please enter a valid, correctly spelled location or region."}.
      Otherwise, respond ONLY with a valid JSON object with the exact following keys: "crop" (string), "confidence" (string like "85%"), "yield" (string like "3 tons/ha"), "demand" (string like "High"), "priceTrend" (string like "+5% (Upward)"). Do not include any other text or markdown formatting outside the JSON.`,
    });

    let jsonStr = response.text.replace(/```json/g, '').replace(/```/g, '').trim();
    let data;
    try {
      data = JSON.parse(jsonStr);
    } catch (e) {
      // Fallback if AI messes up the JSON
      data = getMockRecommendation(soilType, season, location);
    }

    res.status(200).json({ success: true, data });
  } catch (err) {
    console.error("Gemini API Error:", err.message);
    res.status(200).json({ success: true, data: getMockRecommendation(req.body.soilType, req.body.season, req.body.location) });
  }
};

exports.getMarketDemand = async (req, res) => {
  try {
    const { crop, location } = req.body;

    if (!process.env.GEMINI_API_KEY || process.env.GEMINI_API_KEY === 'dummy_gemini_key') {
      return res.status(200).json({ success: true, data: getMockMarketDemand(crop, location) });
    }

    const ai = new GoogleGenAI({ apiKey: process.env.GEMINI_API_KEY });
    const response = await ai.models.generateContent({
      model: 'gemini-2.5-flash',
      contents: `Analyze the current and future market demand for ${crop} in ${location}. 
      You MUST respond ONLY with a valid JSON object with the exact following keys: "trend" (string like "Upward" or "Downward"), "demand" (string like "High", "Medium", "Low"), "priceForecast" (string sentence predicting price over next 3 months). Do not include any other text or markdown.`,
    });

    let jsonStr = response.text.replace(/```json/g, '').replace(/```/g, '').trim();
    let data;
    try {
      data = JSON.parse(jsonStr);
    } catch (e) {
      data = getMockMarketDemand(crop, location);
    }

    res.status(200).json({ success: true, data });
  } catch (err) {
    console.error("Gemini API Error:", err.message);
    res.status(200).json({ success: true, data: getMockMarketDemand(req.body.crop, req.body.location) });
  }
};
