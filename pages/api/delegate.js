import { delegate } from "helpers"; // delegate helper

export default async (req, res) => {
  const transaction = req.body; // Collect transaction object

  try {
    // Send delegation
    await delegate(
      transaction.address,
      transaction.delegatee,
      transaction.nonce,
      transaction.expiry,
      transaction.v,
      transaction.r,
      transaction.s
    );
  } catch (error) {
    // If error, return status and message
    res.status(error.code).send({
      message: error.message,
    });
    return;
  }

  // Else, send success status
  res.status(200).end();
};
