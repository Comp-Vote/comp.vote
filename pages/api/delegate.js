import { delegate } from "helpers"; // delegate helper

export default async (req, res) => {
  const transaction = req.body; // Collect transaction object

  let vInput;
  // Some providers format EIP-712 sig differently
  switch (transaction.v) {
    case "0x00":
      vInput = "0x1b";
      break;
    case "0x01":
      vInput = "0x1c";
      break;
    default:
      vInput = transaction.v;
  }

  try {
    // Send delegation
    await delegate(
      transaction.address,
      transaction.delegatee,
      transaction.nonce,
      transaction.expiry,
      vInput,
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
