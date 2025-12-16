import express from "express";
import cors from "cors";
import helmet from "helmet";
import { buildRouter } from "./api/router.js";
import chatRoutes from "./routes/chat-routes.js";
import { AppConfig } from "./config/app-config.js";
import { buildDependencyContainer } from "./config/dependency-container.js";

export function buildApp(config: AppConfig) {
	const app = express();

	// Seguridad básica
	app.use(helmet());
	app.use(
		cors({
			origin: "*", // TODO: restringir a dominios permitidos
			methods: ["GET", "POST"],
			credentials: false
		})
	);
	app.use(express.json({ limit: "1mb" }));

	// Instanciar controllers vía dependency container
	const controllers = buildDependencyContainer(config);
	app.use("/api/chatbot", buildRouter(controllers));

	// Chat endpoint (FlowEngine + SessionService)
	// This mounts POST /api/chat/next
	app.use("/api/chat", chatRoutes);

	// Health check fuera del prefijo
	app.get("/health", (_req, res) => {
		res.json({ status: "ok", timestamp: Date.now() });
	});

	return app;
}


