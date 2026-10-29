import jwt from "jsonwebtoken";
import type { Request, Response, NextFunction } from "express";
import { User } from "../modules/user/user.model";
import { IUser } from "../modules/user/user.interface";
import config from "../config/index";

interface JWTPayload {
  userId: string;
  email: string;
  role: string;
}

export interface AuthRequest extends Request {
  user?: IUser;
}

export const authenticate = async (
  req: AuthRequest,
  res: Response,
  next: NextFunction,
): Promise<void> => {
  try {
    // Get token from Authorization header (primary) OR cookie (fallback)
    // Header: for OAuth & client requests with stored token
    // Cookie: for traditional login with httpOnly cookies
    let token: string | undefined;
    const authHeader = req.headers.authorization;
    if (authHeader && authHeader.startsWith("Bearer ")) {
      token = authHeader.substring(7); // Remove "Bearer " prefix
    }
    if (!token) {
      token = req.cookies?.token;
    }

    if (!token) {
      res.status(401).json({
        success: false,
        message:
          "Access denied. No token provided. You must be logged in to access this resource.",
      });
      return;
    }

    let decoded: JWTPayload;
    try {
      decoded = jwt.verify(
        token,
        config.jwt_secret as string,
      ) as JWTPayload;
    } catch (jwtError) {
      // Fallback: if header token failed, check if cookie has a different valid token
      if (req.cookies?.token && req.cookies.token !== token) {
        decoded = jwt.verify(
          req.cookies.token,
          config.jwt_secret as string,
        ) as JWTPayload;
      } else {
        throw jwtError;
      }
    }

    const user = await User.findById(decoded.userId).select("-isDeleted");

    if (!user) {
      res.status(401).json({
        success: false,
        message: "Invalid token. User not found.",
      });
      return;
    }

    // Check if user is active
    if (!user.isActive) {
      res.status(403).json({
        success: false,
        message: "Your account has been deactivated. Please contact support.",
      });
      return;
    }

    req.user = user;
    next();
  } catch (error) {
    // eslint-disable-next-line no-console
    console.error("Authentication error:", error);
    res.status(401).json({
      success: false,
      message: "Invalid or expired token. Please login again.",
    });
  }
};

// Authorization middleware to check user roles who can access certain routes
export const authorize = (...roles: string[]) => {
  return (req: AuthRequest, res: Response, next: NextFunction): void => {
    if (!req.user) {
      res.status(401).json({
        success: false,
        message: "Access denied. Please Login first.",
      });
      return;
    }

    const userRole = req.user.role;
    // super_admin always has access to all admin-level routes
    const isAuthorized =
      roles.includes(userRole) ||
      (userRole === "super_admin" && (roles.includes("admin") || roles.length === 0));

    if (!isAuthorized) {
      res.status(403).json({
        success: false,
        message:
          "Forbidden. You don't have permission to access this resource.",
      });
      return;
    }

    next();
  };
};
