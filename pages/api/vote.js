import { vote } from "helpers"; // Vote helper

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
    // Send vote
    await vote(
      transaction.address,
      transaction.proposalId,
      transaction.support,
      vInput,
      transaction.r,
      transaction.s
    );
  } catch (error) {
    // If error, send code and message
    res.status(error.code).send({
      message: error.message,
    });
    return;
  }

  // Else, return success
  res.status(200).end();
};
