import jwt from 'jsonwebtoken';

const generateToken = (id, email, role) => {
  return jwt.sign({ id, email, role }, process.env.JWT_SECRET || 'secret', {
    expiresIn: '7d',
  });
};
export default generateToken;
