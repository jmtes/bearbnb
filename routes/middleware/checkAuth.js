import jwt from 'jsonwebtoken';

import keys from '../../config/keys';

export default (req, res, next) => {
  // Get token from header
  const token = req.header('Auth-Token');

  // Check if not token
  if (!token) {
    res.status(401).json({ message: 'Authorization denied.' });
    return;
  }

  try {
    const decoded = jwt.verify(token, keys.jwtSecret);

    req.user = decoded.user;
    next();
  } catch (err) {
    res.status(401).json({ message: 'Invalid token.' });
  }
};
