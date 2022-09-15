const mongoose = require('mongoose');

mongoose
  .connect("mongodb://localhost:27017/auth-connect", {
    useNewUrlParser: true,
    useUnifiedTopology: true
  })
  .then(() => {
    console.log("out db is connected");
  })
  .catch((err) => console.log(err));

