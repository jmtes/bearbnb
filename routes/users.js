const express = require('express');
const bcrypt = require('bcryptjs');
const jwt = require('jsonwebtoken');
const { body, param, validationResult } = require('express-validator');

const User = require('../models/User');
const Place = require('../models/Place');
const Reservation = require('../models/Reservation');

const keys = require('../config/keys');
const authCheck = require('../middleware/authCheck');

const router = express.Router();

// @route   GET /api/users/:id
// @desc    Get user info
// @access  Public
router.get(
  '/:id',
  param('id', 'Please provide a valid user ID.').isMongoId(),
  async (req, res) => {
    const errors = validationResult(req);
    if (!errors.isEmpty()) {
      res.status(400).json({ errors: errors.array() });
      return;
    }

    const { id } = req.params;

    try {
      const user = await User.findById(id, {
        name: 1,
        avatar: 1,
        places: 1
      });

      if (!user) {
        res.status(404).json({ message: 'User not found.' });
      } else {
        const places = await Place.find({ ownerID: id });
        user.places = places;

        res.json(user);
      }
    } catch (err) {
      console.log(err.message);
      res
        .status(500)
        .json({ message: 'Something went wrong. Try again later.' });
    }
  }
);

// @route   POST /api/users
// @desc    Register new user
// @access  Public
router.post(
  '/',
  [
    body('name', 'Please provide a name.')
      .isString()
      .isLength({ min: 1, max: 32 }),
    body('email', 'Please provide a valid email.').isEmail(),
    body('password', 'Please enter a password with 8 or more characters.')
      .isString()
      .isLength({ min: 8 })
  ],
  async (req, res) => {
    const errors = validationResult(req);
    if (!errors.isEmpty()) {
      res.status(400).json({ errors: errors.array() });
      return;
    }

    const { name, email, password } = req.body;

    let user;

    try {
      user = await User.findOne({ email });

      if (user) {
        res
          .status(409)
          .json({ message: 'An account with that email already exists.' });
        return;
      }

      user = new User({
        name,
        email
      });

      const salt = await bcrypt.genSalt();
      user.password = await bcrypt.hash(password, salt);

      await user.save();

      const payload = {
        user: {
          id: user.id
        }
      };

      jwt.sign(payload, keys.jwtSecret, { expiresIn: 2400 }, (err, token) => {
        if (err) throw err;
        res.json({ token });
      });
    } catch (err) {
      console.log(err.message);
      res
        .status(500)
        .json({ message: 'Something went wrong. Try again later.' });
    }
  }
);

// @route   PUT /api/users
// @desc    Edit user info
// @access  Private
router.put(
  '/',
  [
    authCheck,
    body('name', 'Please provide a name that is 32 characters or less.')
      .optional()
      .isString()
      .isLength({ min: 1, max: 32 }),
    body('bio', 'Please provide a bio that is 200 characters or less.')
      .optional()
      .isString()
      .isLength({ max: 200 }),
    body('avatar', 'Please provide a valid image URL.').optional().isURL(),
    body('email', 'Please provide a valid email.').optional().isEmail(),
    body('newPassword', 'Please enter a password with 8 or more characters.')
      .optional()
      .isLength({ min: 8 }),
    body('_id', 'Cannot change the ID of a user.').not().exists(),
    body('places', 'Cannot modify user listings.').not().exists(),
    body('reservations', 'Cannot modify user reservations.').not().exists(),
    body('reviews', 'Cannot modify user reviews.').not().exists()
  ],
  async (req, res) => {
    const errors = validationResult(req);
    if (!errors.isEmpty()) {
      res.status(400).json({ errors: errors.array() });
      return;
    }

    const { id } = req.user;

    try {
      let user = await User.findById(id);

      if (req.body.newPassword) {
        if (!req.body.oldPassword) {
          res.status(401).json({ message: 'Please enter your old password.' });
          return;
        }

        const isCorrectPassword = await bcrypt.compare(
          req.body.oldPassword,
          user.password
        );

        if (!isCorrectPassword) {
          res.status(401).json({ message: 'Invalid password.' });
          return;
        }

        const salt = await bcrypt.genSalt();
        const newPassword = await bcrypt.hash(req.body.newPassword, salt);

        req.body.password = newPassword;
        delete req.body.newPassword;
        delete req.body.oldPassword;
      }

      if (req.body.email) {
        if (!req.body.password) {
          res.status(401).json({ message: 'Please enter your password.' });
          return;
        }

        const isCorrectPassword = await bcrypt.compare(
          req.body.password,
          user.password
        );

        if (!isCorrectPassword) {
          res.status(401).json({ message: 'Invalid password.' });
          return;
        }

        delete req.body.password;
      }

      user = await User.findByIdAndUpdate(
        id,
        { $set: req.body },
        { new: true, fields: { password: 0, __v: 0 } }
      );

      res.json(user);
    } catch (err) {
      console.log(err.message);
      res
        .status(500)
        .json({ message: 'Something went wrong. Try again later.' });
    }
  }
);

// @route   POST /api/users/deactivate
// @desc    Delete user account
// @access  Private
router.post('/deactivate', authCheck, async (req, res) => {
  const { id } = req.user;

  if (!req.body.password) {
    res.status(401).json({ message: 'Password required for deactivation.' });
    return;
  }

  try {
    let user = await User.findById(id);

    if (!user) {
      res.status(404).json({ message: 'User not found.' });
      return;
    }

    const isCorrectPassword = await bcrypt.compare(
      req.body.password,
      user.password
    );

    if (!isCorrectPassword) {
      res.status(401).json({ message: 'Invalid password.' });
      return;
    }

    user = await User.findByIdAndRemove(id);

    await Place.deleteMany({ ownerID: id });
    await Reservation.deleteMany({ userID: id });
    await Reservation.deleteMany({ ownerID: id });

    res.json({ message: 'Successfully deactivated account. Bye!' });
  } catch (err) {
    console.log(err.message);
    res.status(500).json({ message: 'Something went wrong. Try again later.' });
  }
});

module.exports = router;
