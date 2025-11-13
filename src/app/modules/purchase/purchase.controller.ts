/* eslint-disable @typescript-eslint/no-explicit-any */
import { Response } from "express";
import { Types } from "mongoose";
import { Purchase } from "./purchase.model";
import { PricingPlan } from "../pricingPlan/pricingPlan.model";
import { Design } from "../design/design.model";
import { AuthRequest } from "../../middlewares/auth";

// Create a new purchase
export const createPurchase = async (
  req: AuthRequest,
  res: Response,
): Promise<void> => {
  try {
    const {
      purchaseType,
      design,
      pricingPlan,
      paymentMethod,
      paymentDetails,
      currency,
      billingAddress,
      notes,
    } = req.body;

    let amount = 0;
    let subscriptionStartDate: Date | undefined;
    let subscriptionEndDate: Date | undefined;
    let remainingDownloads: number | undefined;

    if (purchaseType === "individual") {
      // Individual design purchase
      const designDoc = await Design.findById(design);
      if (!designDoc || designDoc.status !== "Active") {
        res.status(404).json({
          success: false,
          message: "Design not found or not available",
        });
        return;
      }
      amount = designDoc.discountedPrice || 0;
    } else if (purchaseType === "subscription") {
      // Subscription purchase
      const plan = await PricingPlan.findById(pricingPlan);
      if (!plan || !plan.isActive) {
        res.status(404).json({
          success: false,
          message: "Pricing plan not found or inactive",
        });
        return;
      }

      // Check if plan is still valid (if has validUntil date)
      if (plan.validUntil && new Date() > plan.validUntil) {
        res.status(400).json({
          success: false,
          message: "Pricing plan has expired",
        });
        return;
      }

      amount = plan.finalPrice || plan.price;

      // Set subscription dates
      subscriptionStartDate = new Date();
      const duration = plan.duration.toLowerCase();
      subscriptionEndDate = new Date(subscriptionStartDate);

      if (duration.includes("month")) {
        const months = parseInt(duration.match(/\d+/)?.[0] || "1");
        subscriptionEndDate.setMonth(subscriptionEndDate.getMonth() + months);
      } else if (duration.includes("year")) {
        const years = parseInt(duration.match(/\d+/)?.[0] || "1");
        subscriptionEndDate.setFullYear(
          subscriptionEndDate.getFullYear() + years,
        );
      } else {
        // Default to 1 month if duration format is unclear
        subscriptionEndDate.setMonth(subscriptionEndDate.getMonth() + 1);
      }

      remainingDownloads = plan.maxDownloads || 999999; // Unlimited if not specified
    } else {
      res.status(400).json({
        success: false,
        message:
          "Invalid purchase type. Must be 'individual' or 'subscription'",
      });
      return;
    }

    if (!req.user?._id) {
      res.status(401).json({
        success: false,
        message: "User not authenticated",
      });
      return;
    }

    // Check for existing purchases based on type
    if (purchaseType === "individual") {
      // Check if user already purchased this design
      const existingDesignPurchase = await Purchase.findOne({
        user: req.user._id,
        design,
        purchaseType: "individual",
        status: { $in: ["completed", "pending"] },
      });

      if (existingDesignPurchase) {
        res.status(409).json({
          success: false,
          message: `You have already ${existingDesignPurchase.status} purchased this design`,
        });
        return;
      }
    } else if (purchaseType === "subscription") {
      // Check if user has an active subscription
      const activeSubscription = await Purchase.findOne({
        user: req.user._id,
        purchaseType: "subscription",
        status: "completed",
        subscriptionEndDate: { $gt: new Date() },
      }).populate("pricingPlan", "name duration");

      if (activeSubscription) {
        const daysRemaining = Math.ceil(
          (activeSubscription.subscriptionEndDate!.getTime() -
            new Date().getTime()) /
            (1000 * 60 * 60 * 24),
        );

        res.status(409).json({
          success: false,
          message: "You already have an active subscription",
          error: "DUPLICATE_SUBSCRIPTION",
          data: {
            currentSubscription: {
              id: activeSubscription._id,
              // eslint-disable-next-line @typescript-eslint/no-explicit-any
              planName:
                (activeSubscription.pricingPlan as any)?.name || "Unknown Plan",
              remainingDays: daysRemaining,
              expiryDate: activeSubscription.subscriptionEndDate,
              remainingDownloads: activeSubscription.remainingDownloads || 0,
            },
            suggestions: [
              "Wait for current subscription to expire",
              "Upgrade your current plan (if available)",
              "Contact support for plan changes",
            ],
          },
        });
        return;
      }

      // Check for pending subscription
      const pendingSubscription = await Purchase.findOne({
        user: req.user._id,
        purchaseType: "subscription",
        status: "pending",
      }).populate("pricingPlan", "name price");

      if (pendingSubscription) {
        res.status(409).json({
          success: false,
          message: "You have a pending subscription payment",
          error: "PENDING_SUBSCRIPTION",
          data: {
            pendingPurchase: {
              id: pendingSubscription._id,
              // eslint-disable-next-line @typescript-eslint/no-explicit-any
              planName:
                (pendingSubscription.pricingPlan as any)?.name ||
                "Unknown Plan",
              amount: pendingSubscription.amount,
              createdAt: pendingSubscription.createdAt,
            },
            action: "Complete the pending payment or cancel it first",
          },
        });
        return;
      }
    }

    const newPurchase = new Purchase({
      user: req.user._id,
      purchaseType,
      design: purchaseType === "individual" ? design : undefined,
      pricingPlan: purchaseType === "subscription" ? pricingPlan : undefined,
      amount,
      currency: currency || "USD",
      paymentMethod,
      paymentDetails,
      billingAddress,
      subscriptionStartDate,
      subscriptionEndDate,
      remainingDownloads,
      notes,
      status: paymentMethod === "free" ? "completed" : "pending",
      purchaseDate: new Date(),
    });

    const savedPurchase = await newPurchase.save();

    // Populate the purchase with relevant details
    let populateField = "";
    let selectFields = "";

    if (purchaseType === "individual") {
      populateField = "design";
      selectFields = "title discountedPrice basePrice images";
    } else {
      populateField = "pricingPlan";
      selectFields = "name description features duration maxDownloads";
    }

    const populatedPurchase = await Purchase.findById(savedPurchase._id)
      .populate(populateField, selectFields)
      .populate("user", "name email")
      .select("-__v");

    res.status(201).json({
      success: true,
      message: "Purchase created successfully",
      data: populatedPurchase,
    });
  } catch (error) {
    // eslint-disable-next-line no-console
    console.error("Error creating purchase:", error);
    res.status(500).json({
      success: false,
      message: "Internal server error",
      error: error instanceof Error ? error.message : "Unknown error",
    });
  }
};

// Get all purchases (Admin only)
export const getAllPurchases = async (
  req: AuthRequest,
  res: Response,
): Promise<void> => {
  try {
    const {
      page = 1,
      limit = 10,
      sortBy = "createdAt",
      sortOrder = "desc",
      status,
      paymentMethod,
      purchaseType,
      minAmount,
      maxAmount,
      startDate,
      endDate,
      search,
    } = req.query;

    const pageNum = parseInt(page as string, 10);
    const limitNum = parseInt(limit as string, 10);
    const skip = (pageNum - 1) * limitNum;

    // Build filter object
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    const filter: Record<string, any> = {};

    if (status) {
      filter.status = status;
    }

    if (paymentMethod) {
      filter.paymentMethod = paymentMethod;
    }

    if (purchaseType) {
      filter.purchaseType = purchaseType;
    }

    if (minAmount) {
      filter.amount = {
        ...filter.amount,
        $gte: parseFloat(minAmount as string),
      };
    }

    if (maxAmount) {
      filter.amount = {
        ...filter.amount,
        $lte: parseFloat(maxAmount as string),
      };
    }

    if (startDate || endDate) {
      filter.purchaseDate = {};
      if (startDate) {
        filter.purchaseDate.$gte = new Date(startDate as string);
      }
      if (endDate) {
        filter.purchaseDate.$lte = new Date(endDate as string);
      }
    }

    if (search) {
      filter.$or = [
        { "user.name": { $regex: search, $options: "i" } },
        { "user.email": { $regex: search, $options: "i" } },
        { notes: { $regex: search, $options: "i" } },
      ];
    }

    // Build sort object
    const sort: Record<string, 1 | -1> = {};
    sort[sortBy as string] = sortOrder === "desc" ? -1 : 1;

    const purchases = await Purchase.find(filter)
      .populate("user", "name email profileImage role")
      .populate("design", "title basePrice discountedPrice currencyDisplay currencyCode previewImageUrls")
      .populate("pricingPlan", "name description price finalPrice duration maxDownloads features")
      .sort(sort)
      .skip(skip)
      .limit(limitNum)
      .select("-__v");

    const totalPurchases = await Purchase.countDocuments(filter);
    const totalPages = Math.ceil(totalPurchases / limitNum);

    // Calculate rich statistics for the admin dashboard
    const statsAggregation = await Purchase.aggregate([
      { $match: filter },
      {
        $facet: {
          // Revenue statistics
          revenueStats: [
            {
              $group: {
                _id: null,
                totalRevenue: { $sum: "$amount" },
                averageOrderValue: { $avg: "$amount" },
                maxOrderValue: { $max: "$amount" },
                minOrderValue: { $min: "$amount" },
              },
            },
          ],
          // Status breakdown
          statusBreakdown: [
            {
              $group: {
                _id: "$status",
                count: { $sum: 1 },
                totalAmount: { $sum: "$amount" },
              },
            },
          ],
          // Purchase type breakdown
          typeBreakdown: [
            {
              $group: {
                _id: "$purchaseType",
                count: { $sum: 1 },
                totalAmount: { $sum: "$amount" },
              },
            },
          ],
          // Payment method breakdown
          paymentMethodBreakdown: [
            {
              $group: {
                _id: "$paymentMethod",
                count: { $sum: 1 },
                totalAmount: { $sum: "$amount" },
              },
            },
          ],
          // Recent activity (last 7 days comparison)
          recentTrend: [
            {
              $match: {
                purchaseDate: { $gte: new Date(Date.now() - 7 * 24 * 60 * 60 * 1000) },
              },
            },
            {
              $group: {
                _id: { $dateToString: { format: "%Y-%m-%d", date: "$purchaseDate" } },
                count: { $sum: 1 },
                revenue: { $sum: "$amount" },
              },
            },
            { $sort: { _id: 1 } },
          ],
          // Top customers
          topCustomers: [
            { $match: { status: "completed" } },
            {
              $group: {
                _id: "$user",
                totalSpent: { $sum: "$amount" },
                purchaseCount: { $sum: 1 },
              },
            },
            { $sort: { totalSpent: -1 } },
            { $limit: 5 },
            {
              $lookup: {
                from: "users",
                localField: "_id",
                foreignField: "_id",
                as: "userDetails",
              },
            },
            { $unwind: "$userDetails" },
            {
              $project: {
                userId: "$_id",
                name: "$userDetails.name",
                email: "$userDetails.email",
                totalSpent: 1,
                purchaseCount: 1,
              },
            },
          ],
        },
      },
    ]);

    const stats = statsAggregation[0] || {};

    // Format the response with enhanced data
    res.status(200).json({
      success: true,
      message: "Purchases retrieved successfully",
      data: purchases,
      pagination: {
        currentPage: pageNum,
        totalPages,
        totalItems: totalPurchases,
        itemsPerPage: limitNum,
        hasNextPage: pageNum < totalPages,
        hasPrevPage: pageNum > 1,
      },
      statistics: {
        revenue: {
          total: stats.revenueStats?.[0]?.totalRevenue || 0,
          average: stats.revenueStats?.[0]?.averageOrderValue || 0,
          highest: stats.revenueStats?.[0]?.maxOrderValue || 0,
          lowest: stats.revenueStats?.[0]?.minOrderValue || 0,
        },
        breakdown: {
          byStatus: stats.statusBreakdown || [],
          byType: stats.typeBreakdown || [],
          byPaymentMethod: stats.paymentMethodBreakdown || [],
        },
        trends: {
          last7Days: stats.recentTrend || [],
        },
        topCustomers: stats.topCustomers || [],
      },
      filters: {
        status: status || null,
        paymentMethod: paymentMethod || null,
        purchaseType: purchaseType || null,
        amountRange: {
          min: minAmount || null,
          max: maxAmount || null,
        },
        dateRange: {
          start: startDate || null,
          end: endDate || null,
        },
        search: search || null,
      },
    });
  } catch (error) {
    // eslint-disable-next-line no-console
    console.error("Error fetching purchases:", error);
    res.status(500).json({
      success: false,
      message: "Internal server error",
      error: error instanceof Error ? error.message : "Unknown error",
    });
  }
};

// Get user's own purchases
export const getUserPurchases = async (
  req: AuthRequest,
  res: Response,
): Promise<void> => {
  try {
    const {
      page = 1,
      limit = 10,
      sortBy = "purchaseDate",
      sortOrder = "desc",
      status,
      purchaseType,
    } = req.query;

    const pageNum = parseInt(page as string, 10);
    const limitNum = parseInt(limit as string, 10);
    const skip = (pageNum - 1) * limitNum;

    // Build filter object
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    const filter: Record<string, any> = { user: req.user?._id };

    if (status) {
      filter.status = status;
    }

    if (purchaseType) {
      filter.purchaseType = purchaseType;
    }

    // Build sort object
    const sort: Record<string, 1 | -1> = {};
    sort[sortBy as string] = sortOrder === "desc" ? -1 : 1;

    const purchases = await Purchase.find(filter)
      .populate(
        "pricingPlan",
        "name description features duration price finalPrice",
      )
      .populate("design", "title price basePrice discountedPrice currencyDisplay currencyCode")
      .sort(sort)
      .skip(skip)
      .limit(limitNum)
      .select("-__v -paymentDetails");

    const totalPurchases = await Purchase.countDocuments(filter);
    const totalPages = Math.ceil(totalPurchases / limitNum);

    res.status(200).json({
      success: true,
      message: "Your purchases retrieved successfully",
      data: purchases,
      pagination: {
        currentPage: pageNum,
        totalPages,
        totalItems: totalPurchases,
        itemsPerPage: limitNum,
        hasNextPage: pageNum < totalPages,
        hasPrevPage: pageNum > 1,
      },
    });
  } catch (error) {
    // eslint-disable-next-line no-console
    console.error("Error fetching user purchases:", error);
    res.status(500).json({
      success: false,
      message: "Internal server error",
      error: error instanceof Error ? error.message : "Unknown error",
    });
  }
};

// Get single purchase by ID
export const getPurchaseById = async (
  req: AuthRequest,
  res: Response,
): Promise<void> => {
  try {
    const { id } = req.params;

    if (!Types.ObjectId.isValid(id)) {
      res.status(400).json({
        success: false,
        message: "Invalid purchase ID format",
      });
    }

    const purchase = await Purchase.findById(id)
      .populate("user", "name email")
      .populate(
        "pricingPlan",
        "name description features duration price finalPrice",
      )
      .select("-__v");

    if (!purchase) {
      res.status(404).json({
        success: false,
        message: "Purchase not found",
      });
      return;
    }

    // Check if user is authorized to view this purchase
    if (
      req.user?.role !== "admin" &&
      purchase.user?._id.toString() !== req.user?._id?.toString()
    ) {
      res.status(403).json({
        success: false,
        message: "Not authorized to view this purchase",
      });
      return;
    }
    // Hide payment details for non-admin users
    if (req.user?.role !== "admin") {
      purchase.paymentDetails = undefined;
    }

    res.status(200).json({
      success: true,
      message: "Purchase retrieved successfully",
      data: purchase,
    });
  } catch (error) {
    // eslint-disable-next-line no-console
    console.error("Error fetching purchase:", error);
    res.status(500).json({
      success: false,
      message: "Internal server error",
      error: error instanceof Error ? error.message : "Unknown error",
    });
  }
};

// Update purchase status (Admin only)
export const updatePurchaseStatus = async (
  req: AuthRequest,
  res: Response,
): Promise<void> => {
  try {
    const { id } = req.params;
    const { status, adminNotes } = req.body;

    if (!Types.ObjectId.isValid(id)) {
      res.status(400).json({
        success: false,
        message: "Invalid purchase ID format",
      });
    }

    const purchase = await Purchase.findById(id);
    if (!purchase) {
      res.status(404).json({
        success: false,
        message: "Purchase not found",
      });
      return;
    }

    // Update purchase status and add admin notes
    const updateData: Record<string, unknown> = {
      status,
      updatedAt: new Date(),
    };

    if (adminNotes) {
      updateData.adminNotes = adminNotes;
    }

    // Set activation date if status is being changed to active
    if (status === "completed" && purchase.status !== "completed") {
      updateData.activatedAt = new Date();

      // For subscription purchases, set subscription dates and download limits
      if (purchase.purchaseType === "subscription" && purchase.pricingPlan) {
        const plan = await PricingPlan.findById(purchase.pricingPlan);
        if (plan) {
          const subscriptionStartDate = new Date();
          const subscriptionEndDate = new Date(subscriptionStartDate);

          const duration = plan.duration.toLowerCase();
          if (duration.includes("month")) {
            const months = parseInt(duration.match(/\\d+/)?.[0] || "1");
            subscriptionEndDate.setMonth(
              subscriptionEndDate.getMonth() + months,
            );
          } else if (duration.includes("year")) {
            const years = parseInt(duration.match(/\\d+/)?.[0] || "1");
            subscriptionEndDate.setFullYear(
              subscriptionEndDate.getFullYear() + years,
            );
          } else {
            subscriptionEndDate.setMonth(subscriptionEndDate.getMonth() + 1);
          }

          updateData.subscriptionStartDate = subscriptionStartDate;
          updateData.subscriptionEndDate = subscriptionEndDate;
          updateData.remainingDownloads = plan.maxDownloads || 999999;
        }
      }
    }

    // Set expiry date if status is being changed to expired
    if (status === "expired" && purchase.status !== "expired") {
      updateData.expiredAt = new Date();
    }

    const updatedPurchase = await Purchase.findByIdAndUpdate(id, updateData, {
      new: true,
      runValidators: true,
    })
      .populate("user", "name email")
      .populate("pricingPlan", "name description features duration")
      .select("-__v");

    res.status(200).json({
      success: true,
      message: "Purchase status updated successfully",
      data: updatedPurchase,
    });
  } catch (error) {
    // eslint-disable-next-line no-console
    console.error("Error updating purchase status:", error);
    res.status(500).json({
      success: false,
      message: "Internal server error",
      error: error instanceof Error ? error.message : "Unknown error",
    });
  }
};

// Cancel purchase (User can cancel their own pending purchases)
export const cancelPurchase = async (
  req: AuthRequest,
  res: Response,
): Promise<void> => {
  try {
    const { id } = req.params;
    const { cancelReason } = req.body;

    if (!Types.ObjectId.isValid(id)) {
      res.status(400).json({
        success: false,
        message: "Invalid purchase ID format",
      });
    }

    const purchase = await Purchase.findById(id);
    if (!purchase) {
      res.status(404).json({
        success: false,
        message: "Purchase not found",
      });
      return;
    }

    // Check if user is authorized to cancel this purchase
    if (
      req.user?.role !== "admin" &&
      purchase.user?.toString() !== req.user?._id?.toString()
    ) {
      res.status(403).json({
        success: false,
        message: "Not authorized to cancel this purchase",
      });
      return;
    }

    // Check if purchase can be cancelled
    if (purchase.status !== "pending") {
      res.status(400).json({
        success: false,
        message: "Only pending purchases can be cancelled",
      });
    }

    const cancelledPurchase = await Purchase.findByIdAndUpdate(
      id,
      {
        status: "cancelled",
        cancelledAt: new Date(),
        cancelReason: cancelReason || "Cancelled by user",
        updatedAt: new Date(),
      },
      { new: true },
    )
      .populate("pricingPlan", "name description")
      .select("-__v -paymentDetails");

    res.status(200).json({
      success: true,
      message: "Purchase cancelled successfully",
      data: cancelledPurchase,
    });
  } catch (error) {
    // eslint-disable-next-line no-console
    console.error("Error cancelling purchase:", error);
    res.status(500).json({
      success: false,
      message: "Internal server error",
      error: error instanceof Error ? error.message : "Unknown error",
    });
  }
};

// Check subscription eligibility (prevent duplicate subscriptions)
export const checkSubscriptionEligibility = async (
  req: AuthRequest,
  res: Response,
): Promise<void> => {
  try {
    const userId = req.user?._id;

    if (!userId) {
      res.status(401).json({
        success: false,
        message: "User not authenticated",
      });
      return;
    }

    // Check for active subscription
    const activeSubscription = await Purchase.findOne({
      user: userId,
      purchaseType: "subscription",
      status: "active",
      subscriptionEndDate: { $gt: new Date() },
    }).populate("pricingPlan", "name duration price maxDownloads");

    // Check for pending subscription
    const pendingSubscription = await Purchase.findOne({
      user: userId,
      purchaseType: "subscription",
      status: "pending",
    }).populate("pricingPlan", "name price");

    const canPurchaseSubscription = !activeSubscription && !pendingSubscription;

    res.status(200).json({
      success: true,
      message: "Subscription eligibility checked",
      data: {
        canPurchaseSubscription,
        hasActiveSubscription: !!activeSubscription,
        hasPendingSubscription: !!pendingSubscription,
        activeSubscription: activeSubscription
          ? {
              id: activeSubscription._id,
              // eslint-disable-next-line @typescript-eslint/no-explicit-any
              planName:
                (activeSubscription.pricingPlan as any)?.name || "Unknown Plan",
              expiryDate: activeSubscription.subscriptionEndDate,
              remainingDownloads: activeSubscription.remainingDownloads || 0,
              daysRemaining: Math.ceil(
                (activeSubscription.subscriptionEndDate!.getTime() -
                  new Date().getTime()) /
                  (1000 * 60 * 60 * 24),
              ),
            }
          : null,
        pendingSubscription: pendingSubscription
          ? {
              id: pendingSubscription._id,
              // eslint-disable-next-line @typescript-eslint/no-explicit-any
              planName:
                (pendingSubscription.pricingPlan as any)?.name ||
                "Unknown Plan",
              amount: pendingSubscription.amount,
              createdAt: pendingSubscription.createdAt,
            }
          : null,
        message: canPurchaseSubscription
          ? "You can purchase a subscription"
          : "You already have a subscription (active or pending)",
      },
    });
  } catch (error) {
    // eslint-disable-next-line no-console
    console.error("Error checking subscription eligibility:", error);
    res.status(500).json({
      success: false,
      message: "Internal server error",
      error: error instanceof Error ? error.message : "Unknown error",
    });
  }
};

// Get purchase analytics (Admin only)
export const getPurchaseAnalytics = async (
  req: AuthRequest,
  res: Response,
): Promise<void> => {
  try {
    const { period = "monthly", startDate, endDate } = req.query;

    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    let dateFilter: Record<string, any> = {};
    const now = new Date();

    if (startDate && endDate) {
      dateFilter = {
        purchaseDate: {
          $gte: new Date(startDate as string),
          $lte: new Date(endDate as string),
        },
      };
    } else {
      // Default period-based filtering
      switch (period) {
        case "daily":
          dateFilter.purchaseDate = {
            $gte: new Date(now.setDate(now.getDate() - 1)),
          };
          break;
        case "weekly":
          dateFilter.purchaseDate = {
            $gte: new Date(now.setDate(now.getDate() - 7)),
          };
          break;
        case "monthly":
          dateFilter.purchaseDate = {
            $gte: new Date(now.setMonth(now.getMonth() - 1)),
          };
          break;
        case "yearly":
          dateFilter.purchaseDate = {
            $gte: new Date(now.setFullYear(now.getFullYear() - 1)),
          };
          break;
      }
    }

    // Enhanced analytics with multiple facets
    const analyticsData = await Purchase.aggregate([
      { $match: dateFilter },
      {
        $facet: {
          // Overall statistics
          overallStats: [
            {
              $group: {
                _id: null,
                totalPurchases: { $sum: 1 },
                totalRevenue: { $sum: "$amount" },
                completedPurchases: {
                  $sum: { $cond: [{ $eq: ["$status", "completed"] }, 1, 0] },
                },
                pendingPurchases: {
                  $sum: { $cond: [{ $eq: ["$status", "pending"] }, 1, 0] },
                },
                cancelledPurchases: {
                  $sum: { $cond: [{ $eq: ["$status", "cancelled"] }, 1, 0] },
                },
                refundedPurchases: {
                  $sum: { $cond: [{ $eq: ["$status", "refunded"] }, 1, 0] },
                },
                averageOrderValue: { $avg: "$amount" },
                maxOrderValue: { $max: "$amount" },
                minOrderValue: { $min: "$amount" },
                uniqueCustomers: { $addToSet: "$user" },
              },
            },
            {
              $project: {
                totalPurchases: 1,
                totalRevenue: 1,
                completedPurchases: 1,
                pendingPurchases: 1,
                cancelledPurchases: 1,
                refundedPurchases: 1,
                averageOrderValue: 1,
                maxOrderValue: 1,
                minOrderValue: 1,
                uniqueCustomers: { $size: "$uniqueCustomers" },
                conversionRate: {
                  $multiply: [
                    { $divide: ["$completedPurchases", "$totalPurchases"] },
                    100,
                  ],
                },
              },
            },
          ],
          // Status breakdown with percentages
          statusBreakdown: [
            {
              $group: {
                _id: "$status",
                count: { $sum: 1 },
                totalAmount: { $sum: "$amount" },
              },
            },
            { $sort: { count: -1 } },
          ],
          // Payment method analysis
          paymentMethodBreakdown: [
            {
              $group: {
                _id: "$paymentMethod",
                count: { $sum: 1 },
                totalAmount: { $sum: "$amount" },
                averageAmount: { $avg: "$amount" },
              },
            },
            { $sort: { totalAmount: -1 } },
          ],
          // Purchase type analysis (individual vs subscription)
          purchaseTypeBreakdown: [
            {
              $group: {
                _id: "$purchaseType",
                count: { $sum: 1 },
                totalRevenue: { $sum: "$amount" },
                averageValue: { $avg: "$amount" },
              },
            },
          ],
          // Top pricing plans
          topPlans: [
            { $match: { purchaseType: "subscription", pricingPlan: { $exists: true } } },
            {
              $group: {
                _id: "$pricingPlan",
                subscriptionCount: { $sum: 1 },
                totalRevenue: { $sum: "$amount" },
              },
            },
            { $sort: { subscriptionCount: -1 } },
            { $limit: 10 },
            {
              $lookup: {
                from: "pricingplans",
                localField: "_id",
                foreignField: "_id",
                as: "planDetails",
              },
            },
            { $unwind: "$planDetails" },
            {
              $project: {
                planId: "$_id",
                planName: "$planDetails.name",
                planDuration: "$planDetails.duration",
                subscriptionCount: 1,
                totalRevenue: 1,
                averageRevenue: { $divide: ["$totalRevenue", "$subscriptionCount"] },
              },
            },
          ],
          // Top purchased designs
          topDesigns: [
            { $match: { purchaseType: "individual", design: { $exists: true } } },
            {
              $group: {
                _id: "$design",
                purchaseCount: { $sum: 1 },
                totalRevenue: { $sum: "$amount" },
              },
            },
            { $sort: { purchaseCount: -1 } },
            { $limit: 10 },
            {
              $lookup: {
                from: "designs",
                localField: "_id",
                foreignField: "_id",
                as: "designDetails",
              },
            },
            { $unwind: "$designDetails" },
            {
              $project: {
                designId: "$_id",
                designTitle: "$designDetails.title",
                purchaseCount: 1,
                totalRevenue: 1,
                averagePrice: { $divide: ["$totalRevenue", "$purchaseCount"] },
              },
            },
          ],
          // Revenue trend over time (daily breakdown)
          revenueTrend: [
            {
              $group: {
                _id: { $dateToString: { format: "%Y-%m-%d", date: "$purchaseDate" } },
                dailyRevenue: { $sum: "$amount" },
                dailyOrders: { $sum: 1 },
                completedOrders: {
                  $sum: { $cond: [{ $eq: ["$status", "completed"] }, 1, 0] },
                },
              },
            },
            { $sort: { _id: 1 } },
            {
              $project: {
                date: "$_id",
                revenue: "$dailyRevenue",
                orders: "$dailyOrders",
                completedOrders: 1,
                averageOrderValue: { $divide: ["$dailyRevenue", "$dailyOrders"] },
              },
            },
          ],
          // Currency distribution
          currencyDistribution: [
            {
              $group: {
                _id: "$currency",
                count: { $sum: 1 },
                totalAmount: { $sum: "$amount" },
              },
            },
            { $sort: { totalAmount: -1 } },
          ],
          // Monthly recurring revenue (MRR) for subscriptions
          subscriptionMetrics: [
            {
              $match: {
                purchaseType: "subscription",
                status: "completed",
                subscriptionEndDate: { $gte: new Date() },
              },
            },
            {
              $group: {
                _id: null,
                activeSubscriptions: { $sum: 1 },
                monthlyRecurringRevenue: { $sum: "$amount" },
                averageSubscriptionValue: { $avg: "$amount" },
              },
            },
          ],
        },
      },
    ]);

    const analytics = analyticsData[0] || {};

    res.status(200).json({
      success: true,
      message: "Purchase analytics retrieved successfully",
      data: {
        summary: analytics.overallStats?.[0] || {
          totalPurchases: 0,
          totalRevenue: 0,
          completedPurchases: 0,
          pendingPurchases: 0,
          cancelledPurchases: 0,
          refundedPurchases: 0,
          averageOrderValue: 0,
          maxOrderValue: 0,
          minOrderValue: 0,
          uniqueCustomers: 0,
          conversionRate: 0,
        },
        breakdowns: {
          status: analytics.statusBreakdown || [],
          paymentMethod: analytics.paymentMethodBreakdown || [],
          purchaseType: analytics.purchaseTypeBreakdown || [],
          currency: analytics.currencyDistribution || [],
        },
        topPerformers: {
          plans: analytics.topPlans || [],
          designs: analytics.topDesigns || [],
        },
        trends: {
          revenue: analytics.revenueTrend || [],
        },
        subscriptions: analytics.subscriptionMetrics?.[0] || {
          activeSubscriptions: 0,
          monthlyRecurringRevenue: 0,
          averageSubscriptionValue: 0,
        },
        metadata: {
          period,
          dateRange: {
            start: dateFilter.purchaseDate?.$gte || "All time",
            end: dateFilter.purchaseDate?.$lte || "Present",
          },
          generatedAt: new Date().toISOString(),
        },
      },
    });
  } catch (error) {
    // eslint-disable-next-line no-console
    console.error("Error fetching purchase analytics:", error);
    res.status(500).json({
      success: false,
      message: "Internal server error",
      error: error instanceof Error ? error.message : "Unknown error",
    });
  }
};
