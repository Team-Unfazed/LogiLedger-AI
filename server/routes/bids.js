import { v4 as uuidv4 } from "uuid";
import { consignments, incrementBidCount } from "./consignments.js";
import Bid from '../models/Bid.js';
import Consignment from '../models/Consignment.js';

// In-memory database (fallback if MongoDB is not available)
const bids = new Map();

export const handleCreateBid = async (req, res) => {
  try {
    console.log("[CreateBid] user:", req.user);
    console.log("[CreateBid] body:", req.body);
    
    const { consignmentId, bidAmount, estimatedDelivery, notes } = req.body;

    // Validation
    if (!consignmentId || !bidAmount || !estimatedDelivery) {
      return res.status(400).json({
        success: false,
        message:
          "Consignment ID, bid amount, and estimated delivery are required",
      });
    }

    if (req.user.userType !== "msme") {
      return res.status(403).json({
        success: false,
        message: "Only MSMEs can place bids",
      });
    }

    // Try MongoDB first, fallback to in-memory storage
    try {
      // Check if consignment exists and is open in MongoDB
      const consignment = await Consignment.findById(consignmentId);
      if (!consignment) {
        return res.status(404).json({
          success: false,
          message: "Consignment not found",
        });
      }

      if (consignment.status !== "open") {
        return res.status(400).json({
          success: false,
          message: "This consignment is no longer accepting bids",
        });
      }

      // Check if user already bid on this consignment
      const existingBid = await Bid.findOne({
        consignmentId: consignmentId,
        bidderId: req.user._id
      });

      if (existingBid) {
        return res.status(400).json({
          success: false,
          message: "You have already placed a bid on this consignment",
        });
      }

      // Validate bid amount
      if (parseFloat(bidAmount) > consignment.budget) {
        return res.status(400).json({
          success: false,
          message: "Bid amount cannot exceed the maximum budget",
        });
      }

      // Validate estimated delivery
      const estimatedDate = new Date(estimatedDelivery);
      const deadline = new Date(consignment.deadline);
      if (estimatedDate > deadline) {
        return res.status(400).json({
          success: false,
          message: "Estimated delivery cannot be after the deadline",
        });
      }

      // Create bid in MongoDB
      const bid = new Bid({
        consignmentId,
        bidderId: req.user._id,
        bidderName: req.user.name,
        bidderCompany: req.user.companyName || req.user.name,
        bidderEmail: req.user.email,
        amount: parseFloat(bidAmount),
        estimatedDeliveryTime: Math.ceil((estimatedDate - new Date()) / (1000 * 60 * 60 * 24)), // days
        status: "pending",
        message: notes || "",
      });

      await bid.save();

      // Increment bid count on consignment
      await incrementBidCount(consignmentId);

      console.log("[CreateBid] Bid created in MongoDB:", bid);

      res.status(201).json({
        success: true,
        bid,
        message: "Bid placed successfully",
      });
    } catch (mongoError) {
      console.log("[CreateBid] MongoDB failed, using in-memory storage:", mongoError.message);
      
      // Fallback to in-memory storage
      const consignment = consignments.get(consignmentId);
      if (!consignment) {
        return res.status(404).json({
          success: false,
          message: "Consignment not found",
        });
      }

      if (consignment.status !== "open") {
        return res.status(400).json({
          success: false,
          message: "This consignment is no longer accepting bids",
        });
      }

      // Check if user already bid on this consignment
      const existingBid = Array.from(bids.values()).find(
        (bid) =>
          bid.consignmentId === consignmentId && bid.bidderId === req.user.id,
      );

      if (existingBid) {
        return res.status(400).json({
          success: false,
          message: "You have already placed a bid on this consignment",
        });
      }

      // Validate bid amount
      if (parseFloat(bidAmount) > consignment.budget) {
        return res.status(400).json({
          success: false,
          message: "Bid amount cannot exceed the maximum budget",
        });
      }

      // Validate estimated delivery
      const estimatedDate = new Date(estimatedDelivery);
      const deadline = new Date(consignment.deadline);
      if (estimatedDate > deadline) {
        return res.status(400).json({
          success: false,
          message: "Estimated delivery cannot be after the deadline",
        });
      }

      // Create bid in memory
      const bidId = uuidv4();
      const bid = {
        id: bidId,
        consignmentId,
        consignmentTitle: consignment.title,
        bidderId: req.user.id,
        bidderName: req.user.name,
        bidderCompany: req.user.companyName || req.user.name,
        bidAmount: parseFloat(bidAmount),
        estimatedDelivery,
        notes: notes || "",
        status: "pending",
        createdAt: new Date().toISOString(),
      };

      bids.set(bidId, bid);

      // Increment bid count on consignment
      incrementBidCount(consignmentId);

      console.log("[CreateBid] Bid created in memory:", bid);

      res.status(201).json({
        success: true,
        bid,
        message: "Bid placed successfully (in-memory storage)",
      });
    }
  } catch (error) {
    console.error("Create bid error:", error);
    res.status(500).json({
      success: false,
      message: "Internal server error",
    });
  }
};

export const handleGetMyBids = async (req, res) => {
  try {
    if (req.user.userType !== "msme") {
      return res.status(403).json({
        success: false,
        message: "Only MSMEs can view their bids",
      });
    }

    try {
      const userBids = await Bid.find({ bidderId: req.user._id })
        .populate('consignmentId', 'title origin destination')
        .sort({ createdAt: -1 });

      res.json({
        success: true,
        bids: userBids,
      });
    } catch (mongoError) {
      console.log("[GetMyBids] MongoDB failed, using in-memory storage");
      
      // Fallback to in-memory storage
      const userBids = Array.from(bids.values()).filter(
        (bid) => bid.bidderId === req.user.id,
      );

      res.json({
        success: true,
        bids: userBids,
      });
    }
  } catch (error) {
    console.error("Get bids error:", error);
    res.status(500).json({
      success: false,
      message: "Internal server error",
    });
  }
};

export const handleGetConsignmentBids = async (req, res) => {
  try {
    const { consignmentId } = req.params;

    if (req.user.userType !== "company") {
      return res.status(403).json({
        success: false,
        message: "Only companies can view bids for their consignments",
      });
    }

    try {
      // Check if consignment belongs to the user in MongoDB
      const consignment = await Consignment.findById(consignmentId);
      if (!consignment) {
        return res.status(404).json({
          success: false,
          message: "Consignment not found",
        });
      }

      if (consignment.companyId.toString() !== req.user._id.toString()) {
        return res.status(403).json({
          success: false,
          message: "Access denied",
        });
      }

      // Get all bids for this consignment
      const consignmentBids = await Bid.find({ consignmentId })
        .populate('bidderId', 'name companyName email')
        .sort({ createdAt: -1 });

      res.json({
        success: true,
        bids: consignmentBids,
      });
    } catch (mongoError) {
      console.log("[GetConsignmentBids] MongoDB failed, using in-memory storage");
      
      // Fallback to in-memory storage
      const consignment = consignments.get(consignmentId);
      if (!consignment) {
        return res.status(404).json({
          success: false,
          message: "Consignment not found",
        });
      }

      if (consignment.companyId !== req.user.id) {
        return res.status(403).json({
          success: false,
          message: "Access denied",
        });
      }

      // Get all bids for this consignment
      const consignmentBids = Array.from(bids.values()).filter(
        (bid) => bid.consignmentId === consignmentId,
      );

      res.json({
        success: true,
        bids: consignmentBids,
      });
    }
  } catch (error) {
    console.error("Get consignment bids error:", error);
    res.status(500).json({
      success: false,
      message: "Internal server error",
    });
  }
};

export const handleAwardBid = async (req, res) => {
  try {
    const { bidId } = req.params;

    if (req.user.userType !== "company") {
      return res.status(403).json({
        success: false,
        message: "Only companies can award bids",
      });
    }

    try {
      // Find bid in MongoDB
      const bid = await Bid.findById(bidId);
      if (!bid) {
        return res.status(404).json({
          success: false,
          message: "Bid not found",
        });
      }

      // Check if consignment belongs to the user
      const consignment = await Consignment.findById(bid.consignmentId);
      if (consignment.companyId.toString() !== req.user._id.toString()) {
        return res.status(403).json({
          success: false,
          message: "Access denied",
        });
      }

      // Check if consignment is still open
      if (consignment.status !== "open") {
        return res.status(400).json({
          success: false,
          message: "This consignment is no longer accepting awards",
        });
      }

      // Award the bid
      bid.status = "awarded";
      bid.awardedAt = new Date();
      await bid.save();

      // Update consignment status
      consignment.status = "awarded";
      consignment.awardedBidId = bid._id;
      consignment.awardedTo = bid.bidderId;
      consignment.awardedAmount = bid.amount;
      consignment.awardedAt = new Date();
      await consignment.save();

      // Reject all other bids for this consignment
      await Bid.updateMany(
        { consignmentId: bid.consignmentId, _id: { $ne: bidId } },
        { status: "rejected" }
      );

      res.json({
        success: true,
        bid,
        message: "Bid awarded successfully",
      });
    } catch (mongoError) {
      console.log("[AwardBid] MongoDB failed, using in-memory storage:", mongoError.message);
      
      // Fallback to in-memory storage
      const bid = bids.get(bidId);
      if (!bid) {
        return res.status(404).json({
          success: false,
          message: "Bid not found",
        });
      }

      // Check if consignment belongs to the user
      const consignment = consignments.get(bid.consignmentId);
      if (consignment.companyId !== req.user.id) {
        return res.status(403).json({
          success: false,
          message: "Access denied",
        });
      }

      // Check if consignment is still open
      if (consignment.status !== "open") {
        return res.status(400).json({
          success: false,
          message: "This consignment is no longer accepting awards",
        });
      }

      // Award the bid
      bid.status = "awarded";
      bid.awardedAt = new Date().toISOString();

      // Update consignment status
      consignment.status = "awarded";
      consignment.awardedBidderId = bid.bidderId;
      consignment.finalAmount = bid.bidAmount;
      consignment.updatedAt = new Date().toISOString();

      // Reject all other bids for this consignment
      Array.from(bids.values())
        .filter((b) => b.consignmentId === bid.consignmentId && b.id !== bidId)
        .forEach((b) => {
          b.status = "rejected";
        });

      res.json({
        success: true,
        bid,
        message: "Bid awarded successfully (in-memory storage)",
      });
    }
  } catch (error) {
    console.error("Award bid error:", error);
    res.status(500).json({
      success: false,
      message: "Internal server error",
    });
  }
};

export const handleUpdateBidStatus = (req, res) => {
  try {
    const { bidId } = req.params;
    const { status } = req.body;

    const bid = bids.get(bidId);
    if (!bid) {
      return res.status(404).json({
        success: false,
        message: "Bid not found",
      });
    }

    // Check permissions
    const consignment = consignments.get(bid.consignmentId);
    if (
      req.user.userType === "company" &&
      consignment.companyId !== req.user.id
    ) {
      return res.status(403).json({
        success: false,
        message: "Access denied",
      });
    }

    if (req.user.userType === "msme" && bid.bidderId !== req.user.id) {
      return res.status(403).json({
        success: false,
        message: "Access denied",
      });
    }

    // Validate status
    const validStatuses = ["pending", "awarded", "rejected"];
    if (!validStatuses.includes(status)) {
      return res.status(400).json({
        success: false,
        message: "Invalid status",
      });
    }

    bid.status = status;
    bid.updatedAt = new Date().toISOString();

    res.json({
      success: true,
      bid,
      message: "Bid status updated successfully",
    });
  } catch (error) {
    console.error("Update bid error:", error);
    res.status(500).json({
      success: false,
      message: "Internal server error",
    });
  }
};

// Export bids for other modules (temporary, use database in production)
export { bids };
