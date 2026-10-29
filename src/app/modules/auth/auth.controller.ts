import { Request, Response } from "express";
import { User } from "../user/user.model";
import jwt from "jsonwebtoken";
import config from "../../config/index";
import bcrypt from "bcrypt";

// create JWT token with robust fallback
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

const registerUserController = async (
  req: Request,
  res: Response,
): Promise<void> => {
  try {
    const { name, email, password, role } = req.body;

    const normalizedEmail = email.toLowerCase().trim();

    // Check if user already exists
    const existingUser = await User.findOne({ email: normalizedEmail });
    if (existingUser) {
      res.status(400).json({
        success: false,
        message: "User already exists with this email",
      });
      return;
    }

    // Create new user
    const user = new User({
      name: name.trim(),
      email: normalizedEmail,
      password: await bcrypt.hash(password, config.bcrypt_salt_rounds), // Hash password before saving
      role: role || "customer",
    });

    await user.save();

    // Create JWT token for the new user
    const token = createToken(user._id.toString(), user.email, user.role);

    // Set httpOnly cookie
    const isProduction = process.env.NODE_ENV === "production";
    res.cookie("token", token, {
      httpOnly: true,
      secure: isProduction,
      sameSite: isProduction ? "none" : "lax",
      maxAge: 7 * 24 * 60 * 60 * 1000, // 7 days
    });

    res.status(201).json({
      success: true,
      message: "User registered successfully",
      data: {
        user: {
          id: user._id.toString(),
          name: user.name,
          email: user.email,
          profileImage: user.profileImage,
          role: user.role,
        },
        token: token,
      },
    });
  } catch (error: unknown) {
    const errorMessage =
      error instanceof Error ? error.message : "Unknown error occurred";
    res.status(500).json({
      success: false,
      message: "Registration failed",
      error: errorMessage,
    });
  }
};

const loginController = async (req: Request, res: Response): Promise<void> => {
  try {
    const { email, password } = req.body;
    const normalizedEmail = email.toLowerCase().trim();

    // Find user with email and include password for comparison
    const user = await User.findOne({ email: normalizedEmail }).select("+password");
    if (!user) {
      res.status(401).json({
        success: false,
        message: "User does not exist with this email",
      });
      return;
    }

    // Check if user is active or deleted
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
        message: "This account has been deactivated. Please contact support.",
      });
      return;
    }

    if (!user.password) {
      res.status(400).json({
        success: false,
        message: "This account was registered using OAuth (Google or GitHub). Please sign in with that provider.",
      });
      return;
    }

    // Check password using bcrypt comparison
    const isPasswordValid = await bcrypt.compare(
      password,
      user.password as string,
    );
    if (!isPasswordValid) {
      res.status(401).json({
        success: false,
        message: "Invalid password. Please try again with correct password.",
      });
      return;
    }

    // Create JWT token for successful login
    const token = createToken(user._id.toString(), user.email, user.role);

    // Set httpOnly cookie
    const isProduction = process.env.NODE_ENV === "production";
    res.cookie("token", token, {
      httpOnly: true,
      secure: isProduction,
      sameSite: isProduction ? "none" : "lax",
      maxAge: 7 * 24 * 60 * 60 * 1000, // 7 days
    });

    res.status(200).json({
      success: true,
      message: "Login successful",
      data: {
        user: {
          id: user._id.toString(),
          name: user.name,
          email: user.email,
          profileImage: user.profileImage || "",
          role: user.role,
        },
        token: token,
      },
    });
  } catch (error: unknown) {
    const errorMessage =
      error instanceof Error ? error.message : "Unknown error occurred";
    res.status(500).json({
      success: false,
      message: "Login failed",
      error: errorMessage,
    });
  }
};

const logoutController = (req: Request, res: Response): void => {
  const isProduction = process.env.NODE_ENV === "production";
  res.clearCookie("token", {
    httpOnly: true,
    secure: isProduction,
    sameSite: isProduction ? "none" : "lax",
  });
  res.status(200).json({
    success: true,
    message: "Logout successful",
  });
};

export { registerUserController, loginController, logoutController };
