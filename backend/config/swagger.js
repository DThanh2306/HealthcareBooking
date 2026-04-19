// swagger.js
const swaggerJsdoc = require("swagger-jsdoc");
const swaggerUi = require("swagger-ui-express");
const YAML = require("yamljs");
const path = require("path");

const externalComponents = YAML.load(path.join(__dirname, "components.yaml"));

const options = {
  definition: {
    openapi: "3.0.0",
    info: {
      title: "Booking Care",
      version: "1.0.0",
      description: "API cho quản lý bệnh viện và bác sĩ",
    },
    servers: [{ url: "http://localhost:3000/api" }],
    ...externalComponents,
  },
  apis: ["./routes/*.js", './chatbot/*.js'],
};

const specs = swaggerJsdoc(options);

function setupSwagger(app) {
  app.use("/api-docs", swaggerUi.serve, swaggerUi.setup(specs));
}

module.exports = setupSwagger;
