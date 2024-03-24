import axios from "axios";

export default async (req, res) => {
  // pagination logic
  let { page_number = 1, page_size = 10 } = req.query;
  page_number = Number(page_number);
  page_size = Number(page_size);
  const offset = (page_number - 1) * page_size;
  const total_pages = Math.ceil(2000 / page_size);
  let pagination_summary = { total_pages, page_size, page_number };
  if (
    pagination_summary.page_number < 1 ||
    pagination_summary.page_number > pagination_summary.total_pages
  ) {
    res.status(400).send("Invalid page number");
    return;
  }

  // Fetch top delegates from the graph
  const graphRes = await axios.post(
    "https://api.thegraph.com/subgraphs/name/arr00/compound-governance-2",
    {
      query:
        `{
					delegates(first:` +
        page_size +
        `, orderBy:delegatedVotes, orderDirection:desc, skip:` +
        offset +
        `) {
						id
						delegatedVotes
					}
				}`,
    }
  );

  // Fetch delegate names from Tally
  const tallyRes = await axios.post(
    "https://api.tally.xyz/query",
    {
      query: `query Accounts(
      $ids: [AccountID!],
      $addresses: [Address!]
    ) {
      accounts(
        ids: $ids,
        addresses: $addresses
      ) {
        id
        address
        ens
        twitter
        name
        picture
      }
    }`,
      variables: {
        ids: graphRes.data.data.delegates.map((x) => "eip155:1:" + x.id),
      },
    },
    {
      headers: {
        "Api-Key": process.env.TALLY_API_KEY,
      },
    }
  );

  const theGraphAccounts = graphRes.data.data.delegates;
  const tallyAccounts = tallyRes.data.data.accounts;

  let accounts = [];

  for (const x in theGraphAccounts) {
    const graphAccount = theGraphAccounts[x];
    const tallyAccount = tallyAccounts[x];

    let a = {};
    a.address = graphAccount.id;
    a.votes = graphAccount.delegatedVotes;
    a.image_url = tallyAccount.picture || "";
    a.display_name = tallyAccount.name || tallyAccount.ens || tallyAccount.twitter;
    a.twitter = tallyAccount.twitter || "";
    a.rank = Number(x) + offset + 1;

    accounts[x] = a;
  }

  let resData = { accounts, pagination_summary };
  res.json(resData);
};