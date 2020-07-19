const express = require('express');
const { check, validationResult } = require('express-validator');

const authCheck = require('../middleware/authCheck');

const router = express.Router();

// @route   GET /api/reviews/:placeID
// @desc    Get reviews for a place
// @access  Public
router.get('/:placeID', async (req, res) => {
  const { placeID } = req.params;
  res.send(`GET reviews for place with id ${placeID}`);
});

// @route   POST /api/reviews/for/:placeID
// @desc    Post review for place
// @access  Private
router.post(
  '/for/:placeID',
  [
    authCheck,
    check('userName', 'Please provide a valid user name.')
      .optional()
      .isString(),
    check('stars', 'Please provide a valid rating.').isInt({ min: 1, max: 5 }),
    check('title', 'Please provide a title that is 32 characters or less.')
      .isString()
      .isLength({ min: 1, max: 32 }),
    check('body', 'Please provide a body that is 1000 characters or less.')
      .isString()
      .isLength({ min: 1, max: 1000 })
  ],
  async (req, res) => {
    const errors = validationResult(req);
    if (!errors.isEmpty()) {
      res.status(400).json({ errors: errors.array() });
      return;
    }

    const { placeID } = req.params;
    res.send(`POST review for place with id ${placeID}`);
  }
);

// @route   PUT /api/reviews/:id
// @desc    Edit review
// @access  Private
router.put('/:id', async (req, res) => {
  const { id } = req.params;
  res.send(`PUT Edit review with id ${id}`);
});

// @route   DELETE /api/reviews/:id
// @desc    Delete review
// @access  Private
router.delete('/:id', async (req, res) => {
  const { id } = req.params;
  res.send(`DELETE review with id ${id}`);
});

module.exports = router;
