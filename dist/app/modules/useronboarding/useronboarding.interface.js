"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.TargetAudience = exports.ContentLanguage = exports.SocialPlatform = void 0;
var SocialPlatform;
(function (SocialPlatform) {
    SocialPlatform["FACEBOOK"] = "facebook";
    SocialPlatform["INSTAGRAM"] = "instagram";
    SocialPlatform["TIKTOK"] = "tiktok";
    SocialPlatform["TWITTER"] = "twitter";
    SocialPlatform["LIKEE"] = "likee";
})(SocialPlatform || (exports.SocialPlatform = SocialPlatform = {}));
var ContentLanguage;
(function (ContentLanguage) {
    ContentLanguage["EN"] = "en";
    ContentLanguage["BN"] = "bn";
    ContentLanguage["ES"] = "es";
})(ContentLanguage || (exports.ContentLanguage = ContentLanguage = {}));
var TargetAudience;
(function (TargetAudience) {
    TargetAudience["LOCAL"] = "local";
    TargetAudience["TOURIST"] = "tourist";
    TargetAudience["ONLINE"] = "online";
    TargetAudience["ALL"] = "all";
})(TargetAudience || (exports.TargetAudience = TargetAudience = {}));
