const express = require("express");
const path = require("path");
const { open } = require("sqlite");
const sqlite3 = require("sqlite3");
const bcrypt = require("bcrypt");
const app = express();
app.use(express.json());
const dbPath = path.join(__dirname, "userData.db");

let dbConnectionObject = null;

const initializeDBAndServer = async () => {
  try {
    dbConnectionObject = await open({
      filename: dbPath,
      driver: sqlite3.Database,
    });
    app.listen(3001, () => {
      console.log("Server Running at http://localhost:3001/");
    });
  } catch (e) {
    console.log(`DB Error: ${e.message}`);
    process.exit(1);
  }
};
initializeDBAndServer();

//API 1:
app.post("/register", async (requestObject, responseObject) => {
  const requestBody = requestObject.body;
  /*
  console.log(requestBody);
  {
  username: 'adam_richard',
  name: 'Adam Richard',
  password: 'richard_567',
  gender: 'male',
  location: 'Detroit'
  }
  */
  const { username, name, password, gender, location } = requestBody;
  const usernameQuery = `SELECT * FROM user WHERE username='${username}';`;
  const dbResponse = await dbConnectionObject.run(usernameQuery);
  //console.log(dbResponse); //{ stmt: Statement { stmt: undefined }, lastID: 0, changes: 0 }
  //console.log(dbResponse.username); //undefined
  if (dbResponse.username === undefined) {
    if (password.length < 5) {
      responseObject.status("400");
      responseObject.send("Password is too short");
    } else {
      const hashedPassword = await bcrypt.hash(password, 10);
      const newRegisterQuery = `
        INSERT INTO user(username,name,password,gender,location)
        VALUES ('${username}','${name}','${hashedPassword}','${gender}','${location}');
        `;
      await dbConnectionObject.run(newRegisterQuery);
      responseObject.status(200);
      responseObject.send("User created successfully");
    }
  } else {
    responseObject.status(400);
    responseObject.send("User already exists");
  }
});
