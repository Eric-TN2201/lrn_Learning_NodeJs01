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
  // console.log("coun", countries);
  
  res.render("index.ejs", { countries, total: countries.length })
});

app.post("/add", async (req, res) => {
  const input = req.body["country"];
  console.log("in",input);
  
  try {   // check exist
    const result = await db.query("select country_code from countries where country_name = $1", [ input ]);
    const data = result.rows[0];
    const countryCode = data.country_code;
    
    try {   // check visited 
      await db.query("insert into visited_countries (country_code) values ($1)", [ countryCode ]);
    } catch (error) {   // if country is visited
      const countries = await checkVisitedCountryList();
      
      return res.render("index.ejs", {
        countries: countries,
        total: countries.length,
        error: "country is visited"
      });
    }
  } catch (error) {  // if country is not exist
    console.error("err", error);
    
      const countries = await checkVisitedCountryList();
      
      return res.render("index.ejs", {
        countries: countries,
        total: countries.length,
        error: "country is not exist"
      });
  }
  res.redirect("/");
});

app.listen(port, () => {
  console.log(`Server running on http://localhost:${port}`);
});
