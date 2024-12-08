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
  port: 5432
});

db.connect();

app.use(bodyParser.urlencoded({ extended: true }));
app.use(express.static("public"));

async function checkVisitedCountryList(){
  const result = await db.query("select country_code from visited_countries");

  let countries = [];
  result.rows.forEach((country) => {
    countries.push(country.country_code);
  });
  return countries;
}

async function checkVisitedCountry(countryCode){
  const result = await db.query("select country_code from visited_countries where country_code = $1", [ countryCode ]);
  return result.rows.length ? true : false;
}

app.get("/", async (req, res) => {
  const countries = await checkVisitedCountryList();

  res.render("index.ejs", { countries, total: countries.length })
});

app.post("/add", async (req, res) => {
  const input = req.body["country"];

  const result = await db.query("select country_code from countries where country_name = $1", [ input ]);
  
  if (result.rows.length !== 0) {
    const data = result.rows[0];
    const countryCode = data.country_code;
    const isVisited = await checkVisitedCountry(countryCode);
    
    if (!isVisited) {
      await db.query("insert into visited_countries (country_code) values ($1)", [ countryCode ]);
    }
  }
  res.redirect("/");
});

app.listen(port, () => {
  console.log(`Server running on http://localhost:${port}`);
});
