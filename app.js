/* eslint-disable no-unused-vars */
const express = require("express");
const app = express();
var cookieParser = require("cookie-parser");
// var csrf = require("csurf");
const { Question, User, Election, Option, Voter } = require("./models");
const bodyParser = require("body-parser");
const path = require("path");

const connectEnsureLogin = require("connect-ensure-login");
const passport = require("passport");
const session = require("express-session");
const LocalStrategy = require("passport-local");
const bcrypt = require("bcrypt");
const flash = require("connect-flash");

const saltRounds = 10;

app.set("views", path.join(__dirname, "views"));

app.set("view engine", "ejs");

app.use(bodyParser.json());
app.use(express.urlencoded({ extended: false }));
// app.use(cookieParser("secret string"));
// app.use(csrf({ cookie: true }));

app.use(
  session({
    secret: "my-super-secret-key-12323432345678324",
    cookie: {
      maxAge: 24 * 60 * 60 * 1000,
    },
  })
);

app.use(flash());
app.use(function (request, response, next) {
  response.locals.messages = request.flash();
  next();
});

app.use(passport.initialize());
app.use(passport.session());

passport.use(
  new LocalStrategy(
    {
      usernameField: "email",
      passwordField: "password",
    },
    (username, password, done) => {
      User.findOne({ where: { email: username } })
        .then(async (user) => {
          const result = await bcrypt.compare(password, user.password);
          console.log(result, user.password, password);
          if (result) {
            return done(null, user);
          } else {
            return done(null, false, { message: "Invalid Password" });
          }
        })
        .catch((error) => {
          console.log(error);
          return done(null, false, { message: "Invalid Email" });
        });
    }
  )
);

passport.serializeUser((user, done) => {
  console.log("Serializing user in session", user.id);
  done(null, user.id);
});

passport.deserializeUser((id, done) => {
  User.findByPk(id)
    .then((user) => {
      done(null, user);
    })
    .catch((error) => {
      done(error, null);
    });
});

app.get("/", async function (request, response) {
  // response.json("hi hello test")
  response.render("index", { title: "My voying app" });
  // response.render("index");
});
app.use(express.static(path.join(__dirname, "public")));

///////////////////////////////////////////////////////////////////////////////////////////////////////////////////////
///////////////////////////////////////////////////////////////////////////////////////////////////////////////////////
///////////////////////////////////////////////////////////////////////////////////////////////////////////////////////

//Elections page

app.get("/elections", async (request, response) => {
  try {
    const electionList = await Election.getAllElections();
    if (request.accepts("html")) {
      // console.log({ electionList });
      // response.json(electionList);
      response.render("elections", { title: "Elections", data: electionList });
    } else {
      response.json({ electionList });
    }
  } catch (error) {
    console.log(error);
  }
});

app.post("/elections", async (request, response) => {
  try {
    const newElection = await Election.createElection({
      name: request.body.name,
    });
    console.log(`Created election ${newElection.name}`);
    return response.redirect(`/elections/${newElection.id}`);
  } catch (error) {
    console.log(error);
  }
});

app.get("/elections/:id", async (request, response) => {
  try {
    const { name, onGoingStatus } = await Election.findByPk(request.params.id);
    const quesCount = await Question.count();
    const voterCount = await Voter.count();

    response.render("manageElection", {
      title: name,
      quesCount,
      voterCount,
      electionName: name,
      onGoingStatus,
      id: request.params.id,
    });
  } catch (error) {
    console.log(error);
  }
});

app.put("/elections/:id", async (request, response) => {
  try {
    const election = await Election.findByPk(request.params.id);
    const updatedElection = await election.toggleElectionStatus();

    response.json(updatedElection);
  } catch (error) {
    console.log(error);
    response.status(420);
  }
});

app.delete("/elections/:id", async (request, response) => {
  try {
    const value = await Election.removeElection(request.params.id);
    response.json(value > 0 ? true : false);
  } catch (error) {
    console.log(error);
  }
});

app.get("/elections/:id/questions", async (request, response) => {
  const questions = await Question.getAllQuestions(request.params.id);
  const electionName = await Election.findByPk(request.params.id).name;
  response.render("questions", {
    title: "Ballot",
    electionName,
    questions,
    id: request.params.id,
  });
});

app.delete("questions/:id", async (request, response) => {
  try {
    const value = await Question.removeQuestion(request.params.id);
    response.json(value > 0 ? true : false);
  } catch (error) {
    console.log(error);
  }
});
app.get("/elections/:id/questions/new", async (request, response) => {
  try {
    response.render("newQuestion", {
      title: "create question",
      id: request.params.id,
    });
  } catch (error) {
    console.log(error);
  }
});

app.post("/elections/:id/questions/new", async (request, response) => {
  try {
    const newQuestion = await Question.addQuestion({
      name: request.body.name,
      description: request.body.description,
      electionId: request.params.id,
    });
    console.log(newQuestion);
    if (request.accepts("html")) {
      response.redirect(`/questions/${newQuestion.id}`);
    } else {
      response.json(newQuestion);
    }
  } catch (error) {
    console.log(error);
  }
});

app.get("/questions/:id",async (request,response)=>{
  try {
    const question = await Question.findByPk(request.params.id)
    const options = await question.getOptions()
    const noOfOptions = await question.countOptions()
    console.log();
    response.render("manageQuestion",{title:"Manage Question",question:question,options:options,noOfOptions:noOfOptions})
  } catch (error) {
    console.log(error);
  }
})

app.post("/questions/:id/options/new",async (request,response)=>{
  try{const question = await Question.findByPk(request.params.id)
  const newOption = await Option.create({
    name: request.body.name,
    count: 0,
    questionId:request.params.id
  })
  await question.addOption(newOption)
  response.redirect(`/questions/${request.params.id}`)
  }catch(error){
    console.log(error);
  }
})

app.delete("/options/:id",async (request,response)=>{

    try{
      const value = await Option.remove(request.params.id);
      response.json(value > 0 ? true : false)
    }catch(error){
      console.log(error);
    }
})




module.exports = app;
