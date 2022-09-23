const express = require("express");
require("dotenv").config();
require("./db");
const cors = require("cors");

const userRouter = require("./routes/user");

const app = express();

const port = process.env.PORT || 5000;
app.use(cors());
app.get("/", (req, res) => {
  res.send("<h1> Hello </h1>");
});

app.use(express.json());

// app.use((req,res,next) =>{
//     req.on('data', (chunk) => {
//         req.body = JSON.parse(chunk)
//         next()
//     })

// })

app.use(userRouter);

app.listen(port, `${process.env.CLIENT_URL}`, () => {
  console.log(`app is running ${port}`);
});
