import {delegate,runMiddleware} from "./helperFunctions";
export default async function handler(req, res) {
	await runMiddleware(req,res);

	const newTx = req.body;
    const address = newTx.address;
    const delegatee = newTx.delegatee;
    const v = newTx.v;
    const r = newTx.r;
    const s = newTx.s;
    const nonce = newTx.nonce;
    const expiry = newTx.expiry;

    let val = await delegate(address,delegatee,nonce,expiry,v,r,s);
    res.end(JSON.stringify({result: val}));
}
