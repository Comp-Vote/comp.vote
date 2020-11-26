const {canDelegate} = require('./helperFunctions');
export default async function handler(req, res) {
  const val = await canDelegate(req.query.address);
  res.end(JSON.stringify({ result: val}));
}