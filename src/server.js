import cluster from "cluster";
import os from "os";
import http from "http";
import { conversionsRoutes } from "./routes/ConversionsRoutes.js";
import { jobManager } from "./models/entities/job/JobManager.js";

const numCPUs = os.availableParallelism();
const PORT = 3000;

if (cluster.isPrimary) {
    console.log(`Master ${process.pid} is running`);

    // Fork workers
    for (let i = 0; i < numCPUs; i++) {
        const worker = cluster.fork();
        // Marcar como disponible
        worker.isAvailable = true;
    }

    // Escuchar mensajes de workers
    cluster.on("message", (worker, message) => {
        if (message.type === "newJob") {
            // El master centraliza la cola de jobs
            jobManager.enqueueJob(message.job, false);
        }
    });

    cluster.on('exit', (worker) => {
        console.log(`Worker ${worker.process.pid} died`);
        cluster.fork();
    });

} else {
    // Workers HTTP server
    http.createServer((req, res) => {
        res.setHeader("Access-Control-Allow-Origin", "*");
        res.setHeader("Access-Control-Allow-Methods", "GET,POST,OPTIONS");
        res.setHeader("Access-Control-Allow-Headers", "Content-Type");

        if (req.method === "OPTIONS") {
            res.writeHead(204);
            res.end();
            return;
        }

        conversionsRoutes(req, res);
    }).listen(PORT);

    console.log(`Worker ${process.pid} started`);
}
