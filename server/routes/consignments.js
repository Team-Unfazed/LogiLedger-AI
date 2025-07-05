import { v4 as uuidv4 } from "uuid";

// In-memory database (replace with actual database in production)
export const consignments = new Map();

export const handleCreateConsignment = (req, res) => {
  try {
    console.log("[CreateConsignment] user:", req.user);
    console.log("[CreateConsignment] body:", req.body);
    const {
      title,
      origin,
      destination,
      goodsType,
      weight,
      deadline,
      budget,
      description,
    } = req.body;

    // Validation
    if (
      !title ||
      !origin ||
      !destination ||
      !goodsType ||
      !weight ||
      !deadline ||
      !budget
    ) {
      console.log("[CreateConsignment] Validation failed");
      return res.status(400).json({
        success: false,
        message: "All required fields must be provided",
      });
    }

    if (req.user.userType !== "company") {
      console.log("[CreateConsignment] Not a company user");
      return res.status(403).json({
        success: false,
        message: "Only companies can create consignments",
      });
    }

    // Create consignment
    const consignmentId = uuidv4();
    const consignment = {
      id: consignmentId,
      title,
      origin,
      destination,
      goodsType,
      weight: parseFloat(weight),
      deadline,
      budget: parseFloat(budget),
      description: description || "",
      status: "open",
      companyId: req.user.id,
      companyName: req.user.companyName || req.user.name,
      bidCount: 0,
      createdAt: new Date().toISOString(),
      updatedAt: new Date().toISOString(),
    };

    consignments.set(consignmentId, consignment);
    console.log("[CreateConsignment] Consignment created:", consignment);

    res.status(201).json({
      success: true,
      consignment,
      message: "Consignment created successfully",
    });
  } catch (error) {
    console.error("[CreateConsignment] Error:", error);
    res.status(500).json({
      success: false,
      message: "Internal server error",
    });
  }
};

export const handleGetMyConsignments = (req, res) => {
  try {
    if (req.user.userType !== "company") {
      return res.status(403).json({
        success: false,
        message: "Only companies can view their consignments",
      });
    }

    const userConsignments = Array.from(consignments.values()).filter(
      (consignment) => consignment.companyId === req.user.id,
    );

    res.json({
      success: true,
      consignments: userConsignments,
    });
  } catch (error) {
    console.error("Get consignments error:", error);
    res.status(500).json({
      success: false,
      message: "Internal server error",
    });
  }
};

export const handleGetAvailableConsignments = (req, res) => {
  try {
    if (req.user.userType !== "msme") {
      return res.status(403).json({
        success: false,
        message: "Only MSMEs can view available consignments",
      });
    }

    // Get all open consignments
    const availableConsignments = Array.from(consignments.values()).filter(
      (consignment) => consignment.status === "open",
    );

    res.json({
      success: true,
      consignments: availableConsignments,
    });
  } catch (error) {
    console.error("Get available consignments error:", error);
    res.status(500).json({
      success: false,
      message: "Internal server error",
    });
  }
};

export const handleGetPublicConsignments = (req, res) => {
  try {
    // Get all open consignments for public viewing (bidding page)
    const publicConsignments = Array.from(consignments.values())
      .filter((consignment) => consignment.status === "open")
      .map((consignment) => ({
        ...consignment,
        // Don't expose sensitive company details in public view
        companyId: undefined,
      }));

    res.json({
      success: true,
      consignments: publicConsignments,
    });
  } catch (error) {
    console.error("Get public consignments error:", error);
    res.status(500).json({
      success: false,
      message: "Internal server error",
    });
  }
};

export const handleGetConsignmentById = (req, res) => {
  try {
    const { id } = req.params;
    const consignment = consignments.get(id);

    if (!consignment) {
      return res.status(404).json({
        success: false,
        message: "Consignment not found",
      });
    }

    // Check if user has permission to view this consignment
    if (
      req.user.userType === "company" &&
      consignment.companyId !== req.user.id
    ) {
      return res.status(403).json({
        success: false,
        message: "Access denied",
      });
    }

    res.json({
      success: true,
      consignment,
    });
  } catch (error) {
    console.error("Get consignment error:", error);
    res.status(500).json({
      success: false,
      message: "Internal server error",
    });
  }
};

export const handleUpdateConsignmentStatus = (req, res) => {
  try {
    const { id } = req.params;
    const { status } = req.body;

    const consignment = consignments.get(id);

    if (!consignment) {
      return res.status(404).json({
        success: false,
        message: "Consignment not found",
      });
    }

    // Only the company that created the consignment can update it
    if (consignment.companyId !== req.user.id) {
      return res.status(403).json({
        success: false,
        message: "Access denied",
      });
    }

    // Validate status
    const validStatuses = [
      "open",
      "awarded",
      "in_progress",
      "completed",
      "closed",
    ];
    if (!validStatuses.includes(status)) {
      return res.status(400).json({
        success: false,
        message: "Invalid status",
      });
    }

    consignment.status = status;
    consignment.updatedAt = new Date().toISOString();

    res.json({
      success: true,
      consignment,
      message: "Consignment status updated successfully",
    });
  } catch (error) {
    console.error("Update consignment error:", error);
    res.status(500).json({
      success: false,
      message: "Internal server error",
    });
  }
};

// Helper function to increment bid count
export const incrementBidCount = (consignmentId) => {
  const consignment = consignments.get(consignmentId);
  if (consignment) {
    consignment.bidCount = (consignment.bidCount || 0) + 1;
    consignment.updatedAt = new Date().toISOString();
  }
};

export const handleSeedConsignments = (req, res) => {
  try {
    if (!req.user || req.user.userType !== "company") {
      return res.status(403).json({
        success: false,
        message: "Only authenticated company users can seed consignments",
      });
    }
    const consignment1 = {
      id: uuidv4(),
      title: "Electronics Delivery Mumbai to Delhi",
      origin: "Mumbai, MH",
      destination: "Delhi, DL",
      goodsType: "electronics",
      weight: 500,
      deadline: "2024-12-15",
      budget: 25000,
      description: "Urgent delivery of electronic components",
      status: "open",
      companyId: req.user.id,
      companyName: req.user.companyName || req.user.name,
      bidCount: 0,
      createdAt: new Date().toISOString(),
      updatedAt: new Date().toISOString(),
    };
    const consignment2 = {
      id: uuidv4(),
      title: "Textile Shipment Chennai to Bangalore",
      origin: "Chennai, TN",
      destination: "Bangalore, KA",
      goodsType: "textiles",
      weight: 1200,
      deadline: "2024-12-20",
      budget: 18000,
      description: "Cotton textile shipment for manufacturing",
      status: "open",
      companyId: req.user.id,
      companyName: req.user.companyName || req.user.name,
      bidCount: 0,
      createdAt: new Date().toISOString(),
      updatedAt: new Date().toISOString(),
    };
    consignments.set(consignment1.id, consignment1);
    consignments.set(consignment2.id, consignment2);
    res.json({
      success: true,
      message: "Seeded two consignments",
      consignments: [consignment1, consignment2],
    });
  } catch (error) {
    res.status(500).json({ success: false, message: "Error seeding consignments" });
  }
};


