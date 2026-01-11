import { v4 as uuidv4 } from 'uuid';

export const generateId = (prefix) => {
  return prefix ? `${prefix}-${uuidv4()}` : uuidv4();
};