export const handleDemo = (req, res) => {
  res.json({
    message: "LogiLedger AI - Digitizing Logistics & Accounting for India",
    features: [
      "Smart Bidding System",
      "AI-Powered Accounting",
      "WhatsApp Integration with Autobook AI",
      "OCR Processing",
      "Multi-language Support",
      "Invoice Generation",
    ],
    version: "1.0.0",
    timestamp: new Date().toISOString(),
  });
};
