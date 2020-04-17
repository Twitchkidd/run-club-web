const express = require("express");
const router = express.Router();
const runController = require("../controllers/runController");

const { catchErrors } = require("../handlers/errorHandlers");

router.get("/", catchErrors(runController.getRuns));
router.get("/runs", catchErrors(runController.getruns));
router.get("/new-run", runController.newRun);
router.post("/new-run", catchErrors(runController.createRun));
router.post("/new-run/:id", catchErrors(runController.updateRun));
router.get("/runs/:id/edit", catchErrors(runController.editRun));

module.exports = router;
