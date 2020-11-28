import { canDelegate } from "helpers"; // canDelegate helper

export default async (req, res) => {
  const { address } = req.query; // Collect address from request

  try {
    // Check if address can delegate
    await canDelegate(address);
  } catch (error) {
    // If error, return response
    res.status(error.code).send({
      message: error.message,
    });
    return;
  }

  // Else return success
  res.status(200);
};
