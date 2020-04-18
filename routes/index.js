const express = require("express");
const router = express.Router();
const runController = require("../controllers/runController");
const userController = require("../controllers/userController");
const authController = require("../controllers/authController");

const { catchErrors } = require("../handlers/errorHandlers");

router.get("/", catchErrors(runController.getRuns));
router.get("/runs", catchErrors(runController.getruns));
router.get("/new-run", runController.newRun);
router.post("/new-run", catchErrors(runController.createRun));
router.post("/new-run/:id", catchErrors(runController.updateRun));
router.get("/runs/:id/edit", catchErrors(runController.editRun));
router.get("/login", userController.loginForm);
router.get("/register", userController.registerForm);
router.post(
  "/register",
  userController.validateUser,
  catchErrors(userController.register),
  authController.login
);

module.exports = router;
