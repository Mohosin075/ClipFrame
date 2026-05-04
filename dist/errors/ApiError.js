"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
class ApiError extends Error {
    /**
     * @param message Fallback / default English (logs, unmapped locales)
     * @param optionsOrStack Optional i18n keys, or legacy stack string (3rd arg string)
     */
    constructor(statusCode, message, optionsOrStack) {
        super(message !== null && message !== void 0 ? message : '');
        this.statusCode = statusCode;
        if (typeof optionsOrStack === 'string') {
            this.stack = optionsOrStack;
        }
        else if (optionsOrStack === null || optionsOrStack === void 0 ? void 0 : optionsOrStack.messageKey) {
            this.messageKey = optionsOrStack.messageKey;
            this.messageValues = optionsOrStack.messageValues;
        }
        if (!this.stack) {
            Error.captureStackTrace(this, this.constructor);
        }
    }
}
exports.default = ApiError;
