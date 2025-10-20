import cors from 'cors'
import express, { Request, Response } from 'express'
import { StatusCodes } from 'http-status-codes'
import path from 'path'
import session from 'express-session'
import cookieParser from 'cookie-parser'
import passport from './app/modules/auth/passport.auth/config/passport'

import router from './routes'
import { Morgan } from './shared/morgan'
import globalErrorHandler from './app/middleware/globalErrorHandler'
import './task/scheduler'
import handleStripeWebhook from './stripe/handleStripeWebhook'
import config from './config'
import { Socialintegration } from './app/modules/socialintegration/socialintegration.model'
import axios from 'axios'
import { User } from './app/modules/user/user.model'
import { upsertTikTokAccounts } from './app/modules/socialintegration/socialintegration.service'
import { getTiktokToken } from './helpers/tiktokAPIHelper'

const app = express()

// -------------------- Stripe Webhook --------------------
app.use(
  '/webhook',
  express.raw({ type: 'application/json' }),
  handleStripeWebhook,
)

// -------------------- Middleware --------------------
// Session must come before passport
app.use(
  session({
    secret: config.jwt.jwt_secret || 'secret',
    resave: false,
    saveUninitialized: false,
    cookie: { secure: false }, // true if using HTTPS
  }),
)

// Initialize Passport
app.use(passport.initialize())
app.use(passport.session())

// CORS
app.use(
  cors({
    origin: '*',
    credentials: true,
  }),
)

// Body parser
app.use(express.json())
app.use(express.urlencoded({ extended: true }))

// Cookie parser
app.use(cookieParser())

// Morgan logging
app.use(Morgan.successHandler)
app.use(Morgan.errorHandler)

// -------------------- Static Files --------------------
app.use(express.static('uploads'))
app.use('/uploads', express.static(path.join(process.cwd(), 'uploads')))

// routes/auth.ts
// import express from 'express'
// import passport from 'passport'

// const router = express.Router()

// common callback
app.get(
  '/facebook/callback',
  passport.authenticate('facebook', { failureRedirect: '/auth/fail' }),
  (req, res) => {
    console.log('✅ OAuth successful, user:', req.user)
    // send them back to frontend with a token or success msg
    res.redirect(
      `https://intensive-premiere-pope-threats.trycloudflare.com/privacy-policy`,
    )
  },
)

//

app.get('/tiktok/callback', async (req, res) => {
  console.log('🎯 TikTok callback hit')

  const { code, state } = req.query
  const userId = state

  // Define success and failure redirect URLs
  const successUrl = `https://intensive-premiere-pope-threats.trycloudflare.com/privacy-policy?connected=true`
  const failureUrl = `https://intensive-premiere-pope-threats.trycloudflare.com/privacy-policy?connected=false`

  try {
    if (!code || !userId) {
      console.error('Missing code or userId')
      return res.redirect(failureUrl)
    }

    await upsertTikTokAccounts(code as string, userId as string)

    console.log('✅ TikTok account linked successfully')
    return res.redirect(successUrl)
  } catch (error) {
    console.error('❌ TikTok account linking failed:', error)
    return res.redirect(failureUrl)
  }
})

// -------------------- API Routes --------------------

app.use('/api/v1', router)

// -------------------- Privacy Policy --------------------
app.get('/privacy-policy', (req, res) => {
  res.sendFile(path.join(__dirname, 'privacy-policy.html'))
})

// -------------------- Root / Live Response --------------------
app.get('/', (req: Request, res: Response) => {
  res.send(`
    <div style="
      display: flex;
      justify-content: center;
      align-items: center;
      height: 100vh;
      background: radial-gradient(circle at top left, #1e003e, #5e00a5);
      color: #fff;
      font-family: 'Segoe UI', Tahoma, Geneva, Verdana, sans-serif;
      text-align: center;
      padding: 2rem;
    ">
      <div>
        <h1 style="font-size: 3rem; margin-bottom: 1rem;">🛑 Whoa there, hacker man.</h1>
        <p style="font-size: 1.4rem; line-height: 1.6;">
          You really just typed <code style="color:#ffd700;">'/'</code> in your browser and expected magic?<br><br>
          This isn’t Hogwarts, and you’re not the chosen one. 🧙‍♂️<br><br>
          Honestly, even my 404 page gets more action than this route. 💀
        </p>
        <p style="margin-top: 2rem; font-size: 1rem; opacity: 0.7;">
          Now go back... and try something useful. Or not. I’m just a server.
        </p>
      </div>
    </div>
  `)
})

// -------------------- Global Error Handler --------------------
app.use(globalErrorHandler)

// -------------------- 404 Handler --------------------
app.use((req, res) => {
  res.status(StatusCodes.NOT_FOUND).json({
    success: false,
    message: 'Lost, are we?',
    errorMessages: [
      {
        path: req.originalUrl,
        message:
          "Congratulations, you've reached a completely useless API endpoint 👏",
      },
      {
        path: '/docs',
        message: 'Hint: Maybe try reading the docs next time? 📚',
      },
    ],
    roast: '404 brain cells not found. Try harder. 🧠❌',
    timestamp: new Date().toISOString(),
  })
})

export default app
