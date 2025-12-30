import { MongoClient, Db } from 'mongodb';
import config from './config';

const uri = config.mongoUri;

if (!uri || !uri.startsWith('mongodb')) {
  throw new Error('MONGODB_URI is missing or invalid in config');
}

export const MONGO_DB_NAME = "games";

const options = {
  maxPoolSize: 10,
  serverSelectionTimeoutMS: 5000,
  heartbeatFrequencyMS: 10000,
};

let mongoClient: MongoClient | undefined = undefined;
let dbInstance: Db | undefined = undefined;

// Initialize the database client
export const initializeDatabaseClient = async (): Promise<MongoClient> => {
  const clientRef = new MongoClient(uri, options);
  await clientRef.connect();
  console.log(`MongoDB connected → database: ${MONGO_DB_NAME}`);
  return clientRef;
};

// Get MongoDB client and database with lazy initialization
export const getMongoClientDB = async () => {
  if (!mongoClient) {
    mongoClient = await initializeDatabaseClient();
  }

  const db = mongoClient.db(MONGO_DB_NAME);

  return { client: mongoClient, db };
};

// Async getDB that auto-initializes if not connected
export const getDB = async (): Promise<Db> => {
  if (!dbInstance) {
    try {
      if (!mongoClient) {
        mongoClient = await initializeDatabaseClient();
      }
      dbInstance = mongoClient.db(MONGO_DB_NAME);
    } catch (error: unknown) {
      const message = error instanceof Error ? error.message : 'Unknown error';
      console.error('MongoDB connection failed:', message);
      throw error;
    }
  }
  return dbInstance;
};

// Legacy connectDB for backward compatibility
export const connectDB = async (): Promise<Db> => {
  return await getDB();
};

export const closeDB = async () => {
  if (mongoClient) {
    await mongoClient.close();
    mongoClient = undefined;
    dbInstance = undefined;
    console.log('MongoDB connection closed');
  }
};

// Export a module-scoped MongoClient for advanced usage
export default mongoClient;
