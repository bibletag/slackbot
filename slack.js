"use strict";
let Botkit = require("botkit");
let http = require("http");

if(!process.env.BT_CLIENT_ID || !process.env.BT_CLIENT_SECRET || !process.env.PORT || !process.env.BT_VERIFICATION_TOKEN){
    console.log('Error: Specify BT_CLIENT_ID, BT_CLIENT_SECRET, BT_VERIFICATION_TOKEN and BT_PORT in environment');
    process.exit(1);
}

let config = {};
if(process.env.MONGOLAB_URI){
  let BotkitStorage = require('botkit-storage-mongo');
  config = {storage: BotkitStorage({mongoUri: process.env.MONGOLAB_URI})};
}
else{
  config = {json_file_store: './db_slackbutton_slash_command/'};
}

let controller = Botkit.slackbot(config).configureSlackApp({clientId: process.env.BT_CLIENT_ID, clientSecret: process.env.BT_CLIENT_SECRET, scopes: ['commands']});

controller.setupWebserver(process.env.PORT, (error, webserver) => {
  controller.createWebhookEndpoints(controller.webserver);
  controller.createOauthEndpoints(controller.webserver, (error, req, res) => {
    if(error){
      res.status(500).send('ERROR: ' + error);
    }
    else{
      res.send('Success!');
    }
  });
});

controller.on('slash_command', (slashCommand, message) => {
  switch(message.command){
    case "/bibletag":
      if (message.token !== process.env.BT_VERIFICATION_TOKEN){
        return;
      }
      else{
        if (message.text === "" || message.text === "help") {
          slashCommand.replyPrivate(message, "I'll give you a bible passage for whatever you want. Type `/bibletag [your tags]`, and I'll give you a related passage.");
          return;
        }
        slashCommand.replyPublicDelayed(message, "", () => {
          http.get("http://45.55.144.141:8080/tag/" + message.text.split(" ")[0], (response) => {
            if(response.statusCode === 204){
              slashCommand.replyPublicDelayed(message, "Sorry, but I could not find any passages for " + message.text + " :cry:");
            }
            else{
              let responseString = "";
              response.on("data", (data) => {
                responseString += data;
              });
              response.on("end", () => {
                let verses = JSON.parse(responseString);
                let verse = verses[Math.floor(Math.random() * verses.length)];
                slashCommand.replyPublicDelayed(message, ">" + verse.verse_text + " -" + verse.book_name + " " + verse.chapter_id + ":" + verse.verse_id);
              });
              response.on("error", () => {
                slashCommand.replyPublicDelayed(message, "Something went wrong...");
              });
            }
          });
        });
      }
      break;
    default:
      slashCommand.replyPublic(message, "I'm afraid I don't know how to " + message.command + "yet.");
  }
});