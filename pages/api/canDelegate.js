import {canDelegate,runMiddleware} from "./helperFunctions";
export default async function handler(req, res) {
	await runMiddleware(req,res);
	
	const val = await canDelegate(req.query.address);
	res.end(JSON.stringify({ result: val}));
}