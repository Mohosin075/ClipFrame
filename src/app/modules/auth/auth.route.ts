import express from 'express'
import passport from 'passport'
import { PassportAuthController } from './passport.auth/passport.auth.controller'
import { CustomAuthController } from './custom.auth/custom.auth.controller'
import validateRequest from '../../middleware/validateRequest'
import { AuthValidations } from './auth.validation'
import { USER_ROLES } from '../../../enum/user'
import auth, { tempAuth } from '../../middleware/auth'
import { JwtPayload } from 'jsonwebtoken'
import { checkBusinessManage } from '../subscription/checkSubscription'

const router = express.Router()

router.post(
  '/signup',
  validateRequest(AuthValidations.createUserZodSchema),
  CustomAuthController.createUser,
)
router.post(
  '/admin-login',
  validateRequest(AuthValidations.loginZodSchema),
  CustomAuthController.adminLogin,
)
router.post(
  '/login',
  validateRequest(AuthValidations.loginZodSchema),
  passport.authenticate('local', { session: false }),
  PassportAuthController.login,
)

router.get(
  '/google',
  passport.authenticate('google', { scope: ['profile', 'email'] }),
)

router.get(
  '/google/callback',
  passport.authenticate('google', { session: false }),
  PassportAuthController.googleAuthCallback,
)

router.post(
  '/verify-account',
  validateRequest(AuthValidations.verifyAccountZodSchema),
  CustomAuthController.verifyAccount,
)

router.post(
  '/custom-login',
  validateRequest(AuthValidations.loginZodSchema),
  CustomAuthController.customLogin,
)

router.post(
  '/forget-password',
  validateRequest(AuthValidations.forgetPasswordZodSchema),
  CustomAuthController.forgetPassword,
)
router.post(
  '/reset-password',
  validateRequest(AuthValidations.resetPasswordZodSchema),
  CustomAuthController.resetPassword,
)

router.post(
  '/resend-otp',
  tempAuth(USER_ROLES.ADMIN, USER_ROLES.CREATOR, USER_ROLES.USER),
  validateRequest(AuthValidations.resendOtpZodSchema),
  CustomAuthController.resendOtp,
)

router.post(
  '/change-password',
  auth(USER_ROLES.ADMIN, USER_ROLES.CREATOR, USER_ROLES.USER),
  validateRequest(AuthValidations.changePasswordZodSchema),
  CustomAuthController.changePassword,
)

router.delete(
  '/delete-account',
  auth(USER_ROLES.ADMIN, USER_ROLES.CREATOR, USER_ROLES.USER),
  validateRequest(AuthValidations.deleteAccount),
  CustomAuthController.deleteAccount,
)
router.post('/refresh-token', CustomAuthController.getRefreshToken)

router.post(
  '/social-login',
  validateRequest(AuthValidations.socialLoginZodSchema),
  CustomAuthController.socialLogin,
)

router.post(
  '/logout',
  auth(USER_ROLES.ADMIN, USER_ROLES.CREATOR, USER_ROLES.USER),
  CustomAuthController.logout,
)

// -------------------- Facebook Login Routes --------------------

// 👉 Connect Facebook only
router.get(
  '/facebook',
  // auth(USER_ROLES.ADMIN, USER_ROLES.USER),
  async (req, res, next) => {
    const user = req.user as JwtPayload

    // check how many business connected

    if (user) {
      await checkBusinessManage(user)
    }

    // flag the flow
    req.session.connectType = 'facebook'
    next()
  },
  passport.authenticate('facebook', {
    scope: [
      'email',
      'public_profile',
      'pages_show_list',
      'pages_read_engagement',
      'pages_manage_posts',
      'pages_read_user_content',
      'business_management',
    ],
  }),
)

// 👉 Connect Instagram (uses FB login w/ IG scopes)
router.get(
  '/instagram',
  auth(USER_ROLES.ADMIN, USER_ROLES.USER),
  async (req, res, next) => {
    const user = req.user as JwtPayload

    // check how many business connected

    if (user) {
      await checkBusinessManage(user)
    }
    req.session.connectType = 'instagram'
    next()
  },
  passport.authenticate('facebook', {
    scope: [
      'email',
      'public_profile',
      'pages_show_list',
      'instagram_basic',
      'instagram_content_publish',
      'instagram_manage_insights',
      'instagram_manage_comments',
      'business_management',
      'read_insights',
    ],
  }),
)

export const AuthRoutes = router
