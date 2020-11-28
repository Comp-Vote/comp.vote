import { MongoClient } from "mongodb"; // MongoClient setup
const { MONGODB_URL, MONGODB_DB } = process.env; // MongoDB URL and table name

// Cached connection handler
let cached = global.mongo;
if (!cached) cached = global.mongo = {};

/**
 * Return mongoDB connection (cached || fresh)
 */
export async function connectToDatabase() {
  // If cached connection exists on global, return
  if (cached.conn) return cached.conn;

  // Else generate connection and return
  if (!cached.promise) {
    const conn = {}; // Connection
    const options = {
      useNewUrlParser: true,
      useUnifiedTopology: true,
    }; // MongoDB options

    // Generate new connection
    cached.promise = MongoClient.connect(MONGODB_URL, options)
      // On successful connection
      .then((client) => {
        // Setup global client
        conn.client = client;
        // Return client
        return client.db().collection(MONGODB_DB);
      })
      // Follow-up for DB caching
      .then((db) => {
        // Cache db and connection
        conn.db = db;
        cached.conn = conn;
      });
  }

  // Run cached promise and return connection
  await cached.promise;
  return cached.conn;
}
