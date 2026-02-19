const express = require("express");
const router = express.Router();

const supportController = require("../controllers/supportController");
const { customerAuth } = require("../middleware/customerAuth");

/**
* CREATE SUPPORT TICKET
* POST /api/support/create
*/
router.post("/create", customerAuth, supportController.createTicket);

/**
* GET CUSTOMER'S TICKETS
* GET /api/support/mytickets
*/
router.get("/mytickets", customerAuth, supportController.getMyTickets);

module.exports = router;