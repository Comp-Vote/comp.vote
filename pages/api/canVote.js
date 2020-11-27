import {canVote,runMiddleware} from "./helperFunctions";
export default async function handler(req, res) {
	await runMiddleware(req,res);

	const val = await canVote(req.query.address,req.query.proposalId);
	res.end(JSON.stringify({ result: val}));
}