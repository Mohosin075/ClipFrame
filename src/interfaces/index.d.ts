import { JwtPayload } from 'jsonwebtoken'
import 'express-session'

declare global {
  namespace Express {
    interface Request {
      user: JwtPayload
    }
  }
}

declare module 'express-session' {
  interface SessionData {
    connectType?: 'facebook' | 'instagram'
  }
}
