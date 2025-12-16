import http from "http";
import { buildApp } from "./app.js";
import { loadAppConfig } from "./config/app-config.js";
import { logger } from "./utils/logger.js";

async function start() {
const config = loadAppConfig();

const app = buildApp(config);
const server = http.createServer(app);

const port = config.port;

server.listen(port, () => {
logger.info({
msg: "Servidor backend iniciado",
port
});
});

process.on("uncaughtException", (err) => {
logger.error({ msg: "uncaughtException", err });
});

process.on("unhandledRejection", (err) => {
logger.error({ msg: "unhandledRejection", err });
});
}

start().catch((err) => {
console.error("FATAL ERROR BOOTING SERVER:", err);
process.exit(1);
});



