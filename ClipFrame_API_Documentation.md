# 📚 ClipFrame API Documentation

This documentation provides a detailed reference for all ClipFrame API endpoints.

## Table of Contents

- [auth](#auth)
- [user](#user)
- [public](#public)
- [useronboarding](#useronboarding)
- [content](#content)
- [Plan](#plan)
- [Subscription](#subscription)
- [social integration](#social-integration)
- [schedules](#schedules)
- [content template](#content-template)
- [stats](#stats)

## auth

### signup

**Method:** `POST`  
**URL:** `{{base_url}}/api/v1/auth/signup`

**Headers:**
_None_

**Request Body:**

```json
{
  "name": "Summer Sale Campaign",
  "email": "john.doe@example.com",
  "password": "+8801712345678",
  "phone": "+8801712345678",
  "role": "Summer Sale Campaign"
}
```

### verify account

**Method:** `POST`  
**URL:** `{{base_url}}/api/v1/auth/verify-account`

**Headers:**
_None_

**Request Body:**

```json
{
  "email": "john.doe@example.com",
  "oneTimeCode": "+8801712345678"
}
```

### forget password

**Method:** `POST`  
**URL:** `{{base_url}}/api/v1/auth/forget-password`

**Headers:**
_None_

**Request Body:**

```json
{
  "email": "john.doe@example.com"
}
```

### resend-otp

**Method:** `POST`  
**URL:** `{{base_url}}/api/v1/auth/resend-otp`

**Headers:**

- **Authorization**: `Bearer {{YOUR_TOKEN_HERE}}`

**Request Body:**
_None_

### reset password

**Method:** `POST`  
**URL:** `{{base_url}}/api/v1/auth/reset-password`

**Headers:**

- **Authorization**: `{{YOUR_TOKEN_HERE}}`

**Request Body:**

```json
{
  "newPassword": "+8801712345678",
  "confirmPassword": "+8801712345678"
}
```

### delete account

**Method:** `DELETE`  
**URL:** `{{base_url}}/api/v1/auth/delete-account`

**Headers:**

- **Authorization**: `Bearer {{YOUR_TOKEN_HERE}}`

**Request Body:**

```json
{
  "password": "+8801712345678"
}
```

### change password

**Method:** `POST`  
**URL:** `{{base_url}}/api/v1/auth/change-password`

**Headers:**

- **Authorization**: `Bearer {{YOUR_TOKEN_HERE}}`

**Request Body:**

```json
{
  "currentPassword": "+8801712345678",
  "newPassword": "+8801712345678",
  "confirmPassword": "+8801712345678"
}
```

### refresh-token

**Method:** `POST`  
**URL:** `{{base_url}}/api/v1/auth/refresh-token`

**Headers:**

- **Authorization**: `Bearer {{YOUR_TOKEN_HERE}}`

**Request Body:**
_None_

### custom-login

**Method:** `POST`  
**URL:** `{{base_url}}/api/v1/auth/custom-login`

**Headers:**
_None_

**Request Body:**

```json
{
  "email": "web.mohosin@gmail.com",
  "password": "12345678",
  "rememberMe": true
}
```

### google login

**Method:** `GET`  
**URL:** `{{base_url}}/api/v1/auth/google`

**Headers:**

- **Authorization**: `Bearer {{YOUR_TOKEN_HERE}}`

**Request Body:**

```json
{
  "currentPassword": "+8801712345678",
  "newPassword": "+8801712345678",
  "confirmPassword": "+8801712345678"
}
```

### social login

**Method:** `POST`  
**URL:** `{{base_url}}/api/v1/auth/social-login`

**Headers:**

- **Authorization**: `Bearer {{YOUR_TOKEN_HERE}}`

**Request Body:**

```json
{
  "appId": "+8801712345678",
  "deviceToken": "Summer Sale Campaign"
}
```

### logout

**Method:** `POST`  
**URL:** `{{base_url}}/api/v1/auth/logout`

**Headers:**

- **Authorization**: `Bearer {{YOUR_TOKEN_HERE}}`

**Request Body:**

```json
{
  "password": "+8801712345678"
}
```

## user

### update profile

**Method:** `PATCH`  
**URL:** `{{base_url}}/api/v1/user/profile`

**Headers:**

- **Authorization**: `Bearer {{YOUR_TOKEN_HERE}}`

**Request Body:**

- **name** (text): `Md Mohsoin Ali`
- **image** (file): ``

### get all user

**Method:** `GET`  
**URL:** `{{base_url}}/api/v1/user/`

**Headers:**

- **Authorization**: `Bearer {{YOUR_TOKEN_HERE}}`

**Request Body:**
_None_

### get user by id

**Method:** `GET`  
**URL:** `{{base_url}}/api/v1/user/68b9eae85bf3094e97acd28b`

**Headers:**

- **Authorization**: `Bearer {{YOUR_TOKEN_HERE}}`

**Request Body:**

```json
{
  "name": "Summer Sale Campaign"
}
```

### get user profile

**Method:** `GET`  
**URL:** `{{base_url}}/api/v1/user/profile`

**Headers:**

- **Authorization**: `Bearer {{YOUR_TOKEN_HERE}}`

**Request Body:**
_None_

**Example Response:**

```json
{
  "statusCode": 200,
  "success": true,
  "message": "Summer Sale Campaign",
  "data": {
    "_id": "64b8f1c1234abcd567ef8901",
    "name": "Summer Sale Campaign",
    "email": "john.doe@example.com",
    "status": "Summer Sale Campaign",
    "verified": true,
    "role": "Summer Sale Campaign",
    "createdAt": "Summer Sale Campaign",
    "updatedAt": "Summer Sale Campaign",
    "id": "64b8f1c1234abcd567ef8901",
    "platforms": [
      "Summer Sale Campaign",
      "Summer Sale Campaign",
      "Summer Sale Campaign"
    ],
    "preferredLanguages": ["Summer Sale Campaign", "Summer Sale Campaign"]
  }
}
```

### delete my profile

**Method:** `DELETE`  
**URL:** `{{base_url}}/api/v1/user/profile`

**Headers:**

- **Authorization**: `Bearer {{YOUR_TOKEN_HERE}}`

**Request Body:**

```json
{
  "password": "+8801712345678"
}
```

### delete user by id

**Method:** `DELETE`  
**URL:** `{{base_url}}/api/v1/user/68b9eae85bf3094e97acd28b`

**Headers:**

- **Authorization**: `Bearer {{YOUR_TOKEN_HERE}}`

**Request Body:**

```json
{
  "name": "Summer Sale Campaign"
}
```

### update user status by id

**Method:** `PATCH`  
**URL:** `{{base_url}}/api/v1/user/6897a6ca11b2927166ac5c7a`

**Headers:**

- **Authorization**: `Bearer {{YOUR_TOKEN_HERE}}`

**Request Body:**

```json
{
  "status": "Summer Sale Campaign"
}
```

## public

### faq

#### create faq

**Method:** `POST`  
**URL:** `{{base_url}}/v1/public/faq`

**Headers:**

- **Authorization**: `Bearer {{YOUR_TOKEN_HERE}}`

**Request Body:**

```json
{
  "question": "StrongPass123",
  "answer": "StrongPass123"
}
```

#### update faq

**Method:** `PATCH`  
**URL:** `{{base_url}}/api/v1/public/faq/6897bf3b1fd6441a9eee6d25`

**Headers:**

- **Authorization**: `Bearer {{YOUR_TOKEN_HERE}}`

**Request Body:**

```json
{
  "question": "StrongPass123",
  "answer": "StrongPass123"
}
```

#### get faq by id

**Method:** `GET`  
**URL:** `{{base_url}}/api/v1/public/faq/single/6897bf3b1fd6441a9eee6d25`

**Headers:**

- **Authorization**: `Bearer {{YOUR_TOKEN_HERE}}`

**Request Body:**

```json
{
  "question": "StrongPass123",
  "answer": "StrongPass123"
}
```

#### get all faq

**Method:** `GET`  
**URL:** `{{base_url}}/api/v1/public/faq/all`

**Headers:**

- **Authorization**: `Bearer {{YOUR_TOKEN_HERE}}`

**Request Body:**

```json
{
  "question": "StrongPass123",
  "answer": "StrongPass123"
}
```

#### delete faq

**Method:** `DELETE`  
**URL:** `{{base_url}}/api/v1/public/faq/6897bf3b1fd6441a9eee6d25`

**Headers:**

- **Authorization**: `Bearer {{YOUR_TOKEN_HERE}}`

**Request Body:**

```json
{
  "question": "StrongPass123",
  "answer": "StrongPass123"
}
```

### contact

#### create contact

**Method:** `POST`  
**URL:** `{{base_url}}/api/v1/public/contact`

**Headers:**
_None_

**Request Body:**

```json
{
  "name": "Summer Sale Campaign",
  "email": "john.doe@example.com",
  "phone": "+8801712345678",
  "country": "Summer Sale Campaign",
  "message": "Summer Sale Campaign"
}
```

### create terms-and-condition

**Method:** `POST`  
**URL:** `{{base_url}}/api/v1/public`

**Headers:**
_None_

**Request Body:**

```json
{
  "content": "Summer Sale Campaign",
  "type": "Summer Sale Campaign"
}
```

### create privacy-policy

**Method:** `POST`  
**URL:** `{{base_url}}/api/v1/public`

**Headers:**
_None_

**Request Body:**

```json
{
  "content": "Summer Sale Campaign",
  "type": "Summer Sale Campaign"
}
```

### update public

**Method:** `PATCH`  
**URL:** `{{base_url}}/api/v1/public/update/6897b74fe0ee2c1ee0f0060b`

**Headers:**
_None_

**Request Body:**

```json
{
  "content": "Summer Sale Campaign",
  "type": "Summer Sale Campaign"
}
```

### create about

**Method:** `POST`  
**URL:** `{{base_url}}/api/v1/public`

**Headers:**
_None_

**Request Body:**

```json
{
  "content": "Summer Sale Campaign",
  "type": "Summer Sale Campaign"
}
```

### get terms-and-condition

**Method:** `GET`  
**URL:** `{{base_url}}/api/v1/public/terms-and-condition`

**Headers:**
_None_

**Request Body:**
_None_

### get privacy-policy

**Method:** `GET`  
**URL:** `{{base_url}}/api/v1/public/privacy-policy`

**Headers:**
_None_

**Request Body:**
_None_

### delete public

**Method:** `DELETE`  
**URL:** `{{base_url}}/api/v1/public/6897b74fe0ee2c1ee0f0060b`

**Headers:**
_None_

**Request Body:**
_None_

## useronboarding

### user useronboarding

**Method:** `POST`  
**URL:** `{{base_url}}/api/v1/useronboarding`

**Headers:**

- **Authorization**: `Bearer {{YOUR_TOKEN_HERE}}`

**Request Body:**

```json
{
  "socialHandles": [
    {
      "platform": "facebooK",
      "username": "yogastudio_fb",
      "_id": "68e6e407a1893c3a62049f12"
    }
  ]
}
```

### get user onboarding

**Method:** `GET`  
**URL:** `{{base_url}}/api/v1/useronboarding`

**Headers:**

- **Authorization**: `Bearer {{YOUR_TOKEN_HERE}}`

**Request Body:**
_None_

### useronboarding branding

**Method:** `POST`  
**URL:** `{{base_url}}/api/v1/useronboarding/branding`

**Headers:**

- **Authorization**: `Bearer {{YOUR_TOKEN_HERE}}`

**Request Body:**

- **brandColors** (text): `[

  {
  "name": "secondary",
  "value": "#33C1FF"
  }
  ]
  `

- **image** (file): ``

## content

### create content

**Method:** `POST`  
**URL:** `{{base_url}}/api/v1/content/create/{{templateId}}`

**Headers:**

- **Authorization**: `Bearer {{YOUR_TOKEN_HERE}}`

**Request Body:**

- **data** (text): `{
  "caption": "publish my video 00.50",
  "contentType": "story",

  "remindMe": true,
  "platform" : [ "instagram"],
  "tags": ["marketing", "launch", "promo"]
  }
  `

- **media** (file): ``
- **image** (file): ``
- **clips** (file): ``

### duplicate content

**Method:** `POST`  
**URL:** `{{base_url}}/api/v1/content/duplicate/68bf51a3e154e98e28815b2f`

**Headers:**

- **Authorization**: `Bearer {{YOUR_TOKEN_HERE}}`

**Request Body:**
_None_

### get content

**Method:** `GET`  
**URL:** `{{base_url}}/api/v1/content`

**Headers:**

- **Authorization**: `Bearer {{YOUR_TOKEN_HERE}}`

**Request Body:**
_None_

### get single content

**Method:** `GET`  
**URL:** `{{base_url}}/api/v1/content/68e16a7a0f7b263af2608acb`

**Headers:**

- **Authorization**: `Bearer {{YOUR_TOKEN_HERE}}`

**Request Body:**
_None_

### update content

**Method:** `PATCH`  
**URL:** `{{base_url}}/api/v1/content/68e16a7a0f7b263af2608acb`

**Headers:**

- **Authorization**: `Bearer {{YOUR_TOKEN_HERE}}`

**Request Body:**

```json
{
  "caption": "Summer Sale Campaign",
  "description": "Summer Sale Campaign",
  "scheduledAt": {
    "type": "Summer Sale Campaign",
    "date": "Summer Sale Campaign",
    "time": "Summer Sale Campaign"
  }
}
```

### delete content

**Method:** `DELETE`  
**URL:** `{{base_url}}/api/v1/content/68e16a7a0f7b263af2608acb`

**Headers:**

- **Authorization**: `Bearer {{YOUR_TOKEN_HERE}}`

**Request Body:**
_None_

### my-contents

**Method:** `GET`  
**URL:** `{{base_url}}/api/v1/content/my-contents`

**Headers:**

- **Authorization**: `Bearer {{YOUR_TOKEN_HERE}}`

**Request Body:**
_None_

## Plan

### Create Plan

**Method:** `POST`  
**URL:** `{{base_url}}/api/v1/plan`

**Headers:**

- **Authorization**: `Bearer {{YOUR_TOKEN_HERE}}`

**Request Body:**

```json
{
  "title": "Summer Sale Campaign",
  "description": "Summer Sale Campaign",
  "price": 0,
  "duration": "Summer Sale Campaign",
  "paymentType": "Summer Sale Campaign",
  "limits": {
    "reelsPerWeek": 1,
    "postsPerWeek": 1,
    "storiesPerWeek": 2,
    "carouselPerWeek": 2,
    "businessesManageable": 1
  }
}
```

### Get Plans

**Method:** `GET`  
**URL:** `{{base_url}}/api/v1/plan`

**Headers:**

- **Authorization**: `Bearer {{YOUR_TOKEN_HERE}}`

**Request Body:**
_None_

### Update Plan

**Method:** `PATCH`  
**URL:** `{{base_url}}/api/v1/plan/68c2147d0aa6fa53d76a263c`

**Headers:**

- **Authorization**: `Bearer {{YOUR_TOKEN_HERE}}`

**Request Body:**

```json
{
  "limits": {
    "reelsPerWeek": 5,
    "postsPerWeek": 5,
    "storiesPerWeek": 10,
    "carouselPerWeek": 5,
    "businessesManageable": 2
  }
}
```

### Delete Plan

**Method:** `DELETE`  
**URL:** `{{base_url}}/api/v1/plan/68c2147d0aa6fa53d76a263c`

**Headers:**

- **Authorization**: `Bearer {{YOUR_TOKEN_HERE}}`

**Request Body:**
_None_

## Subscription

### Get Subscriptions

**Method:** `GET`  
**URL:** `{{base_url}}/api/v1/subscription`

**Headers:**

- **Authorization**: `Bearer {{YOUR_TOKEN_HERE}}`

**Request Body:**
_None_

### Get My Plan

**Method:** `GET`  
**URL:** `{{base_url}}/api/v1/subscription/my-plan`

**Headers:**

- **Authorization**: `Bearer {{YOUR_TOKEN_HERE}}`

**Request Body:**
_None_

## social integration

### connect facebook

**Method:** `GET`  
**URL:** `{{base_url}}/api/v1/auth/facebook`

**Headers:**

- **Authorization**: `Bearer {{YOUR_TOKEN_HERE}}`

**Request Body:**
_None_

### connect instagram

**Method:** `GET`  
**URL:** `{{base_url}}/instagram/connect`

**Headers:**
_None_

**Request Body:**
_None_

### get all social integration

**Method:** `GET`  
**URL:** `{{base_url}}/api/v1/socialintegration`

**Headers:**

- **Authorization**: `Bearer {{YOUR_TOKEN_HERE}}`

**Request Body:**
_None_

## schedules

### get scheduled post

**Method:** `GET`  
**URL:** `{{base_url}}/api/v1/content/my-contents?status=scheduled`

**Headers:**

- **Authorization**: `Bearer {{YOUR_TOKEN_HERE}}`

**Request Body:**
_None_

## content template

### create contentTemplate

**Method:** `POST`  
**URL:** `{{base_url}}/api/v1/contentTemplate`

**Headers:**

- **Authorization**: `Bearer {{YOUR_TOKEN_HERE}}`

**Request Body:**

```json

{
    "title": "Summer Fashion Reel newest",
    "description": "A quick reel showcasing summer fashion styles.",
    "type": "reel",
    "category": "Fashion",
    "thumbnail": "https://example.com/image.jpg"steps": [
        {
            "title": "Opening shot",
            "description": "Wide shot of a model walking on the beach.",
            "mediaType": "video",
            "url": "https://example.com/image.jpg"shotType": "wide",
            "duration": 7
        },
        {
            "title": "Close-up of the outfit",
            "description": "Close-up shot highlighting the details of the outfit.",
            "mediaType": "image",
            "url": "https://example.com/image.jpg"shotType": "close-up",
            "duration": 5
        },
        {
            "title": "Mid-shot of model posing",
            "description": "Model posing with the outfit on the runway.",
            "mediaType": "video",
            "url": "https://example.com/image.jpg"shotType": "mid-shot",
            "duration": 8
        }
    ],
    "hashtags": [
        "#summerfashion",
        "#beachlook",
        "#ootd"
    ]
}
```

### get contentTemplate

**Method:** `GET`  
**URL:** `{{base_url}}/api/v1/contentTemplate?sortOrder=asc`

**Headers:**

- **Authorization**: `Bearer {{YOUR_TOKEN_HERE}}`

**Request Body:**
_None_

### get recent contentTemplate

**Method:** `GET`  
**URL:** `{{base_url}}/api/v1/contentTemplate/recent?limit=2&sortOrder=asc`

**Headers:**

- **Authorization**: `Bearer {{YOUR_TOKEN_HERE}}`

**Request Body:**
_None_

### get contentTemplate by id

**Method:** `GET`  
**URL:** `{{base_url}}/api/v1/contentTemplate/68e443ee9969a970d3adb775`

**Headers:**

- **Authorization**: `Bearer {{YOUR_TOKEN_HERE}}`

**Request Body:**
_None_

### toggle love

**Method:** `PATCH`  
**URL:** `{{base_url}}/api/v1/contentTemplate/{{templateId}}/love`

**Headers:**

- **Authorization**: `Bearer {{YOUR_TOKEN_HERE}}`

**Request Body:**
_None_

### delete contentTemplate by id

**Method:** `DELETE`  
**URL:** `{{base_url}}/api/v1/contentTemplate/68e443ee9969a970d3adb775`

**Headers:**

- **Authorization**: `Bearer {{YOUR_TOKEN_HERE}}`

**Request Body:**
_None_

## stats

### get user Stats

**Method:** `GET`  
**URL:** `{{base_url}}/api/v1/stats/`

**Headers:**

- **Authorization**: `Bearer {{YOUR_TOKEN_HERE}}`

**Request Body:**
_None_
