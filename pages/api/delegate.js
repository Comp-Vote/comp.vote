const {delegate} = require('./helperFunctions');
export default async function handler(req, res) {
	const newTx = req.body;
    const address = newTx.address;
    const delegatee = newTx.delegatee;
    const v = newTx.v;
    const r = newTx.r;
    const s = newTx.s;

    let val = await delegate(address,delegatee,v,r,s);
    res.end(JSON.stringify({result: val}));
}
