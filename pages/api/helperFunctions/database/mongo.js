const {MongoClient} = require('mongodb');

let database = null;

async function startDatabase() {
  const mongoDBURL = process.env.MONGODB_URL;
  const connection = await MongoClient.connect(mongoDBURL, {useNewUrlParser: true, useUnifiedTopology:true});
  database = connection.db();
}

async function getDatabase() {
  if (!database) await startDatabase();
  return database;
}

module.exports = {
  getDatabase,
  startDatabase,
};