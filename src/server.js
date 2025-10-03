const cluster = require("cluster");
const numCPUs = require("os").availableParallelism();
const process = require("process");
const http = require("http");

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

    // Los procesos trabajadores entrarán en este bloque
    // Crear un servidor HTTP básico
    http.createServer((req, res) => {
        res.writeHead(200);
        res.end('Hello World\n');
    }).listen(PORT);

    console.log(`Worker ${process.pid} started`);

}


