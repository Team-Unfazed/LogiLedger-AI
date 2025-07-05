import Consignment from '../models/Consignment.js';
import User from '../models/User.js';
import { normalizeLocation, getMatchingConsignments, findMatchingMSMEs, locationsMatch } from '../utils/locationMatcher.js';

// Fallback in-memory storage if MongoDB is not available
export const consignments = new Map();

export const handleCreateConsignment = async (req, res) => {
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

    console.log("[CreateConsignment] User object:", req.user);
    console.log("[CreateConsignment] User type:", req.user.userType);
    
    if (req.user.userType !== "company") {
      console.log("[CreateConsignment] Not a company user");
      return res.status(403).json({
        success: false,
        message: "Only companies can create consignments",
      });
    }

    // Try MongoDB first, fallback to in-memory storage
    try {
      // Normalize location data
      const normalizedOrigin = normalizeLocation(origin);
      const normalizedDestination = normalizeLocation(destination);

      if (!normalizedOrigin || !normalizedDestination) {
        return res.status(400).json({
          success: false,
          message: "Invalid location format. Please use 'City, State' format",
        });
      }

      // Create consignment in MongoDB
      const consignment = new Consignment({
        title,
        origin: normalizedOrigin,
        destination: normalizedDestination,
        goodsType,
        weight: parseFloat(weight),
        deadline: new Date(deadline),
        budget: parseFloat(budget),
        description: description || "",
        status: "open",
        companyId: req.user._id,
        companyName: req.user.companyName || req.user.name,
        bidCount: 0,
      });

      await consignment.save();
      console.log("[CreateConsignment] Consignment created in MongoDB:", consignment);

      // Find matching MSMEs for this consignment
      const matchingMSMEs = await findMatchingMSMEs(normalizedOrigin);
      console.log(`[CreateConsignment] Found ${matchingMSMEs.length} matching MSMEs for location: ${origin}`);

      res.status(201).json({
        success: true,
        consignment,
        matchingMSMEs: matchingMSMEs.length,
        message: "Consignment created successfully",
      });
    } catch (mongoError) {
      console.log("[CreateConsignment] MongoDB failed, using in-memory storage:", mongoError.message);
      
      // Fallback to in-memory storage
      const { v4: uuidv4 } = await import('uuid');
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
        companyId: req.user.id || req.user._id,
        companyName: req.user.companyName || req.user.name,
        bidCount: 0,
        createdAt: new Date().toISOString(),
        updatedAt: new Date().toISOString(),
      };

      consignments.set(consignmentId, consignment);
      console.log("[CreateConsignment] Consignment created in memory:", consignment);

      res.status(201).json({
        success: true,
        consignment,
        message: "Consignment created successfully (in-memory storage)",
      });
    }
  } catch (error) {
    console.error("[CreateConsignment] Error:", error);
    res.status(500).json({
      success: false,
      message: "Internal server error",
    });
  }
};

export const handleGetMyConsignments = async (req, res) => {
  try {
    if (req.user.userType !== "company") {
      return res.status(403).json({
        success: false,
        message: "Only companies can view their consignments",
      });
    }

    try {
      const userConsignments = await Consignment.find({ companyId: req.user._id })
        .populate('awardedTo', 'companyName name')
        .sort({ createdAt: -1 });

      res.json({
        success: true,
        consignments: userConsignments,
      });
    } catch (mongoError) {
      console.log("[GetMyConsignments] MongoDB failed, using in-memory storage");
      
      // Fallback to in-memory storage
      const userConsignments = Array.from(consignments.values()).filter(
        (consignment) => consignment.companyId === req.user.id || consignment.companyId === req.user._id,
      );

      res.json({
        success: true,
        consignments: userConsignments,
      });
    }
  } catch (error) {
    console.error("Get consignments error:", error);
    res.status(500).json({
      success: false,
      message: "Internal server error",
    });
  }
};

export const handleGetAvailableConsignments = async (req, res) => {
  try {
    if (req.user.userType !== "msme") {
      return res.status(403).json({
        success: false,
        message: "Only MSMEs can view available consignments",
      });
    }

    // Get all open consignments from MongoDB
    const allConsignments = await Consignment.find({ status: "open" })
      .populate('companyId', 'companyName name')
      .sort({ createdAt: -1 });

    // Filter consignments based on MSME's location
    const user = await User.findById(req.user._id);
    const matchingConsignments = getMatchingConsignments(user.location, allConsignments);

    console.log(`[GetAvailableConsignments] User location: ${user.location?.city}, ${user.location?.state}`);
    console.log(`[GetAvailableConsignments] Total consignments: ${allConsignments.length}, Matching: ${matchingConsignments.length}`);

    // Add location match info to each consignment
    const consignmentsWithMatchInfo = matchingConsignments.map(consignment => {
      const isExactMatch = user.location && 
        consignment.origin.city?.toLowerCase() === user.location.city?.toLowerCase() &&
        consignment.origin.state?.toLowerCase() === user.location.state?.toLowerCase();

      return {
        ...consignment.toObject(),
        locationMatch: {
          isMatch: true,
          isExactMatch,
          userLocation: user.location,
          consignmentOrigin: consignment.origin
        }
      };
    });

    res.json({
      success: true,
      consignments: consignmentsWithMatchInfo,
      totalAvailable: allConsignments.length,
      matchingCount: matchingConsignments.length,
      userLocation: user.location
    });
  } catch (error) {
    console.error("Get available consignments error:", error);
    res.status(500).json({
      success: false,
      message: "Internal server error",
    });
  }
};

export const handleGetPublicConsignments = async (req, res) => {
  try {
    // Get all open consignments for public viewing (bidding page)
    const publicConsignments = await Consignment.find({ status: "open" })
      .populate('companyId', 'companyName name')
      .sort({ createdAt: -1 })
      .select('-companyId._id'); // Don't expose sensitive company details

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

export const handleGetConsignmentById = async (req, res) => {
  try {
    const { id } = req.params;
    const consignment = await Consignment.findById(id)
      .populate('companyId', 'companyName name')
      .populate('awardedTo', 'companyName name');

    if (!consignment) {
      return res.status(404).json({
        success: false,
        message: "Consignment not found",
      });
    }

    // Check if user has permission to view this consignment
    if (
              req.user.userType === "company" &&
      consignment.companyId.toString() !== req.user._id.toString()
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

export const handleUpdateConsignmentStatus = async (req, res) => {
  try {
    const { id } = req.params;
    const { status } = req.body;

    const consignment = await Consignment.findById(id);

    if (!consignment) {
      return res.status(404).json({
        success: false,
        message: "Consignment not found",
      });
    }

    // Only the company that created the consignment can update it
    if (consignment.companyId.toString() !== req.user._id.toString()) {
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
      "cancelled",
    ];
    if (!validStatuses.includes(status)) {
      return res.status(400).json({
        success: false,
        message: "Invalid status",
      });
    }

    consignment.status = status;
    await consignment.save();

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
export const incrementBidCount = async (consignmentId) => {
  try {
    await Consignment.findByIdAndUpdate(consignmentId, {
      $inc: { bidCount: 1 }
    });
  } catch (error) {
    console.error('Error incrementing bid count:', error);
  }
};

export const handleSeedConsignments = async (req, res) => {
  try {
    if (!req.user || req.user.userType !== "company") {
      return res.status(403).json({
        success: false,
        message: "Only authenticated company users can seed consignments",
      });
    }

    const consignment1 = new Consignment({
      title: "Electronics Delivery Mumbai to Delhi",
      origin: {
        city: "Mumbai",
        state: "Maharashtra",
        fullAddress: "Mumbai, Maharashtra"
      },
      destination: {
        city: "Delhi",
        state: "Delhi",
        fullAddress: "Delhi, Delhi"
      },
      goodsType: "electronics",
      weight: 500,
      deadline: new Date("2024-12-15"),
      budget: 25000,
      description: "Urgent delivery of electronic components",
      status: "open",
      companyId: req.user._id,
      companyName: req.user.companyName || req.user.name,
      bidCount: 0,
    });

    const consignment2 = new Consignment({
      title: "Textile Shipment Chennai to Bangalore",
      origin: {
        city: "Chennai",
        state: "Tamil Nadu",
        fullAddress: "Chennai, Tamil Nadu"
      },
      destination: {
        city: "Bangalore",
        state: "Karnataka",
        fullAddress: "Bangalore, Karnataka"
      },
      goodsType: "textiles",
      weight: 1200,
      deadline: new Date("2024-12-20"),
      budget: 18000,
      description: "Cotton textile shipment for manufacturing",
      status: "open",
      companyId: req.user._id,
      companyName: req.user.companyName || req.user.name,
      bidCount: 0,
    });

    await consignment1.save();
    await consignment2.save();

    res.json({
      success: true,
      message: "Seeded two consignments",
      consignments: [consignment1, consignment2],
    });
  } catch (error) {
    console.error("Error seeding consignments:", error);
    res.status(500).json({ success: false, message: "Error seeding consignments" });
  }
};

export const handleGetLocationRecommendations = async (req, res) => {
  try {
    if (req.user.userType !== "msme") {
      return res.status(403).json({
        success: false,
        message: "Only MSMEs can get location recommendations",
      });
    }

    const user = await User.findById(req.user._id);
    if (!user.location) {
      return res.status(400).json({
        success: false,
        message: "Please update your location information to get recommendations",
      });
    }

    // Get all open consignments
    const allConsignments = await Consignment.find({ status: "open" })
      .populate('companyId', 'companyName name')
      .sort({ createdAt: -1 });

    // Filter consignments based on MSME's location
    const matchingConsignments = getMatchingConsignments(user.location, allConsignments);

    // Find nearby MSMEs for potential partnerships
    const nearbyMSMEs = await User.find({
      companyType: 'msme',
      _id: { $ne: req.user._id },
      location: { $exists: true }
    });

    const nearbyPartners = nearbyMSMEs.filter(msme => {
      if (!msme.location) return false;
      return locationsMatch(user.location, msme.location, 100); // 100km radius
    }).slice(0, 5); // Top 5 nearby partners

    // Get location statistics
    const locationStats = {
      totalConsignments: allConsignments.length,
      matchingConsignments: matchingConsignments.length,
      nearbyPartners: nearbyPartners.length,
      userLocation: user.location
    };

    res.json({
      success: true,
      recommendations: {
        matchingConsignments: matchingConsignments.slice(0, 10), // Top 10 matches
        nearbyPartners,
        locationStats
      }
    });
  } catch (error) {
    console.error("Get location recommendations error:", error);
    res.status(500).json({
      success: false,
      message: "Internal server error",
    });
  }
};


