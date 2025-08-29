import express from 'express';
import { ReviewController } from './review.controller';
import auth from '../../middleware/auth';
import { USER_ROLES } from '../../../enum/user';
import validateRequest from '../../middleware/validateRequest';
import { createReviewSchema, updateReviewSchema } from './review.validation';

const router = express.Router();

const roles = [USER_ROLES.STUDENT, USER_ROLES.GUEST, USER_ROLES.ADMIN, USER_ROLES.TEACHER];

// Route for creating reviews & getting all reviews by type (assuming type is query param, 
// but here it's a param so keeping separate routes)
router.route('/')
  .get(auth(...roles), ReviewController.getAllReviews)
  .post(auth(...roles), validateRequest(createReviewSchema), ReviewController.createReview);

// router.route('/:type')
//   .get(auth(...roles), ReviewController.getAllReviews);

router.route('/:id')
  .get(auth(...roles), ReviewController.getSingleReview)
  .patch(auth(...roles), validateRequest(updateReviewSchema), ReviewController.updateReview)
  .delete(auth(...roles), ReviewController.deleteReview);

export const ReviewRoutes = router;
