import { Router } from "express";
import passport from "passport";
import jwt from "jsonwebtoken";

const router = Router();

// Google OAuth
router.get(
  "/google",
  passport.authenticate("google", { scope: ["profile", "email"], session: false })
);

router.get(
  "/google/callback",
  passport.authenticate("google", { failureRedirect: "http://localhost:3000/login", session: false }),
  (req, res) => {
    const user = req.user as any;
    
    // Generate JWT token
    const accessToken = jwt.sign({ id: user.id }, process.env.JWT_SECRET as string, {
      expiresIn: "1h",
    });

    // Redirect back to frontend
    res.redirect(`http://localhost:3000/login/oauth?token=${accessToken}`);
  }
);

// GitHub OAuth
router.get(
  "/github",
  // GitHub strategy requires session set to false or properly initialized sessions
  passport.authenticate("github", { scope: ["user:email"], session: false })
);

router.get(
  "/github/callback",
  passport.authenticate("github", { failureRedirect: "http://localhost:3000/login", session: false }),
  (req, res) => {
    const user = req.user as any;
    const accessToken = jwt.sign({ id: user.id }, process.env.JWT_SECRET as string, {
      expiresIn: "1h",
    });

    res.redirect(`http://localhost:3000/login/oauth?token=${accessToken}`);
  }
);

export default router;
