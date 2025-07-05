import { v4 as uuidv4 } from "uuid";
import { bids } from "./bids.js";
import { consignments } from "./consignments.js";

// In-memory database (replace with actual database in production)
const jobs = new Map();

export const handleGetAwardedJobs = (req, res) => {
  try {
    if (req.user.userType !== "msme") {
      return res.status(403).json({
        success: false,
        message: "Only MSMEs can view their awarded jobs",
      });
    }

    // Get all awarded bids for this user and convert to jobs
    const awardedBids = Array.from(bids.values()).filter(
      (bid) => bid.bidderId === req.user.id && bid.status === "awarded",
    );

    const userJobs = awardedBids.map((bid) => {
      const consignment = consignments.get(bid.consignmentId);

      // Check if job already exists in jobs map
      let existingJob = Array.from(jobs.values()).find(
        (job) =>
          job.consignmentId === bid.consignmentId &&
          job.transporterId === req.user.id,
      );

      if (existingJob) {
        return existingJob;
      }

      // Create new job
      const job = {
        id: uuidv4(),
        consignmentId: bid.consignmentId,
        consignmentTitle: consignment.title,
        companyId: consignment.companyId,
        companyName: consignment.companyName,
        transporterId: req.user.id,
        transporterName: req.user.name,
        origin: consignment.origin,
        destination: consignment.destination,
        amount: bid.bidAmount,
        deadline: consignment.deadline,
        status:
          consignment.status === "awarded" ? "awarded" : consignment.status,
        awardedDate: bid.awardedAt,
        completedDate: null,
        invoiceUploaded: false,
      };

      jobs.set(job.id, job);
      return job;
    });

    res.json({
      success: true,
      jobs: userJobs,
    });
  } catch (error) {
    console.error("Get awarded jobs error:", error);
    res.status(500).json({
      success: false,
      message: "Internal server error",
    });
  }
};

export const handleUpdateJobStatus = (req, res) => {
  try {
    const { jobId } = req.params;
    const { status } = req.body;

    const job = jobs.get(jobId);
    if (!job) {
      return res.status(404).json({
        success: false,
        message: "Job not found",
      });
    }

    // Check if user owns this job
    if (job.transporterId !== req.user.id) {
      return res.status(403).json({
        success: false,
        message: "Access denied",
      });
    }

    // Validate status
    const validStatuses = ["awarded", "in_progress", "completed"];
    if (!validStatuses.includes(status)) {
      return res.status(400).json({
        success: false,
        message: "Invalid status",
      });
    }

    // Validate status transitions
    if (job.status === "awarded" && status !== "in_progress") {
      return res.status(400).json({
        success: false,
        message: "Awarded jobs can only be moved to in_progress",
      });
    }

    if (job.status === "in_progress" && status !== "completed") {
      return res.status(400).json({
        success: false,
        message: "In progress jobs can only be completed",
      });
    }

    // Update job status
    job.status = status;
    job.updatedAt = new Date().toISOString();

    if (status === "completed") {
      job.completedDate = new Date().toISOString();
    }

    // Update consignment status as well
    const consignment = consignments.get(job.consignmentId);
    if (consignment) {
      consignment.status = status;
      consignment.updatedAt = new Date().toISOString();
    }

    res.json({
      success: true,
      job,
      message: `Job status updated to ${status}`,
    });
  } catch (error) {
    console.error("Update job status error:", error);
    res.status(500).json({
      success: false,
      message: "Internal server error",
    });
  }
};

export const handleUploadInvoice = (req, res) => {
  try {
    const { jobId } = req.params;
    const { invoiceData } = req.body;

    const job = jobs.get(jobId);
    if (!job) {
      return res.status(404).json({
        success: false,
        message: "Job not found",
      });
    }

    // Check if user owns this job
    if (job.transporterId !== req.user.id) {
      return res.status(403).json({
        success: false,
        message: "Access denied",
      });
    }

    // Update job with invoice data
    job.invoiceUploaded = true;
    job.invoiceData = invoiceData;
    job.invoiceUploadedAt = new Date().toISOString();

    res.json({
      success: true,
      job,
      message: "Invoice uploaded successfully",
    });
  } catch (error) {
    console.error("Upload invoice error:", error);
    res.status(500).json({
      success: false,
      message: "Internal server error",
    });
  }
};

export const handleGetCompanyJobs = (req, res) => {
  try {
    if (req.user.userType !== "company") {
      return res.status(403).json({
        success: false,
        message: "Only companies can view their jobs",
      });
    }

    // Get all jobs for consignments created by this company
    const companyJobs = Array.from(jobs.values()).filter(
      (job) => job.companyId === req.user.id,
    );

    res.json({
      success: true,
      jobs: companyJobs,
    });
  } catch (error) {
    console.error("Get company jobs error:", error);
    res.status(500).json({
      success: false,
      message: "Internal server error",
    });
  }
};

// Export jobs for other modules (temporary, use database in production)
export { jobs };
