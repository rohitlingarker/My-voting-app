/* eslint-disable no-unused-vars */
const express = require("express");
const app = express();
var cookieParser = require("cookie-parser");
var csrf = require("csurf");
const { Question, User, Election, Option, Voter } = require("./models");
const bodyParser = require("body-parser");
const path = require("path");
const connectEnsureLogin = require("connect-ensure-login");
const passport = require("passport");
const session = require("express-session");
const LocalStrategy = require("passport-local");
const bcrypt = require("bcrypt");
const flash = require("connect-flash");
const { Op } = require("sequelize");

const saltRounds = 10;

app.set("views", path.join(__dirname, "views"));

app.set("view engine", "ejs");

app.use(bodyParser.json());
app.use(express.urlencoded({ extended: false }));
app.use(cookieParser("secret string"));
app.use(csrf({ cookie: true }));

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
  "voter-local",
  new LocalStrategy(
    {
      usernameField: "voterName",
      passwordField: "password",
    },
    (voterName, password, done) => {
      Voter.findOne({ where: { voterName } })
        .then(async (user) => {
          const result = await bcrypt.compare(password, user.password);

          if (result) {
            return done(null, user);
          } else {
            return done(null, false, { message: "Invalid Password" });
          }
        })
        .catch((error) => {
          console.log(error);
          return done(null, false, { message: "Invalid Voter Name" });
        });
    }
  )
);
passport.use(
  "user-local",
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
  let isAdmin;
  if (user.firstName) {
    console.log("Role is user");
    isAdmin = true;
  } else if (user.voterName) {
    console.log("Role is voter");
    isAdmin = false;
  }
  done(null, { _id: user.id, isAdmin: isAdmin });
});

passport.deserializeUser((cuser, done) => {
  console.log("deserializing user", cuser._id);
  if (cuser.isAdmin) {
    User.findByPk(cuser._id)
      .then((user) => {
        user.isAdmin = cuser.isAdmin;
        done(null, user);
      })
      .catch((error) => {
        done(error, null);
      });
  } else {
    Voter.findByPk(cuser._id)
      .then((user) => {
        user.isAdmin = cuser.isAdmin;
        done(null, user);
      })
      .catch((error) => {
        done(error, null);
      });
  }
});

function isAdmin() {
  return function (req, res, next) {
    if (req.user.isAdmin === true) {
      next();
    } else {
      res.redirect("/login");
    }
  };
}

function isVoter() {
  return function (req, res, next) {
    console.log("in isVoter function", req.user.id);
    if (req.user.isAdmin === false) {
      next();
    } else {
      req.flash("error", "Login as a voter to vote");
      res.redirect(`/elections/${req.params.id}/voterlogin`);
    }
  };
}

function ensureVoterLoggedIn(options) {
  if (typeof options == "string") {
    options = { redirectTo: options };
  }
  options = options || {};

  var setReturnTo =
    options.setReturnTo === undefined ? true : options.setReturnTo;

  return function (req, res, next) {
    var url = options.redirectTo || `/elections/${req.params.id}/voterlogin`;
    if (!req.isAuthenticated || !req.isAuthenticated()) {
      if (setReturnTo && req.session) {
        req.session.returnTo = req.originalUrl || req.url;
      }
      return res.redirect(url);
    }
    next();
  };
}

function isEligible() {
  return function (req, res, next) {
    if (req.user.voteStatus === false) {
      next();
    } else {
      req.flash("error", "You have already cast your vote");
      res.redirect(`/elections/${req.params.id}/voterlogin`);
    }
  };
}

function electionNotRunning() {
  return async function (req, res, next) {
    const election = await Election.findByPk(req.params.id);
    if (election.onGoingStatus === false) {
      next();
    } else {
      req.flash("error", "Election running,cannot modify questions or answers");
      res.redirect(`/elections/${req.params.id}`);
    }
  };
}

function electionRunning() {
  return async function (req, res, next) {
    const election = await Election.findByPk(req.params.id);
    if (election.onGoingStatus === true) {
      next();
    } else {
      req.flash("error", "Voting ended");
      res.redirect(`/elections/${req.params.id}/results`);
    }
  };
}

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

app.get(
  "/elections",
  connectEnsureLogin.ensureLoggedIn(),
  isAdmin(),
  async (request, response) => {
    try {
      const electionList = await Election.getAllElections();
      if (request.accepts("html")) {
        // console.log({ electionList });
        // response.json(electionList);
        response.render("elections", {
          title: "Elections",
          data: electionList,
          csrfToken: request.csrfToken(),
        });
      } else {
        response.json({ electionList });
      }
    } catch (error) {
      console.log(error);
    }
  }
);

app.post(
  "/elections",
  connectEnsureLogin.ensureLoggedIn(),
  isAdmin(),
  async (request, response) => {
    try {
      const newElection = await Election.createElection({
        name: request.body.name,
      });
      console.log(`Created election ${newElection.name}`);
      return response.redirect(`/elections/${newElection.id}`);
    } catch (error) {
      console.log(error);
    }
  }
);

app.get(
  "/elections/:id",
  connectEnsureLogin.ensureLoggedIn(),
  isAdmin(),
  async (request, response) => {
    try {
      const { name, onGoingStatus } = await Election.findByPk(
        request.params.id
      );
      const quesCount = await Question.count({
        where: {
          electionId: request.params.id,
        },
      });
      const voterCount = await Voter.count({
        where: {
          electionId: request.params.id,
        },
      });

      response.render("manageElection", {
        title: name,
        quesCount,
        voterCount,
        electionName: name,
        onGoingStatus,
        id: request.params.id,
        csrfToken: request.csrfToken(),
      });
    } catch (error) {
      console.log(error);
    }
  }
);

app.put(
  "/elections/:id/start",
  connectEnsureLogin.ensureLoggedIn(),
  isAdmin(),
  async (request, response) => {
    try {
      const election = await Election.findByPk(request.params.id);
      const questions = await election.getQuestions();
      const questionIds = questions.map((question) => {
        return question.id;
      });
      await Option.update(
        { count: 0 },
        {
          where: {
            questionId: {
              [Op.in]: questionIds,
            },
          },
        }
      );
      await Voter.update(
        { voteStatus: false },
        {
          where: {
            electionId: request.params.id,
          },
        }
      );
      const updatedElection = await election.startAnElection();

      response.json(updatedElection);
    } catch (error) {
      console.log(error);
      response.status(420);
    }
  }
);
app.put(
  "/elections/:id/end",
  connectEnsureLogin.ensureLoggedIn(),
  isAdmin(),
  async (request, response) => {
    try {
      const election = await Election.findByPk(request.params.id);
      const updatedElection = await election.endAnElection();

      response.json(updatedElection);
    } catch (error) {
      console.log(error);
      response.status(420);
    }
  }
);

app.delete(
  "/elections/:id",
  connectEnsureLogin.ensureLoggedIn(),
  isAdmin(),
  async (request, response) => {
    try {
      const value = await Election.removeElection(request.params.id);
      response.json(value > 0 ? true : false);
    } catch (error) {
      console.log(error);
    }
  }
);

///////////////////////////////////////////////////////////////////////////////////////////////////////////////////////
///////////////////////////////////////////////////////////////////////////////////////////////////////////////////////
///////////////////////////////////////////////////////////////////////////////////////////////////////////////////////

app.get(
  "/elections/:id/questions",
  electionNotRunning(),
  connectEnsureLogin.ensureLoggedIn(),
  isAdmin(),
  async (request, response) => {
    const questions = await Question.getAllQuestions(request.params.id);
    const election = await Election.findByPk(request.params.id);
    response.render("questions", {
      title: "Ballot",
      election,
      questions,
      id: request.params.id,
      csrfToken: request.csrfToken(),
    });
  }
);

//app.put(edit name)

app.delete(
  "/elections/:id/questions/:id",

  connectEnsureLogin.ensureLoggedIn(),
  isAdmin(),
  async (request, response) => {
    try {
      const value = await Question.removeQuestion(request.params.id);
      response.json(value > 0 ? true : false);
    } catch (error) {
      console.log(error);
    }
  }
);

app.get(
  "/elections/:id/questions/new",
  electionNotRunning(),
  connectEnsureLogin.ensureLoggedIn(),
  isAdmin(),
  async (request, response) => {
    try {
      response.render("newQuestion", {
        title: "create question",
        id: request.params.id,
        csrfToken: request.csrfToken(),
      });
    } catch (error) {
      console.log(error);
    }
  }
);

app.post(
  "/elections/:id/questions/new",
  electionNotRunning(),
  connectEnsureLogin.ensureLoggedIn(),
  isAdmin(),
  async (request, response) => {
    try {
      const newQuestion = await Question.addQuestion({
        name: request.body.name,
        description: request.body.description,
        electionId: request.params.id,
      });

      if (request.accepts("html")) {
        response.redirect(`/questions/${newQuestion.id}`);
      } else {
        response.json(newQuestion);
      }
    } catch (error) {
      console.log(error);
    }
  }
);

// electionNotRunning(),
// connectEnsureLogin.ensureLoggedIn(),
// isAdmin(),
app.get("/elections/:id/questions/:qid", async (request, response) => {
  try {
    const question = await Question.findByPk(request.params.qid);
    const election = await question.getElection();

    const options = await question.getOptions();
    const noOfOptions = await question.countOptions();

    response.render("manageQuestion", {
      title: "Manage Question",
      question: question,
      options: options,
      noOfOptions: noOfOptions,
      election,
      csrfToken: request.csrfToken(),
    });
  } catch (error) {
    console.log(error);
  }
});

app.put("/elections/:id/questions/:qid", async (request, response) => {
  try {
    const updatedQuestion = await Question.updateData(
      request.params.qid,
      request.body.name,
      request.body.description
    );
    const res = await Option.resetCount(request.params.qid);

    response.json(updatedQuestion);
  } catch (error) {
    console.log(error);
    response.json(error);
  }
});

app.put(
  "/elections/:id/questions/:qid/options/:oid",
  async (request, response) => {
    try {
      const updatedOption = await Option.update(
        { name: request.body.name, count: 0 },
        {
          where: {
            id: request.params.oid,
          },
        }
      );
      response.json(updatedOption);
    } catch (error) {
      console.log(error);
      response.json(error);
    }
  }
);

app.post(
  "/elections/:id/questions/:qid/options/new",
  electionNotRunning(),
  connectEnsureLogin.ensureLoggedIn(),
  isAdmin(),
  async (request, response) => {
    try {
      const question = await Question.findByPk(request.params.qid);
      const newOption = await Option.create({
        name: request.body.name,
        count: 0,
        questionId: request.params.qid,
      });
      await question.addOption(newOption);
      response.redirect(
        `/elections/${request.params.id}/questions/${request.params.qid}`
      );
    } catch (error) {
      console.log(error);
    }
  }
);

app.delete(
  "elections/:id/questions/:qid/options/:oid",
  electionNotRunning(),
  connectEnsureLogin.ensureLoggedIn(),
  isAdmin(),
  async (request, response) => {
    try {
      const value = await Option.remove(request.params.oid);
      response.json(value > 0 ? true : false);
    } catch (error) {
      console.log(error);
    }
  }
);

////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////
////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////
////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////

app.get(
  "/elections/:id/voters",
  connectEnsureLogin.ensureLoggedIn(),
  isAdmin(),
  async (request, response) => {
    const voters = await Voter.getAllVoters(request.params.id);
    const election = await Election.findByPk(request.params.id);
    response.render("voters", {
      title: "Ballot",
      election,
      voters,
      id: request.params.id,
    });
  }
);

app.get(
  "/elections/:id/voters/new",
  connectEnsureLogin.ensureLoggedIn(),
  isAdmin(),
  async (request, response) => {
    try {
      response.render("newVoter", {
        title: "Add Voter",
        id: request.params.id,
        csrfToken: request.csrfToken(),
      });
    } catch (error) {
      console.log(error);
    }
  }
);

app.post(
  "/elections/:id/voters/new",
  connectEnsureLogin.ensureLoggedIn(),
  isAdmin(),
  async (request, response) => {
    try {
      const hashedPwd = await bcrypt.hash(request.body.password, saltRounds);
      const newVoter = await Voter.addVoter({
        voterName: request.body.voterName,
        password: hashedPwd,
        electionId: request.params.id,
      });

      if (request.accepts("html")) {
        response.redirect(`/elections/${request.params.id}/voters`);
      } else {
        response.json(newVoter);
      }
    } catch (error) {
      console.log(error);
    }
  }
);

// app.get("/voters/:id", async (request, response) => {
//   try {
//     const voter = await Voter.findByPk(request.params.id);
//     console.log();
//     response.render("manageQuestion", { title: "Manage Voters", voter: voter });
//   } catch (error) {
//     console.log(error);
//   }
// });

app.get("/signup", (request, response) => {
  response.render("signup", {
    title: "Signup",
    csrfToken: request.csrfToken(),
  });
});

app.post("/users", async (request, response) => {
  // if(request.body.password===""){
  //   request.flash("error", "password required");
  //   response.redirect("/signup")
  // }
  const hashedPwd = await bcrypt.hash(request.body.password, saltRounds);

  try {
    const user = await User.create({
      firstName: request.body.firstName,
      lastName: request.body.lastName,
      email: request.body.email,
      password: hashedPwd,
    });
    request.login(user, (err) => {
      if (err) {
        console.log(err);
      }
      response.redirect("/elections");
    });
  } catch (error) {
    // error.errors.forEach((element) => {
    //   const msg = element.message;
    //   request.flash("error", msg);
    //   // if(msg==='Validation len on firstName failed'){request.flash("error","Fist Name required")}
    //   // if(msg==='Validation len on email failed'){request.flash("error","Email required")}
    //   // if(msg==='email must be unique'){request.flash("error","Email Already Existing")}
    // });

    console.log(error);
    response.redirect("/signup");
  }
});

app.get("/login", (request, response) => {
  if (request.user && request.user.isAdmin) {
    response.redirect("/elections");
  } else {
    response.render("login", {
      title: "Login",
      csrfToken: request.csrfToken(),
    });
  }
});

app.post(
  "/session",
  passport.authenticate("user-local", {
    failureRedirect: "/login",
    failureFlash: true,
  }),
  (request, response) => {
    response.redirect("/elections");
  }
);

app.get("/elections/:id/voterlogin", electionRunning(), (request, response) => {
  response.render("voterLogin", {
    title: "Login",
    csrfToken: request.csrfToken(),
    id: request.params.id,
  });
});

app.post(
  "/elections/:id/voterlogin",
  electionRunning(),
  passport.authenticate("voter-local", {
    failureRedirect: "back",
    failureFlash: true,
  }),
  (request, response) => {
    response.redirect(`/elections/${request.params.id}/vote`);
  }
);

app.get(
  "/elections/:id/vote",
  electionRunning(),
  ensureVoterLoggedIn(),
  isVoter(),
  isEligible(),
  async (request, response) => {
    let optionsList = {};
    let options;
    const election = await Election.findByPk(request.params.id);
    const questionsList = await Question.getAllQuestions(request.params.id);
    for (let i = 0; i < questionsList.length; i++) {
      options = await questionsList[i].getOptions();

      optionsList[questionsList[i].id] = options;
    }

    response.render("vote", {
      title: "Voting Session",
      election,
      questionsList,
      optionsList,
      csrfToken: request.csrfToken(),
    });
  }
);

app.post(
  "/elections/:id/evalVote",
  electionRunning(),
  ensureVoterLoggedIn(),
  isVoter(),
  isEligible(),
  async (request, response) => {
    console.log(
      "////////////////////////////////////////////////////////////////////////////////////////"
    );
    delete request.body._csrf;
    for (const key in request.body) {
      Option.incrementCount(request.body[key]);
    }
    await Voter.voted(request.user.id);
    response.redirect(`/elections/${request.params.id}/thankyou`);
  }
);

app.get(
  "/elections/:id/thankyou",
  ensureVoterLoggedIn(),
  isVoter(),
  (request, response) => {
    response.render("thankyou", { title: "Thankyou", id: request.params.id });
  }
);

app.get("/elections/:id/results", async (request, response) => {
  const election = await Election.findByPk(request.params.id);
  if (!election.onGoingStatus || (request.user && request.user.isAdmin)) {
    let optionsList = {};
    let options;
    const questionsList = await Question.getAllQuestions(request.params.id);
    for (let i = 0; i < questionsList.length; i++) {
      options = await questionsList[i].getOptions();

      optionsList[questionsList[i].id] = options;
    }
    response.render("results", {
      title: "Results",
      election,
      questionsList,
      optionsList,
    });
  } else {
    response.send("Election Still going on wait for the results");
  }
});

app.get("/signout", (request, response, next) => {
  request.logout((err) => {
    if (err) {
      return next(err);
    }
    response.redirect("/");
  });
});

module.exports = app;
