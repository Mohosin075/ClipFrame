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
import axios from 'axios'
import qs from 'qs'
import { Socialintegration } from './app/modules/socialintegration/socialintegration.model'

const app = express()

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

// -------------------- Stripe Webhook --------------------
app.use(
  '/webhook',
  express.raw({ type: 'application/json' }),
  handleStripeWebhook,
)

// callback facebook
app.get(
  '/facebook/callback',
  passport.authenticate('facebook', {
    failureRedirect:
      'https://std-appraisal-custom-valued.trycloudflare.com/privacy-policy',
    session: false,
  }),
  (req: any, res) => {
    const userData = req.user

    // const redirectUrl = `https://std-appraisal-custom-valued.trycloudflare.com/privacy-policy?accessToken=${userData.accessToken}&refreshToken=${userData.refreshToken}&email=${userData.email}&name=${userData.name}`
    // res.redirect(redirectUrl)

    res.json({
      success: true,
      accessToken: userData.accessToken,
      refreshToken: userData.refreshToken,
      email: userData.email,
      name: userData.name,
    })
  },
)

app.get('/instagram/connect', (req: any, res: any) => {
  const instagramAuthUrl = `https://www.instagram.com/oauth/authorize?force_reauth=true&client_id=1301179034780432&redirect_uri=https://std-appraisal-custom-valued.trycloudflare.com/instagram/callback&response_type=code&scope=instagram_business_basic%2Cinstagram_business_manage_messages%2Cinstagram_business_manage_comments%2Cinstagram_business_content_publish%2Cinstagram_business_manage_insights`

  res.redirect(instagramAuthUrl)
})

// for Instagram

app.get('/instagram/callback', async (req: any, res: any) => {
  const code = req.query.code as string

  if (!code) return res.status(400).send('Missing code')

  try {
    // Step 1: Exchange code for short-lived access token
    const tokenResponse = await axios.post(
      'https://api.instagram.com/oauth/access_token',
      qs.stringify({
        client_id: config.instagram.client_id!,
        client_secret: config.instagram.client_secret!,
        grant_type: 'authorization_code',
        redirect_uri: config.instagram.callback_url!,
        code,
      }),
      {
        headers: { 'Content-Type': 'application/x-www-form-urlencoded' },
      },
    )

    const shortLivedToken: string = tokenResponse.data.access_token
    const userId: string = tokenResponse.data.user_id

    // Step 2: Exchange short-lived token for long-lived token
    const longTokenResponse = await axios.get(
      'https://graph.instagram.com/access_token',
      {
        params: {
          grant_type: 'ig_exchange_token',
          client_secret: config.instagram.client_secret!,
          access_token: shortLivedToken,
        },
      },
    )

    const longLivedToken: string = longTokenResponse.data.access_token
    const expiresIn: number = longTokenResponse.data.expires_in

    console.log({ longLivedToken, expiresIn })

    // Respond with token info
    res.json({
      userId,
      accessToken: longLivedToken,
      expiresIn,
    })
  } catch (error: unknown) {
    if (axios.isAxiosError(error)) {
      console.error(error.response?.data || error.message)
    } else {
      console.error(error)
    }
    res.status(500).send('Instagram login failed')
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
