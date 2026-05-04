"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.WebhookController = void 0;
const http_status_codes_1 = require("http-status-codes");
const config_1 = __importDefault(require("../../../config"));
const stripe_service_1 = require("./stripe.service");
const webhook_service_1 = require("./webhook.service");
const ApiError_1 = __importDefault(require("../../../errors/ApiError"));
const catchAsync_1 = __importDefault(require("../../../shared/catchAsync"));
const handleStripeWebhook = (0, catchAsync_1.default)(async (req, res) => {
    const signature = req.headers['stripe-signature'];
    const webhookSecret = config_1.default.stripe.webhookSecret;
    if (!signature || !webhookSecret) {
        throw new ApiError_1.default(http_status_codes_1.StatusCodes.BAD_REQUEST, 'Stripe signature or webhook secret missing');
    }
    let event;
    try {
        event = stripe_service_1.stripeService.constructWebhookEvent(req.body, signature);
    }
    catch (err) {
        console.error(`Webhook signature verification failed: ${err.message}`);
        throw new ApiError_1.default(http_status_codes_1.StatusCodes.BAD_REQUEST, `Webhook Error: ${err.message}`);
    }
    // Process the event
    await webhook_service_1.webhookService.processWebhookEvent(event);
    res.status(http_status_codes_1.StatusCodes.OK).json({ received: true });
});
exports.WebhookController = {
    handleStripeWebhook,
};
