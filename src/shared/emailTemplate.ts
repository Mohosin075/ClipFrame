import { ICreateAccount, IResetPassword, ISubscriptionWelcome, ITrialEnding, IPaymentSuccess, IPaymentFailed, ISubscriptionCanceled, IPlanChange } from '../interfaces/emailTemplate'

const createAccount = (values: ICreateAccount) => {
  console.log(values, 'values')
  const data = {
    to: values.email,
    subject: `Verify your account, ${values.name}`,
    html: `
    <body style="font-family: Arial, sans-serif; background-color: #f4f4f4; margin: 0; padding: 0;">
      <table border="0" cellpadding="0" cellspacing="0" width="100%" style="max-width: 600px; margin: 20px auto; background-color: #ffffff; border-radius: 8px; box-shadow: 0 4px 8px rgba(0,0,0,0.05);">
        <tr>
          <td align="center" style="padding: 40px 0;">
            <img src="https://res.cloudinary.com/dmvht7o8m/image/upload/v1737711309/download_bjkj2g.png" alt="Logo" style="width: 150px; height: auto;">
          </td>
        </tr>
        <tr>
          <td style="padding: 20px 40px;">
            <h1 style="color: #333333; font-size: 24px; margin-bottom: 20px;">Email Verification</h1>
            <p style="color: #666666; font-size: 16px; line-height: 1.5;">Your verification code is:</p>
            <div style="background-color: #f0f0f0; border-radius: 4px; padding: 15px; margin: 20px 0; text-align: center;">
              <span style="font-size: 32px; font-weight: bold; color: #4a4a4a;">${values.otp}</span>
            </div>
            <p style="color: #666666; font-size: 16px; line-height: 1.5;">This code will expire in 5 minutes. If you didn't request this code, please ignore this email.</p>
          </td>
        </tr>
        <tr>
          <td style="padding: 20px 40px; text-align: center; color: #999999; font-size: 14px;">
            <p>&copy; 2024 Your Company. All rights reserved.</p>
          </td>
        </tr>
      </table>
    </body>
  `,
  }
  return data
}

const resetPassword = (values: IResetPassword) => {
  const data = {
    to: values.email,
    subject: `Reset your password, ${values.name}`,
    html: `
    <body style="font-family: Arial, sans-serif; background-color: #f4f4f4; margin: 0; padding: 0;">
      <table border="0" cellpadding="0" cellspacing="0" width="100%" style="max-width: 600px; margin: 20px auto; background-color: #ffffff; border-radius: 8px; box-shadow: 0 4px 8px rgba(0,0,0,0.05);">
        <tr>
          <td align="center" style="padding: 40px 0;">
            <img src="https://res.cloudinary.com/dmvht7o8m/image/upload/v1737711309/download_bjkj2g.png" alt="Logo" style="width: 150px; height: auto;">
          </td>
        </tr>
        <tr>
          <td style="padding: 20px 40px;">
            <h1 style="color: #333333; font-size: 24px; margin-bottom: 20px;">Password Reset</h1>
            <p style="color: #666666; font-size: 16px; line-height: 1.5;">Your password reset code is:</p>
            <div style="background-color: #f0f0f0; border-radius: 4px; padding: 15px; margin: 20px 0; text-align: center;">
              <span style="font-size: 32px; font-weight: bold; color: #4a4a4a;">${values.otp}</span>
            </div>
            <p style="color: #666666; font-size: 16px; line-height: 1.5;">This code will expire in 5 minutes. If you didn't request this code, please ignore this email.</p>
          </td>
        </tr>
        <tr>
          <td style="padding: 20px 40px; text-align: center; color: #999999; font-size: 14px;">
            <p>&copy; 2024 Your Company. All rights reserved.</p>
          </td>
        </tr>
      </table>
    </body>
  `,
  }
  return data
}

const resendOtp = (values: {
  email: string
  name: string
  otp: string
  type: 'resetPassword' | 'createAccount'
}) => {
  const isReset = values.type === 'resetPassword'
  const data = {
    to: values.email,
    subject: `${isReset ? 'Password Reset' : 'Account Verification'} - New Code`,
    html: `
    <body style="font-family: Arial, sans-serif; background-color: #f4f4f4; margin: 0; padding: 0;">
      <table border="0" cellpadding="0" cellspacing="0" width="100%" style="max-width: 600px; margin: 20px auto; background-color: #ffffff; border-radius: 8px; box-shadow: 0 4px 8px rgba(0,0,0,0.05);">
        <tr>
          <td align="center" style="padding: 40px 0;">
            <img src="https://res.cloudinary.com/dmvht7o8m/image/upload/v1737711309/download_bjkj2g.png" alt="Logo" style="width: 150px; height: auto;">
          </td>
        </tr>
        <tr>
          <td style="padding: 20px 40px;">
            <h1 style="color: #333333; font-size: 24px; margin-bottom: 20px;">New Verification Code</h1>
            <p style="color: #666666; font-size: 16px; line-height: 1.5;">
              Hello ${values.name},<br><br>
              You requested a new ${isReset ? 'password reset' : 'verification'} code. Here's your new code:
            </p>
            <div style="background-color: #f0f0f0; border-radius: 4px; padding: 15px; margin: 20px 0; text-align: center;">
              <span style="font-size: 32px; font-weight: bold; color: #4a4a4a;">${values.otp}</span>
            </div>
            <p style="color: #666666; font-size: 16px; line-height: 1.5;">
              This code will expire in 5 minutes.<br>
              If you didn't request this code, please ignore this email or contact support.
            </p>
            <div style="margin-top: 30px; padding: 15px; background-color: #fff8e1; border-radius: 4px; border-left: 4px solid #ffd54f;">
              <p style="color: #666666; font-size: 14px; margin: 0;">
                For security reasons, never share this code with anyone.
              </p>
            </div>
          </td>
        </tr>
        <tr>
          <td style="padding: 20px 40px; text-align: center; color: #999999; font-size: 14px; border-top: 1px solid #eeeeee;">
            <p>&copy; 2024 Your Company. All rights reserved.</p>
          </td>
        </tr>
      </table>
    </body>
  `,
  }
  return data
}

const subscriptionWelcome = (values: ISubscriptionWelcome) => {
  return {
    to: values.email,
    subject: `Welcome to ${values.planName} - ClipFrame`,
    html: `
    <body style="font-family: Arial, sans-serif; background-color: #f4f4f4; margin: 0; padding: 0;">
      <table border="0" cellpadding="0" cellspacing="0" width="100%" style="max-width: 600px; margin: 20px auto; background-color: #ffffff; border-radius: 8px; box-shadow: 0 4px 8px rgba(0,0,0,0.05);">
        <tr>
          <td style="padding: 20px 40px;">
            <h1 style="color: #333333; font-size: 24px;">Welcome, ${values.name}!</h1>
            <p style="color: #666666; font-size: 16px;">You are now subscribed to the <strong>${values.planName}</strong> plan.</p>
            ${values.isTrialing ? `<p style="color: #ff9800; font-weight: bold;">Your ${values.trialDays}-day free trial has started!</p>` : ''}
            <div style="background-color: #f9f9f9; padding: 15px; border-radius: 4px; border-left: 4px solid #4caf50;">
              <p style="margin: 0; font-weight: bold;">Plan Details:</p>
              <ul style="color: #666666; font-size: 14px;">
                <li>Price: $${values.planPrice} / ${values.planInterval}</li>
                ${values.trialEndDate ? `<li>Trial Ends: ${new Date(values.trialEndDate).toLocaleDateString()}</li>` : ''}
              </ul>
            </div>
            <p style="margin-top: 20px;"><strong>What's included:</strong></p>
            <ul style="color: #666666; font-size: 14px;">
              ${values.features.map((f: string) => `<li>${f}</li>`).join('')}
            </ul>
            <div style="text-align: center; margin-top: 30px;">
              <a href="${values.dashboardUrl}" style="background-color: #007bff; color: #ffffff; padding: 12px 25px; text-decoration: none; border-radius: 4px; font-weight: bold;">Go to Dashboard</a>
            </div>
          </td>
        </tr>
      </table>
    </body>
  `,
  }
}

const trialEnding = (values: ITrialEnding) => {
  return {
    to: values.email,
    subject: `Your trial is ending in ${values.daysLeft} days`,
    html: `
    <body style="font-family: Arial, sans-serif; background-color: #f4f4f4; margin: 0; padding: 0;">
      <table border="0" cellpadding="0" cellspacing="0" width="100%" style="max-width: 600px; margin: 20px auto; background-color: #ffffff; border-radius: 8px;">
        <tr>
          <td style="padding: 20px 40px;">
            <h1 style="color: #333333; font-size: 24px;">Hi ${values.name},</h1>
            <p style="color: #666666; font-size: 16px;">Your free trial for <strong>${values.planName}</strong> is ending on ${new Date(values.trialEndDate).toLocaleDateString()}.</p>
            <p>To avoid any interruption in service, your card will be charged $${values.planPrice} on that date for your next ${values.planInterval}.</p>
            <div style="text-align: center; margin-top: 30px;">
              <a href="${values.upgradeUrl}" style="background-color: #28a745; color: #ffffff; padding: 12px 25px; text-decoration: none; border-radius: 4px; font-weight: bold;">Manage Subscription</a>
            </div>
          </td>
        </tr>
      </table>
    </body>
  `,
  }
}

const paymentSuccess = (values: IPaymentSuccess) => {
  return {
    to: values.email,
    subject: `Payment Successful - Invoice ${values.invoiceNumber}`,
    html: `
    <body style="font-family: Arial, sans-serif;">
      <div style="max-width: 600px; margin: 0 auto; padding: 20px;">
        <h2>Payment Successful</h2>
        <p>Thank you for your payment, ${values.name}.</p>
        <div style="border: 1px solid #ddd; padding: 15px; border-radius: 4px;">
          <p><strong>Amount Paid:</strong> ${values.currency} ${values.amount}</p>
          <p><strong>Invoice Number:</strong> ${values.invoiceNumber}</p>
          <p><strong>Next Payment Date:</strong> ${new Date(values.nextPaymentDate).toLocaleDateString()}</p>
        </div>
        ${values.invoiceUrl ? `<p style="margin-top: 20px;"><a href="${values.invoiceUrl}">View Invoice Details</a></p>` : ''}
        <p style="margin-top: 20px;"><a href="${values.dashboardUrl}" style="display:inline-block; background:#007bff; color:#fff; padding:10px 20px; text-decoration:none; border-radius:4px;">Back to Dashboard</a></p>
      </div>
    </body>
  `,
  }
}

const paymentFailed = (values: IPaymentFailed) => {
  return {
    to: values.email,
    subject: `Payment Failed - Action Required`,
    html: `
    <body style="font-family: Arial, sans-serif;">
      <div style="max-width: 600px; margin: 0 auto; padding: 20px; border: 1px solid #ff4d4f; border-radius: 8px;">
        <h2 style="color: #ff4d4f;">Payment Failed</h2>
        <p>Hi ${values.name}, we were unable to process your payment for <strong>${values.planName}</strong>.</p>
        <p style="color: #666;">Reason: ${values.failureReason}</p>
        <p>We will attempt to process the payment again on ${new Date(values.retryDate).toLocaleDateString()}.</p>
        <div style="text-align: center; margin-top: 30px;">
          <a href="${values.updatePaymentUrl}" style="background-color: #ff4d4f; color: #ffffff; padding: 12px 25px; text-decoration: none; border-radius: 4px; font-weight: bold;">Update Payment Method</a>
        </div>
      </div>
    </body>
  `,
  }
}

const subscriptionCanceled = (values: ISubscriptionCanceled) => {
  return {
    to: values.email,
    subject: `Subscription Canceled`,
    html: `
    <body style="font-family: Arial, sans-serif;">
      <div style="max-width: 600px; margin: 0 auto; padding: 20px;">
        <h2>Subscription Canceled</h2>
        <p>Hi ${values.name}, your <strong>${values.planName}</strong> subscription has been canceled.</p>
        <p>You will still have access to your features until <strong>${new Date(values.accessUntil).toLocaleDateString()}</strong>.</p>
        <p>We're sorry to see you go! If you have a moment, we'd love to hear your feedback.</p>
        <p><a href="${values.feedbackUrl}">Give Feedback</a> | <a href="${values.reactivateUrl}">Reactivate Subscription</a></p>
      </div>
    </body>
  `,
  }
}

const planChange = (values: IPlanChange) => {
  return {
    to: values.email,
    subject: `Your plan has been updated to ${values.newPlanName}`,
    html: `
    <body style="font-family: Arial, sans-serif;">
      <div style="max-width: 600px; margin: 0 auto; padding: 20px;">
        <h2>Plan Updated</h2>
        <p>Hi ${values.name}, your plan was successfully changed to <strong>${values.newPlanName}</strong>.</p>
        <p style="padding: 10px; background: #e6f7ff; border-radius: 4px;">${values.prorationNote}</p>
        <h3>Your new benefits:</h3>
        <ul>
          ${values.features.map((f: string) => `<li>${f}</li>`).join('')}
        </ul>
        <p><a href="${values.billingUrl}">View Billing Information</a></p>
      </div>
    </body>
  `,
  }
}

export const emailTemplate = {
  createAccount,
  resetPassword,
  resendOtp,
  subscriptionWelcome,
  trialEnding,
  paymentSuccess,
  paymentFailed,
  subscriptionCanceled,
  planChange,
}
