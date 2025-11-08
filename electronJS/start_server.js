const path = require("path");
const task_server = require(path.join(__dirname, "server.js"));
task_server.start(task_server.SERVER_CONFIG.MAIN_PORT); //start local server