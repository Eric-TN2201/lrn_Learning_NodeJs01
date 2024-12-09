import express from "express";
import bodyParser from "body-parser";
import pg from "pg";

const app = express();
const port = 3000;

const db = new pg.Client({
  user: "postgres",
  host: "localhost",
  database: "world",
  password: "123456",
  port: 5432,
});
db.connect();

app.use(bodyParser.urlencoded({ extended: true }));
app.use(express.static("public"));

let currentUserId = 1;
let users = [];
let countries = [];
let user;

async function getUsers(){
  const result = await db.query("select * from users");
  let users = [];
  result.rows.forEach(user =>{
    users.push(user);
  });
  return users;
}

async function getUser(userId){
  user = await db.query("select * from users where id = $1", [ userId ]);
  return user.rows[0];
}

async function checkVisisted(currentUserId = 1) {
  const result = await db.query("SELECT country_code FROM visited_countries where user_id = $1", [currentUserId]);
  countries = [];
  result.rows.forEach((country) => {
    countries.push(country.country_code);
  });
  return countries;
}

app.get("/", async (req, res) => {
  users = await getUsers();
  countries = await checkVisisted(currentUserId);
  user = await getUser(currentUserId);
  
  res.render("index.ejs", {
    countries: countries,
    total: countries.length,
    users: users,
    color: user.color,
  });
});

app.post("/add", async (req, res) => {
  const input = req.body["country"];
  try { // check country exist
    const result = await db.query(
      "SELECT country_code FROM countries WHERE LOWER(country_name) = $1",
      [input.toLowerCase()]
    );

    const data = result.rows[0];
    const countryCode = data.country_code;
    let isVisited = countries.find(country => country == countryCode) ? true : false;
    if (isVisited) {
      res.render("index.ejs", {
        countries: countries,
        total: countries.length,
        users: users,
        color: user.color,
        error: "Country is visited!!!"
      });
    }

    try {
      await db.query(
        "INSERT INTO visited_countries (country_code, user_id) VALUES ($1, $2)",
        [countryCode, currentUserId]
      );
      res.redirect("/");
    } catch (err) {
      console.log(err);

      res.render("index.ejs", {
        countries: countries,
        total: countries.length,
        users: users,
        color: user.color,
        error: "Country is visited!!!"
      });
    }
  } catch (err) {
    console.log(err);

    res.render("index.ejs", {
      countries: countries,
      total: countries.length,
      users: users,
      color: user.color,
      error: "Country is not exist, please try again!!!"
    });
  }
});

app.post("/user", async (req, res) => {
  currentUserId = parseInt(req.body["user"]);
  countries = await checkVisisted(currentUserId);
  user = await getUser(currentUserId);
  
  res.render("index.ejs", {
    countries: countries,
    total: countries.length,
    users: users,
    color: user.color,
  });
});

app.post("/new", async (req, res) => {

  
  //Hint: The RETURNING keyword can return the data that was inserted.
  //https://www.postgresql.org/docs/current/dml-returning.html
});

app.listen(port, () => {
  console.log(`Server running on http://localhost:${port}`);
});
