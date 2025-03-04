import { drizzle } from "drizzle-orm/pg";
import { Pool } from "pg";
import { sql } from "drizzle-orm";
import * as schema from "../schema";

const main = async () => {
  try {
    console.log("Starting database initialization for Docker environment...");
    
    if (!process.env.DATABASE_URL) {
      throw new Error("DATABASE_URL must be set");
    }
    
    // Create the pg client
    const pool = new Pool({
      connectionString: process.env.DATABASE_URL,
      ssl: false,
    });
    
    // Create the Drizzle client
    const db = drizzle(pool, { schema });
    
    console.log("Creating schemas...");
    
    // Create development and production schemas
    await pool.query(`
      CREATE SCHEMA IF NOT EXISTS development;
      CREATE SCHEMA IF NOT EXISTS production;
    `);
    
    console.log("Schemas created successfully");
    
    // Create tables in both schemas
    for (const schemaName of ['development', 'production']) {
      console.log(`Creating tables in ${schemaName} schema...`);
      
      // Set the search path to the current schema
      await pool.query(`SET search_path TO ${schemaName}`);
      
      // Create tables using schema definitions
      await pool.query(`
        CREATE TABLE IF NOT EXISTS activities (
          id SERIAL PRIMARY KEY,
          name TEXT NOT NULL,
          description TEXT,
          created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP
        );
        
        CREATE TABLE IF NOT EXISTS games (
          id SERIAL PRIMARY KEY,
          activity_id INTEGER REFERENCES activities(id),
          location TEXT NOT NULL,
          start_time TIMESTAMP WITH TIME ZONE NOT NULL,
          end_time TIMESTAMP WITH TIME ZONE NOT NULL,
          max_players INTEGER,
          created_by TEXT NOT NULL,
          created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP
        );
        
        CREATE TABLE IF NOT EXISTS players (
          id SERIAL PRIMARY KEY,
          game_id INTEGER REFERENCES games(id),
          user_id TEXT NOT NULL,
          status TEXT NOT NULL,
          created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP
        );
      `);
      
      console.log(`Tables created in ${schemaName} schema`);
    }
    
    console.log("Database initialization completed successfully");
    
    // Close the client connection
    await pool.end();
  } catch (error) {
    console.error("Database initialization error:", error);
    process.exit(1);
  }
};

main(); 