import bcrypt from 'bcryptjs';
import jwt from 'jsonwebtoken';

import User from '../../models/User';
import Place from '../../models/Place';
import Reservation from '../../models/Reservation';
import Review from '../../models/Review';

import keys from '../../config/keys';

export const getMe = async (req, res) => {
  try {
    const { id } = req.user;
    const user = await User.findById(id, { password: 0, __v: 0 });

    const places = await Place.find({ ownerID: id }, { __v: 0 });
    const reservations = await Reservation.find({ userID: id }, { __v: 0 });
    const reviews = await Review.find({ userID: id }, { __v: 0 });

    user.places = places;
    user.reservations = reservations;
    user.reviews = reviews;

    res.json(user);
  } catch (err) {
    console.log(err.message);
    res.status(500).json({ message: 'Something went wrong. Try again later.' });
  }
};

export const loginUser = async (req, res) => {
  const { email, password } = req.body;

  try {
    const user = await User.findOne({ email });

    if (!user) {
      res.status(401).json({ message: 'Invalid email or password.' });
      return;
    }

    const isCorrectPassword = await bcrypt.compare(password, user.password);

    if (!isCorrectPassword) {
      res.status(401).json({ message: 'Invalid email or password.' });
      return;
    }

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
    res.status(500).json({ message: 'Something went wrong. Try again later.' });
  }
};
