require('dotenv').config();
const {Client}=require('pg');

const connectionOptions={
    host: process.env.DB_HOST,
    user: process.env.DB_USER,
    password: process.env.DB_PASS,
    port: parseInt(process.env.DB_PORT ?? '5432', 10),
    database: process.env.DB_NAME,
};

async function setup(){
    const client=new Client({...connectionOptions, database:'postgres'});

    try{
        await client.connect();
        const res=await client.query("SELECT 1 FROM pg_database WHERE datname='movie_db'");

        if(res.rowCount===0){
            await client.query('CREATE DATABASE movie_db');
            console.log("Database 'movie_db' created successfully.");
        }else{
            console.log("Database 'movie_db' already exists.");
        }
    }catch(err){
        console.error("Error creating database:",err);
    }finally{
        await client.end();
    }
}

setup();