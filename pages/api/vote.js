const {vote} = require('./helperFunctions');
export default async function handler(req, res) {

    const newTx = req.body;
    const proposalId = newTx.proposalId;
    const support = newTx.support;
    const address = newTx.address;
    const v = newTx.v;
    const r = newTx.r;
    const s = newTx.s;
    
   let val = await vote(address,proposalId,support,v,r,s);
   res.end(JSON.stringify({result: val}));
}



    
