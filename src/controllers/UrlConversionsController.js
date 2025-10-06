import { UrlImageService } from '../services/UrlImageService.js';
import { jobManagerDB } from '../models/entities/job/JobManager.js';
import { Worker } from 'worker_threads';
import path from 'path';
import fs from 'fs';
import { randomUUID } from 'crypto'; 


export const createUrlConversionController = async (req, res) => {
    
    // creamos una carpeta unica por peticion al job
    const uniqueDirName = `url-job-${randomUUID()}`;
    const uploadsDir = path.resolve('./src/uploads', uniqueDirName);
    
    let urls = [];
    let downloadedFiles = [];

    try {
        // parsea url
        const body = await new Promise((resolve, reject) => {
            let data = '';
            req.on('data', chunk => data += chunk);
            req.on('end', () => resolve(data));
            req.on('error', reject); 
        });


        urls = JSON.parse(body).urls || [];
        if (!Array.isArray(urls) || urls.length === 0) {
            throw new Error("no se proporcionarion urls validos.");
        }
        
        // la logica de creacion de la carpeta temporal ahora es aquio
        // antes de llamar al service
        fs.mkdirSync(uploadsDir, { recursive: true });

        downloadedFiles = await UrlImageService.createFolderAndImages(urls, uploadsDir);

        if (downloadedFiles.length === 0) {
            throw new Error("no se pudo descargar ninguna img.");
        }
        
        
        
        // crea el job en la db con las rutas de las imgs
        const job = await jobManagerDB.createJob(downloadedFiles);
        
        // lanza el worker para la tarea
        const worker = new Worker('./src/workers/PDFWorker.js', {
            workerData: { job } 
        });

        // config de listeners del worker
        worker.on('message', msg => console.log(`Worker finished job ${job.id}`));
        worker.on('error', err => console.error(`Worker error for job ${job.id}:`, err));
            console.log("josn recibido antes del parceo:", body); //

        res.writeHead(202, { "Content-Type": "application/json" });
        return res.end(JSON.stringify({
            jobId: job.id,
            status: job.status,
            message: "Job queued for processing"
        }));

    } catch (err) {
        
        console.error("Error en el procesamiento de URLs:", err.message);
        
        // intenta borrar la carpeta temporal si hubo un fallo antes
        //  de lanzar el Worker
        if (fs.existsSync(uploadsDir)) {
             fs.rmSync(uploadsDir, { recursive: true, force: true });
        }
        
        if (!res.headersSent) {
            res.writeHead(400, { "Content-Type": "application/json" });
            res.end(JSON.stringify({ error: err.message }));
        }
    }
};
