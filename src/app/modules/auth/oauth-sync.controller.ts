import { Request, Response } from "express";
import { User } from "../user/user.model";
import jwt from "jsonwebtoken";
import config from "../../config/index";

// Create JWT token with robust fallback and validation
const createToken = (userId: string, email: string, role: string): string => {
  const secret = config.jwt_secret;
  if (!secret || secret === "YOUR_JWT_SECRET") {
    throw new Error("JWT secret is not configured in backend .env!");
  }

  let expiresIn: string | number = "7d";
  if (
    config.jwt_expires_in &&
    config.jwt_expires_in !== "YOUR_JWT_EXPIRES_IN" &&
    !config.jwt_expires_in.startsWith("YOUR_")
  ) {
    expiresIn = config.jwt_expires_in;
  }

  return jwt.sign({ userId, email, role }, secret, {
    expiresIn,
  } as jwt.SignOptions);
};

/**
 * OAuth Sync Endpoint
 * Called by NextAuth after successful OAuth login (Google/GitHub)
 * Creates or updates user in database and returns JWT token
 *
 * Flow:
 * 1. NextAuth completes OAuth with provider (Google/GitHub)
 * 2. NextAuth sends validated user data to this endpoint
 * 3. Backend finds/creates user in MongoDB with active & deletion checks
 * 4. Backend generates secure JWT token
 * 5. Frontend receives token and uses it for all API calls
 */
export const oauthSyncController = async (
  req: Request,
  res: Response,
): Promise<void> => {
  try {
    const { name, email, image, provider, providerId } = req.body;

    // Validate required fields
    if (!email || typeof email !== "string" || !provider || typeof provider !== "string") {
      res.status(400).json({
        success: false,
        message: "Valid email and provider are required",
      });
      return;
    }

    // Validate provider
    const normalizedProvider = provider.toLowerCase().trim();
    if (!["google", "github"].includes(normalizedProvider)) {
      res.status(400).json({
        success: false,
        message: "Invalid provider. Must be 'google' or 'github'",
      });
      return;
    }

    const normalizedEmail = email.toLowerCase().trim();

    // Check if user exists by email
    let user = await User.findOne({ email: normalizedEmail });

    if (user) {
      // Security check: reject inactive or soft-deleted accounts
      if (user.isDeleted) {
        res.status(403).json({
          success: false,
          message: "This account has been deleted. Please contact support.",
        });
        return;
      }

      if (!user.isActive) {
        res.status(403).json({
          success: false,
          message: "This account is inactive. Please contact support.",
        });
        return;
      }

      const updateFields: Record<string, string> = {};

      // Link provider-specific ID safely
      if (normalizedProvider === "google" && !user.googleId && providerId) {
        updateFields.googleId = String(providerId);
      } else if (normalizedProvider === "github" && !user.githubId && providerId) {
        updateFields.githubId = String(providerId);
      }

      // Update profile image if user doesn't have one
      if (image && typeof image === "string" && !user.profileImage) {
        updateFields.profileImage = image;
      }

      // Update user name if not currently set
      if (name && typeof name === "string" && !user.name) {
        updateFields.name = name.trim();
      }

      // Apply updates if any
      if (Object.keys(updateFields).length > 0) {
        user = await User.findByIdAndUpdate(
          user._id,
          { $set: updateFields },
          { new: true },
        );
      }
    } else {
      // Create new user from OAuth data
      const displayName =
        (name && typeof name === "string" && name.trim()) ||
        normalizedEmail.split("@")[0];

      const newUserData: Record<string, string | boolean | null> = {
        name: displayName,
        email: normalizedEmail,
        authProvider: normalizedProvider,
        role: "customer",
        isActive: true,
        isDeleted: false,
        profileImage: (image && typeof image === "string") ? image : null,
      };

      // Set provider-specific ID
      if (normalizedProvider === "google" && providerId) {
        newUserData.googleId = String(providerId);
      } else if (normalizedProvider === "github" && providerId) {
        newUserData.githubId = String(providerId);
      }

      user = await User.create(newUserData);
    }

    // Ensure user is not null
    if (!user) {
      res.status(500).json({
        success: false,
        message: "Failed to create or retrieve user",
      });
      return;
    }

    // Generate backend JWT token
    const token = createToken(user._id.toString(), user.email, user.role);

    // Set secure httpOnly cookie
    const isProduction = process.env.NODE_ENV === "production";
    res.cookie("token", token, {
      httpOnly: true,
      secure: isProduction,
      sameSite: isProduction ? "none" : "lax",
      maxAge: 7 * 24 * 60 * 60 * 1000, // 7 days
    });

    // Return success response with token and sanitized user data
    res.status(200).json({
      success: true,
      message: "OAuth sync successful",
      data: {
        token, // Backend JWT token for NextAuth & Redux
        user: {
          id: user._id.toString(),
          name: user.name,
          email: user.email,
          role: user.role,
          profileImage: user.profileImage,
          authProvider: user.authProvider,
        },
      },
    });
  } catch (error) {
    // eslint-disable-next-line no-console
    console.error("OAuth sync error:", error);
    res.status(500).json({
      success: false,
      message: "Failed to sync OAuth user",
      error: error instanceof Error ? error.message : "Unknown error",
    });
  }
};
