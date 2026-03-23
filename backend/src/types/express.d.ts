import { JwtPayload } from "jsonwebtoken";

declare global {
  namespace Express {
    interface User {
      id: string;
      email?: string;
      [key: string]: any;
    }
  }
}
