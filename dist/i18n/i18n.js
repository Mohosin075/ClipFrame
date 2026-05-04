"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.i18nMiddleware = void 0;
const i18next_1 = __importDefault(require("i18next"));
const i18next_http_middleware_1 = __importDefault(require("i18next-http-middleware"));
const en_1 = __importDefault(require("./locales/en"));
const es_1 = __importDefault(require("./locales/es"));
i18next_1.default.use(i18next_http_middleware_1.default.LanguageDetector).init({
    fallbackLng: 'en',
    supportedLngs: ['en', 'es'],
    preload: ['en', 'es'],
    ns: ['translation'],
    defaultNS: 'translation',
    interpolation: { escapeValue: false },
    detection: {
        order: ['querystring', 'header'],
        lookupQuerystring: 'lang',
        caches: false,
    },
    resources: {
        en: { translation: en_1.default },
        es: { translation: es_1.default },
    },
});
exports.i18nMiddleware = i18next_http_middleware_1.default.handle(i18next_1.default);
exports.default = i18next_1.default;
