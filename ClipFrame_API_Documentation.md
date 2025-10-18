# ClipFrame API Documentation

This documentation is auto-generated from the Postman collection.

Base URL: `https://mohosin5001.binarybards.online`


## auth

### signup
**Method:** `POST`  
**URL:** `{{base_url}}/api/v1/auth/signup`

**Headers:**
_None_

**Request Body:**
```json
{
  "name": "temp",
  "email": "mohosinali075@gmail.com",
  "password": "12345678",
  "phone": "0198138135414",
  "role": "creator"
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
  "email": "web.mohosin@gmail.com",
  "oneTimeCode": "436879"
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
  "email": "web.mohosin@gmail.com"
}
```


### resend-otp
**Method:** `POST`  
**URL:** `{{base_url}}/api/v1/auth/resend-otp`

**Headers:**
- **Authorization**: `{{user}}`

**Request Body:**
_None_


### reset password
**Method:** `POST`  
**URL:** `{{base_url}}/api/v1/auth/reset-password`

**Headers:**
- **Authorization**: `4b99d9facb01daabf9c5276375a3d8fe38b1dd5685f2745a9b55cd8aac54fcf1`

**Request Body:**
```json
{
  "newPassword": "123456789",
  "confirmPassword": "123456789"
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
  "password": "12345678"
}
```


### change password
**Method:** `POST`  
**URL:** `{{base_url}}/api/v1/auth/change-password`

**Headers:**
- **Authorization**: `{{admin}}`

**Request Body:**
```json
{
  "currentPassword": "123456789",
  "newPassword": "12345678",
  "confirmPassword": "12345678"
}
```


### refresh-token
**Method:** `POST`  
**URL:** `{{base_url}}/api/v1/auth/refresh-token`

**Headers:**
- **Authorization**: `{{admin}}`

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
    //  "phone" : "+8801981381354",
    "email" : "web.mohosin@gmail.com",
    "password" : "12345678",
    "rememberMe" : true
}
```


### google  login
**Method:** `GET`  
**URL:** `{{base_url}}/api/v1/auth/google`

**Headers:**
- **Authorization**: `{{user}}`

**Request Body:**
```json
{
  "currentPassword": "12345670",
  "newPassword": "12345678",
  "confirmPassword": "12345678"
}
```


### social login
**Method:** `POST`  
**URL:** `{{base_url}}/api/v1/auth/social-login`

**Headers:**
- **Authorization**: `{{admin}}`

**Request Body:**
```json
{
  "appId": "1320349029797432",
  "deviceToken": "dk"
}
```


### logout
**Method:** `POST`  
**URL:** `{{base_url}}/api/v1/auth/logout`

**Headers:**
- **Authorization**: `{{user}}`

**Request Body:**
```json
{
  "password": "12345678"
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
- **Authorization**: `{{admin}}`

**Request Body:**
_None_


### get user by id
**Method:** `GET`  
**URL:** `{{base_url}}/api/v1/user/68b9eae85bf3094e97acd28b`

**Headers:**
- **Authorization**: `{{admin}}`

**Request Body:**
```json
{
  "name": "Md Mohosin Ali"
}
```


### get user profile
**Method:** `GET`  
**URL:** `{{base_url}}/api/v1/user/profile`

**Headers:**
- **Authorization**: `{{admin}}`

**Request Body:**
_None_

**Example Response:**
```json
{
  "statusCode": 200,
  "success": true,
  "message": "User profile retrieved successfully",
  "data": {
    "_id": "68b1fd9e3a485a0f4fc4b527",
    "name": "Md Mohosin",
    "email": "web.mohosin@gmail.com",
    "status": "active",
    "verified": true,
    "role": "admin",
    "createdAt": "2025-08-29T19:21:02.213Z",
    "updatedAt": "2025-09-03T18:39:22.982Z",
    "id": "68b1fd9e3a485a0f4fc4b527",
    "platforms": [
      "facebook",
      "instagram",
      "instagram"
    ],
    "preferredLanguages": [
      "en",
      "bn"
    ]
  }
}
```


### delete my profile
**Method:** `DELETE`  
**URL:** `{{base_url}}/api/v1/user/profile`

**Headers:**
- **Authorization**: `{{admin}}`

**Request Body:**
```json
{
  "password": "12345678"
}
```


### delete user by id
**Method:** `DELETE`  
**URL:** `{{base_url}}/api/v1/user/68b9eae85bf3094e97acd28b`

**Headers:**
- **Authorization**: `{{admin}}`

**Request Body:**
```json
{
  "name": "Md Mohosin Ali"
}
```


### update user status by id
**Method:** `PATCH`  
**URL:** `{{base_url}}/api/v1/user/6897a6ca11b2927166ac5c7a`

**Headers:**
- **Authorization**: `{{admin}}`

**Request Body:**
```json
{
  "status": "inactive"
}
```


## public

### faq

#### create faq
**Method:** `POST`  
**URL:** `{{base_url}}/v1/public/faq`

**Headers:**
- **Authorization**: `{{admin}}`

**Request Body:**
```json
{
  "question": "How do I reset my password?",
  "answer": "Click on 'Forgot Password' at the login page and follow the instructions."
}
```


#### update faq
**Method:** `PATCH`  
**URL:** `{{base_url}}/api/v1/public/faq/6897bf3b1fd6441a9eee6d25`

**Headers:**
- **Authorization**: `{{admin}}`

**Request Body:**
```json
{
  "question": "How do I reset my password? update ",
  "answer": "Click on 'Forgot Password' at the login page and follow the instructions."
}
```


#### get faq by id
**Method:** `GET`  
**URL:** `{{base_url}}/api/v1/public/faq/single/6897bf3b1fd6441a9eee6d25`

**Headers:**
- **Authorization**: `{{admin}}`

**Request Body:**
```json
{
  "question": "How do I reset my password?",
  "answer": "Click on 'Forgot Password' at the login page and follow the instructions."
}
```


#### get all faq
**Method:** `GET`  
**URL:** `{{base_url}}/api/v1/public/faq/all`

**Headers:**
- **Authorization**: `{{admin}}`

**Request Body:**
```json
{
  "question": "How do I reset my password?",
  "answer": "Click on 'Forgot Password' at the login page and follow the instructions."
}
```


#### delete faq
**Method:** `DELETE`  
**URL:** `{{base_url}}/api/v1/public/faq/6897bf3b1fd6441a9eee6d25`

**Headers:**
- **Authorization**: `{{admin}}`

**Request Body:**
```json
{
  "question": "How do I reset my password?",
  "answer": "Click on 'Forgot Password' at the login page and follow the instructions."
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
  "name": "Appon Ahmed",
  "email": "apponislamdev@gmail.com",
  "phone": "+880123456789",
  "country": "Bangladesh",
  "message": "Hey, I\u2019m interested in learning more about your backend services!"
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
  "content": "It is a long established fact that a reader will be distracted by the readable content of a page when looking at its layout. The point of using Lorem Ipsum is that it has a more-or-less normal distribution of letters, as opposed to using 'Content here, content here', making it look like readable English. Many desktop publishing packages and web page editors now use Lorem Ipsum as their default model text, and a search for 'lorem ipsum' will uncover many web sites still in their infancy. Various versions have evolved over the years, sometimes by accident, sometimes on purpose (injected humour and the like",
  "type": "terms-and-condition"
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
  "content": "It is a long established fact that a reader will be distracted by the readable content of a page when looking at its layout. The point of using Lorem Ipsum is that it has a more-or-less normal distribution of letters, as opposed to using 'Content here, content here', making it look like readable English. Many desktop publishing packages and web page editors now use Lorem Ipsum as their default model text, and a search for 'lorem ipsum' will uncover many web sites still in their infancy. Various versions have evolved over the years, sometimes by accident, sometimes on purpose (injected humour and the like",
  "type": "privacy-policy"
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
  "content": "updated dsfsd",
  "type": "privacy-sdf"
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
  "content": "It is a long established fact that a reader will be distracted by the readable content of a page when looking at its layout. The point of using Lorem Ipsum is that it has a more-or-less normal distribution of letters, as opposed to using 'Content here, content here', making it look like readable English. Many desktop publishing packages and web page editors now use Lorem Ipsum as their default model text, and a search for 'lorem ipsum' will uncover many web sites still in their infancy. Various versions have evolved over the years, sometimes by accident, sometimes on purpose (injected humour and the like",
  "type": "about"
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
- **Authorization**: `{{admin}}`

**Request Body:**
```json
{
    //   "businessType": "General"
    // "businessDescription": "A local yoga studio offering group classes and workshops 12klj",
    //   "targetAudience": ["local"]
    //   "preferredLanguages": "en"
    //   "autoTranslateCaptions": false
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
- **Authorization**: `{{admin}}`

**Request Body:**
_None_


### useronboarding branding
**Method:** `POST`  
**URL:** `{{base_url}}/api/v1/useronboarding/branding`

**Headers:**
- **Authorization**: `{{admin}}`

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
- **Authorization**: `{{admin}}`

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
- **Authorization**: `{{admin}}`

**Request Body:**
_None_


### get content
**Method:** `GET`  
**URL:** `{{base_url}}/api/v1/content`

**Headers:**
- **Authorization**: `{{admin}}`

**Request Body:**
_None_


### get single content
**Method:** `GET`  
**URL:** `{{base_url}}/api/v1/content/68e16a7a0f7b263af2608acb`

**Headers:**
- **Authorization**: `{{admin}}`

**Request Body:**
_None_


### update content
**Method:** `PATCH`  
**URL:** `{{base_url}}/api/v1/content/68e16a7a0f7b263af2608acb`

**Headers:**
- **Authorization**: `{{admin}}`

**Request Body:**
```json
{
  "caption": "updadted",
  "description": "Check out my awesome reel! updadated",
  "scheduledAt": {
    "type": "single",
    "date": "2025-09-01",
    "time": "10:00"
  }
}
```


### delete content
**Method:** `DELETE`  
**URL:** `{{base_url}}/api/v1/content/68e16a7a0f7b263af2608acb`

**Headers:**
- **Authorization**: `{{admin}}`

**Request Body:**
_None_


### my-contents
**Method:** `GET`  
**URL:** `{{base_url}}/api/v1/content/my-contents`

**Headers:**
- **Authorization**: `{{admin}}`

**Request Body:**
_None_


## Plan

### Create Plan
**Method:** `POST`  
**URL:** `{{base_url}}/api/v1/plan`

**Headers:**
- **Authorization**: `{{admin}}`

**Request Body:**
```json
{
  "title": "Free Plan",
  "description": "Full feature access with priority support.",
  "price": 0,
  "duration": "1 month",
  "paymentType": "Monthly",
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
- **Authorization**: `{{user}}`

**Request Body:**
_None_


### Update Plan
**Method:** `PATCH`  
**URL:** `{{base_url}}/api/v1/plan/68c2147d0aa6fa53d76a263c`

**Headers:**
- **Authorization**: `{{admin}}`

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
- **Authorization**: `{{admin}}`

**Request Body:**
_None_


## Subscription

### Get Subscriptions
**Method:** `GET`  
**URL:** `{{base_url}}/api/v1/subscription`

**Headers:**
- **Authorization**: `{{admin}}`

**Request Body:**
_None_


### Get My Plan
**Method:** `GET`  
**URL:** `{{base_url}}/api/v1/subscription/my-plan`

**Headers:**
- **Authorization**: `{{admin}}`

**Request Body:**
_None_


## social integration

### connect facebook
**Method:** `GET`  
**URL:** `{{base_url}}/api/v1/auth/facebook`

**Headers:**
- **Authorization**: `{{user}}`

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
- **Authorization**: `{{admin}}`

**Request Body:**
_None_


## schedules

### get scheduled post
**Method:** `GET`  
**URL:** `{{base_url}}/api/v1/content/my-contents?status=scheduled`

**Headers:**
- **Authorization**: `{{admin}}`

**Request Body:**
_None_


## content template

### create contentTemplate
**Method:** `POST`  
**URL:** `{{base_url}}/api/v1/contentTemplate`

**Headers:**
- **Authorization**: `{{admin}}`

**Request Body:**
```json
// it's just template // after complte dashboard i make properly
{
    "title": "Summer Fashion Reel newest",
    "description": "A quick reel showcasing summer fashion styles.",
    "type": "reel",
    "category": "Fashion",
    "thumbnail": "https://example.com/thumbnail.jpg",
    "steps": [
        {
            "title": "Opening shot",
            "description": "Wide shot of a model walking on the beach.",
            "mediaType": "video",
            "url": "https://clipframe.s3.ap-southeast-1.amazonaws.com/image/1759605849661.png",
            "shotType": "wide",
            "duration": 7
        },
        {
            "title": "Close-up of the outfit",
            "description": "Close-up shot highlighting the details of the outfit.",
            "mediaType": "image",
            "url": "https://clipframe.s3.ap-southeast-1.amazonaws.com/image/1759605849661.png",
            "shotType": "close-up",
            "duration": 5
        },
        {
            "title": "Mid-shot of model posing",
            "description": "Model posing with the outfit on the runway.",
            "mediaType": "video",
            "url": "https://clipframe.s3.ap-southeast-1.amazonaws.com/image/1759605849661.png",
            "shotType": "mid-shot",
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
- **Authorization**: `{{admin}}`

**Request Body:**
_None_


### get recent contentTemplate
**Method:** `GET`  
**URL:** `{{base_url}}/api/v1/contentTemplate/recent?limit=2&sortOrder=asc`

**Headers:**
- **Authorization**: `{{admin}}`

**Request Body:**
_None_


### get contentTemplate by id
**Method:** `GET`  
**URL:** `{{base_url}}/api/v1/contentTemplate/68e443ee9969a970d3adb775`

**Headers:**
- **Authorization**: `{{admin}}`

**Request Body:**
_None_


### toggle love
**Method:** `PATCH`  
**URL:** `{{base_url}}/api/v1/contentTemplate/{{templateId}}/love`

**Headers:**
- **Authorization**: `{{user}}`

**Request Body:**
_None_


### delete contentTemplate by id
**Method:** `DELETE`  
**URL:** `{{base_url}}/api/v1/contentTemplate/68e443ee9969a970d3adb775`

**Headers:**
- **Authorization**: `{{admin}}`

**Request Body:**
_None_


## stats

### get user Stats
**Method:** `GET`  
**URL:** `{{base_url}}/api/v1/stats/`

**Headers:**
- **Authorization**: `{{admin}}`

**Request Body:**
_None_

