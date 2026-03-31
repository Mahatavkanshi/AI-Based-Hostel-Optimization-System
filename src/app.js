const express = require("express");
const cors = require("cors");
const helmet = require("helmet");
const morgan = require("morgan");
const routes = require("./routes");
const notFound = require("./middlewares/not-found");
const errorHandler = require("./middlewares/error-handler");

const app = express();

app.use(helmet());
app.use(cors());
app.use(morgan("dev"));
app.use(express.json());

app.use("/api", routes);
app.use(notFound);
app.use(errorHandler);

module.exports = app;
