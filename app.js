const express = require("express");
const app = express();
const session = require("express-session");
app.use(
    session({
      secret: "my-super-secret-key-12323432345678324",
      cookie: {
        maxAge: 24 * 60 * 60 * 1000,
      },
    })
  );
  app.get("/", async function (request, response) {
    response.json("hi hello test")
    // response.render("index");
  });
  module.exports = app;