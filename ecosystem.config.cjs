require("dotenv").config(); // loads .env automatically

module.exports = {
  apps: [
    {
      name: "api-server",
      script: "server.js",
      watch: false,
      env: {
        NODE_ENV: "development",
      },
      env_production: {
        NODE_ENV: "production",
        ...process.env, // inject all .env variables
      },
    },
    {
      name: "interview-worker",
      script: "workers/interview-worker.js",
      watch: false,
      env: {
        NODE_ENV: "development",
      },
      env_production: {
        NODE_ENV: "production",
        ...process.env,
      },
    },
    {
      name: "feedback-worker",
      script: "workers/feedback-worker.js",
      watch: false,
      env: {
        NODE_ENV: "development",
      },
      env_production: {
        NODE_ENV: "production",
        ...process.env,
      },
    },
    {
      name: "email-worker",
      script: "workers/email-worker.js",
      watch: false,
      env: {
        NODE_ENV: "development",
      },
      env_production: {
        NODE_ENV: "production",
        ...process.env,
      },
    }
  ]
};