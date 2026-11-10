const HttpError = require('./httpError');
const { StockError } = require('../services/stock.service');

module.exports = function handleError(res, error, label) {
  if (error instanceof HttpError || error instanceof StockError) {
    return res.status(error.status).json({ success: false, message: error.message });
  }
  if (error.name === 'ValidationError') return res.status(400).json({ success: false, message: error.message });
  if (error.name === 'CastError') return res.status(400).json({ success: false, message: 'Invalid id supplied.' });
  console.error(`${label} failed:`, error);
  return res.status(500).json({ success: false, message: 'Something went wrong.' });
};