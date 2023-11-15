const express = require("express");
const app = express(); // create express app
const path = require("path");
const { client } = require("./database/client");
const queries = require("./database/dbQueries");
const bodyParser = require("body-parser");
const jsonParser = bodyParser.json();



client.connect();

//cors
const cors = require("cors");
app.use(cors());

// database calls

// app.post("/api/createTournament", jsonParser, async (req, res) => {
//   client.query("BEGIN");
//   try{
//     const tournament = req.body;
//     if (tournament.natjecatelji.length < 4 || tournament.natjecatelji.length > 8) {
//       res.json({ id: -1 });
//       return;
//     }

//     const dbres = await client.query(queries.newTournamentCreateNatjecanje(tournament));
//     const id = dbres.rows[0].idnatjecanje;

//     const natjecateljires = await client.query(queries.newTournamentCreateNatjecatelji(id, tournament));
//     const natjecatelji = natjecateljires.rows;
//     let natjecateljiIds = [];
//     for(let i = 0; i < natjecatelji.length; i++){
//         natjecateljiIds.push(natjecatelji[i].idnatjecatelj);
//     }

//     const idkolares = await client.query(queries.newTournamentCreateKola(id, tournament, natjecateljiIds));
//     const idkola = idkolares.rows;
//     let idkolaIds = [];
//     for(let i = 0; i < idkola.length; i++){
//         idkolaIds.push(idkola[i].idigra);
//     }

//     res.json({ id: id
//     });
//     client.query("COMMIT");
//   }catch(e){
//     client.query("ROLLBACK");
//     console.log(e);
//     res.json({ id: -1 });
//   }

// });



app.use(express.static(path.join(__dirname, "..", "build")));
app.use((req, res, next) => {
  res.sendFile(path.join(__dirname, "..", "build", "index.html"));
});


// start express server on port 5000
app.listen(5000, () => {
  console.log("server started on port 5000");
});