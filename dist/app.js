"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
require("./i18n/i18n");
const i18n_1 = require("./i18n/i18n");
const cors_1 = __importDefault(require("cors"));
const express_1 = __importDefault(require("express"));
const http_status_codes_1 = require("http-status-codes");
const path_1 = __importDefault(require("path"));
const express_session_1 = __importDefault(require("express-session"));
const cookie_parser_1 = __importDefault(require("cookie-parser"));
const passport_1 = __importDefault(require("./app/modules/auth/passport.auth/config/passport"));
const routes_1 = __importDefault(require("./routes"));
const morgan_1 = require("./shared/morgan");
const globalErrorHandler_1 = __importDefault(require("./app/middleware/globalErrorHandler"));
require("./task/scheduler");
const webhook_controller_1 = require("./app/modules/subscription/webhook.controller");
const config_1 = __importDefault(require("./config"));
const resolveTranslatedMessage_1 = require("./i18n/resolveTranslatedMessage");
const socialintegration_service_1 = require("./app/modules/socialintegration/socialintegration.service");
const app = (0, express_1.default)();
// -------------------- Stripe Webhook --------------------
app.use('/webhook', express_1.default.raw({ type: 'application/json' }), webhook_controller_1.WebhookController.handleStripeWebhook);
// -------------------- Middleware --------------------
// Session must come before passport
app.use((0, express_session_1.default)({
    secret: config_1.default.jwt.jwt_secret || 'secret',
    resave: false,
    saveUninitialized: false,
    cookie: { secure: false }, // true if using HTTPS
}));
// Initialize Passport
app.use(passport_1.default.initialize());
app.use(passport_1.default.session());
// CORS
app.use((0, cors_1.default)({
    origin: [
        '*',
        'http://localhost:3000',
        'http://195.35.6.13:3004',
        'http://195.35.6.13:4001',
        'http://10.10.7.58:3001',
    ],
    credentials: true,
}));
// Body parser
app.use(express_1.default.json());
app.use(express_1.default.urlencoded({ extended: true }));
// Cookie parser
app.use((0, cookie_parser_1.default)());
// i18n: locale from ?lang=es or Accept-Language (en | es)
app.use(i18n_1.i18nMiddleware);
// Morgan logging
app.use(morgan_1.Morgan.successHandler);
app.use(morgan_1.Morgan.errorHandler);
// -------------------- Static Files --------------------
app.use(express_1.default.static('uploads'));
app.use('/uploads', express_1.default.static(path_1.default.join(process.cwd(), 'uploads')));
// routes/auth.ts
// import express from 'express'
// import passport from 'passport'
// const router = express.Router()
// common callback
app.get('/facebook/callback', passport_1.default.authenticate('facebook', { failureRedirect: '/auth/fail' }), (req, res) => {
    console.log('✅ OAuth successful, user:', req.user);
    // send them back to frontend with a token or success msg
    res.redirect(`https://mohosin5001.binarybards.online/privacy-policy`);
});
//
app.get('/tiktok/callback', async (req, res) => {
    console.log('🎯 TikTok callback hit');
    const { code, state } = req.query;
    const userId = state;
    // Define success and failure redirect URLs
    const successUrl = `https://mohosin5001.binarybards.online/privacy-policy?connected=true`;
    const failureUrl = `https://mohosin5001.binarybards.online/privacy-policy?connected=false`;
    try {
        if (!code || !userId) {
            console.error('Missing code or userId');
            return res.redirect(failureUrl);
        }
        await (0, socialintegration_service_1.upsertTikTokAccounts)(code, userId);
        console.log('✅ TikTok account linked successfully');
        return res.redirect(successUrl);
    }
    catch (error) {
        console.error('❌ TikTok account linking failed:', error);
        return res.redirect(failureUrl);
    }
});
// -------------------- API Routes --------------------
app.use('/api/v1', routes_1.default);
// -------------------- Privacy Policy --------------------
app.get('/privacy-policy', (req, res) => {
    res.sendFile(path_1.default.join(__dirname, 'privacy-policy.html'));
});
// -------------------- Root / Live Response --------------------
app.get('/', (req, res) => {
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
  `);
});
// -------------------- Global Error Handler --------------------
app.use(globalErrorHandler_1.default);
// -------------------- 404 Handler --------------------
app.use((req, res) => {
    res.status(http_status_codes_1.StatusCodes.NOT_FOUND).json({
        success: false,
        message: (0, resolveTranslatedMessage_1.translateIfKey)(req, 'errors.notFoundTitle'),
        errorMessages: [
            {
                path: req.originalUrl,
                message: (0, resolveTranslatedMessage_1.translateIfKey)(req, 'errors.notFoundHint1'),
            },
            {
                path: '/docs',
                message: (0, resolveTranslatedMessage_1.translateIfKey)(req, 'errors.notFoundHint2'),
            },
        ],
        roast: (0, resolveTranslatedMessage_1.translateIfKey)(req, 'errors.notFoundRoast'),
        timestamp: new Date().toISOString(),
    });
});
exports.default = app;
