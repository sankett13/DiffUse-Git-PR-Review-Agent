import passport from "passport";
import { Strategy as GoogleStrategy } from "passport-google-oauth20";
import { Strategy as GitHubStrategy } from "passport-github2";
import { prisma } from "../utils/prisma.js";

const GOOGLE_CLIENT_ID = process.env.GOOGLE_CLIENT_ID || "dummy_google_id";
const GOOGLE_CLIENT_SECRET =
  process.env.GOOGLE_CLIENT_SECRET || "dummy_google_secret";

const GITHUB_CLIENT_ID = process.env.GITHUB_CLIENT_ID || "dummy_github_id";
const GITHUB_CLIENT_SECRET =
  process.env.GITHUB_CLIENT_SECRET || "dummy_github_secret";

passport.serializeUser((user: any, done) => {
  done(null, user.id);
});

passport.deserializeUser(async (id: string, done) => {
  try {
    const user = await prisma.user.findUnique({ where: { id } });
    done(null, user);
  } catch (error) {
    done(error, null);
  }
});

passport.use(
  new GoogleStrategy(
    {
      clientID: GOOGLE_CLIENT_ID,
      clientSecret: GOOGLE_CLIENT_SECRET,
      callbackURL: "http://localhost:4000/api/auth/google/callback",
    },
    async (accessToken, refreshToken, profile, done) => {
      try {
        const email = profile.emails?.[0]?.value;
        if (!email) {
          return done(new Error("No email found from Google") as any);
        }

        let user = await prisma.user.findFirst({
          where: {
            OR: [{ googleId: profile.id }, { email }],
          },
        });

        if (user) {
          if (!user.googleId) {
            user = await prisma.user.update({
              where: { id: user.id },
              data: { googleId: profile.id },
            });
          }
          return done(null, user);
        } else {
          user = await prisma.user.create({
            data: {
              email: email,
              name: profile.displayName || "Google User",
              googleId: profile.id,
            },
          });
          return done(null, user);
        }
      } catch (error) {
        return done(error as any);
      }
    },
  ),
);

passport.use(
  new GitHubStrategy(
    {
      clientID: GITHUB_CLIENT_ID,
      clientSecret: GITHUB_CLIENT_SECRET,
      callbackURL: "http://localhost:4000/api/auth/github/callback",
      scope: ["user:email"],
    },
    async (
      accessToken: string,
      refreshToken: string,
      profile: any,
      done: any,
    ) => {
      try {
        const email = profile.emails?.[0]?.value;
        if (!email) {
          return done(new Error("No email found from GitHub") as any);
        }

        let user = await prisma.user.findFirst({
          where: {
            OR: [{ githubId: profile.id }, { email }],
          },
        });

        if (user) {
          if (!user.githubId) {
            user = await prisma.user.update({
              where: { id: user.id },
              data: { githubId: profile.id },
            });
          }
          return done(null, user);
        } else {
          user = await prisma.user.create({
            data: {
              email: email,
              name: profile.displayName || profile.username || "GitHub User",
              githubId: profile.id,
            },
          });
          return done(null, user);
        }
      } catch (error) {
        return done(error as any);
      }
    },
  ),
);
