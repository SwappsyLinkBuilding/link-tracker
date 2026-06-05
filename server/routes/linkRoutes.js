const express = require("express");
const {
  getLinks,
  createLink,
  updateLink,
  deleteLink,
  exportCsv,
  importCsv,
} = require("../controllers/linksController");
const { requireAuth } = require("../middleware/auth");

const router = express.Router();

// All link routes require authentication.
router.use(requireAuth);

// CSV routes are declared before "/:id" so they aren't shadowed by it.
router.get("/export.csv", exportCsv);
router.post("/import", importCsv);

router.get("/", getLinks);
router.post("/", createLink);
router.patch("/:id", updateLink);
router.delete("/:id", deleteLink);

module.exports = router;
