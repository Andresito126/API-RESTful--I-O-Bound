import cluster from "cluster";
import process from "process";
import http from "http";
import os from "os";
import { imagesRoutes } from "./routes/ImagesRoutes.js";

const numCPUs = os.availableParallelism();

const PORT = 3000;

if (cluster.isPrimary) {

    console.log(`Primary ${process.pid} is running`);

    // El proceso primario crea un worker por cada núcleo de CPU disponible en el sistema. 
    for (let i = 0; i < numCPUs; i++) {
        cluster.fork();
    }

    // Se encarga de manejar la salida de los procesos workers. 
    // Cada ves que un proceso termina, se registra en la consola 
    // el ID del proceso worker y se crea un nuevo proceso trabajador 
    // para remplazarlo
    cluster.on('exit', (worker, code, signal) => { console.log(`worker ${worker.process.pid} died`) });

} else {
    // Los workers entrarán en este bloque
    // Crear un servidor HTTP básico
    http.createServer((req, res) => {
        res.setHeader("Access-Control-Allow-Origin", "*");
        res.setHeader("Access-Control-Allow-Methods", "GET,POST,OPTIONS");
        res.setHeader("Access-Control-Allow-Headers", "Content-Type");

        if (req.method === "OPTIONS") {
            res.writeHead(204);
            res.end();
            return;
        }

        imagesRoutes(req, res);
    }).listen(PORT);

    console.log(`Worker ${process.pid} started`);
}


