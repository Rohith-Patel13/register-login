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
  const dbResponse = await dbConnectionObject.get(usernameQuery);
  console.log(dbResponse); //output:undefined

  if (dbResponse === undefined) {
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

//API 2:
app.post("/login", async (requestObject, responseObject) => {
  const requestBody = requestObject.body;
  //console.log(requestBody); //{ username: 'adam_richard', password: 'richard_567' }
  const { username, password } = requestBody;
  const usernameQuery = `SELECT * FROM user WHERE username='${username}';`;
  /*
  const dbResponse = await dbConnectionObject.run(usernameQuery);
  console.log(dbResponse); //output: { stmt: Statement { stmt: undefined }, lastID: 0, changes: 0 }
  console.log(dbResponse.username); //output: undefined
  
  The reason why the dbResponse object returned by dbConnectionObject.run()
  doesn't contain the user information directly is because the run() method
  is typically used for executing queries that do not directly return data from
  the database, such as INSERT, UPDATE, DELETE, or other non-SELECT queries.
  */
  const dbResponse = await dbConnectionObject.get(usernameQuery);
  console.log(dbResponse); //{username: 'adam_richard',name: 'Adam Richard',password: '$2b$10$ua5nQasozgZ2jYLtAQfRsusMvYdyuj/3lgM6yz9uCwZFVeN1Epfea', gender: 'male',location: 'Detroit'}
  //console.log(dbResponse.username); //adam_richard
  if (dbResponse !== undefined) {
    const isPasswordMatched = await bcrypt.compare(
      password,
      dbResponse.password
    );
    if (isPasswordMatched) {
      responseObject.status(200);
      responseObject.send("Login success!");
    } else {
      responseObject.status(400);
      responseObject.send("Invalid password");
    }
  } else if (dbResponse === undefined) {
    responseObject.status(400);
    responseObject.send("Invalid user");
  }
});

//API 3:
app.put("/change-password", async (requestObject, responseObject) => {
  const requestBody = requestObject.body;
  /*
  console.log(requestBody);
  {
    username: 'adam_richard',
    oldPassword: 'richard_567',
    newPassword: 'richard@123'
   }
  */
  const { username, oldPassword, newPassword } = requestBody;
  const usernameQuery = `SELECT * FROM user WHERE username='${username}';`;
  const dbResponse = await dbConnectionObject.get(usernameQuery);
  /*
  console.log(dbResponse);
  {
  username: 'adam_richard',
  name: 'Adam Richard',
  password: '$2b$10$73xBKcLNu8AxLiwtfSgo0eAMI9UA4/.UFO7r2pC5xDIIJHYCJ8xMq',
  gender: 'male',
  location: 'Detroit'
  }
  */
  if (dbResponse !== undefined) {
    const isPasswordMatched = await bcrypt.compare(
      oldPassword,
      dbResponse.password
    );
    //console.log(isPasswordMatched);
    if (isPasswordMatched) {
      if (newPassword.length < 5) {
        responseObject.status(400);
        responseObject.send("Password is too short");
      } else {
        const hashedNewPassword = await bcrypt.hash(newPassword, 10);
        const changePasswordQuery = `UPDATE user SET password='${hashedNewPassword}';`;
        await dbConnectionObject.run(changePasswordQuery);
        responseObject.status(200);
        responseObject.send("Password updated");
      }
    } else {
      responseObject.status(400);
      responseObject.send("Invalid current password");
    }
  } else if (dbResponse === undefined) {
    responseObject.status(400);
    responseObject.send("Invalid user");
  }
});
module.exports = app;
