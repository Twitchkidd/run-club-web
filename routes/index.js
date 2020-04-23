const express = require("express");
const router = express.Router();
const runController = require("../controllers/runController");
const userController = require("../controllers/userController");
const authController = require("../controllers/authController");
const runnersController = require("../controllers/runnersController");

const { catchErrors } = require("../handlers/errorHandlers");

router.get("/", catchErrors(runController.getRuns));
router.get("/runs", catchErrors(runController.getRuns));
router.get("/new-run", authController.isLoggedIn, runController.newRun);

router.post(
  "/new-run",
  runController.upload,
  catchErrors(runController.resize),
  catchErrors(runController.createRun)
);
router.post(
  "/new-run/:id",
  runController.upload,
  catchErrors(runController.resize),
  catchErrors(runController.updateRun)
);

router.get("/runs/:id/edit", catchErrors(runController.editRun));

router.get("/run/:slug", catchErrors(runController.getRunBySlug));

router.get("/tags", catchErrors(runController.getRunsByTag));
router.get("/tags/:tag", catchErrors(runController.getRunsByTag));

router.get("/login", userController.loginForm);
router.post("/login", authController.login);
router.get("/register", userController.registerForm);
router.post(
  "/register",
  userController.validateUser,
  catchErrors(userController.register),
  authController.login
);

router.get("/logout", authController.logout);

router.get("/account", authController.isLoggedIn, userController.account);
router.post("/account", catchErrors(userController.updateAccount));
router.post("/account/forgot", catchErrors(authController.forgot));
router.get("/account/reset/:token", catchErrors(authController.reset));
router.post(
  "/account/reset/:token",
  authController.confirmedPasswords,
  catchErrors(authController.update)
);

router.get("/runners", catchErrors(runnersController.getRunners));

router.get(
  "/new-buds",
  authController.isLoggedIn,
  catchErrors(runnersController.newBuds)
);
router.get(
  "/buds-list",
  authController.isLoggedIn,
  catchErrors(runnersController.budsList)
);

router.post(
  "/api/budsRequest/:id",
  authController.isLoggedIn,
  catchErrors(runnersController.budsRequest)
);

router.post(
  "/api/toggleFriendship/:id",
  authController.isLoggedIn,
  catchErrors(runnersController.toggleFriendship)
);

module.exports = router;
