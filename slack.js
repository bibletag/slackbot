"use strict";
let express = require("express");

let app = express();
app.set("port", (process.env.PORT || 9001));

app.get("/", (request, response) => {
  response.send(JSON.stringify({response_type: "in_channel", text:"It's working!"}));
});

app.listen(app.get("port"), () => {
  console.log("Slackbot running on port " + app.get("port"));
});