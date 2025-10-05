import busboy from "busboy";
import path from "path";
import fs from "fs";
import url from "url";
import { jobManagerDB } from "../models/entities/job/JobManager.js";
import { cleanupJob } from "../utils/cleanupJob.js";
import { Worker } from "worker_threads";

export const createConversionController = async (req, res) => {
    const __filename = url.fileURLToPath(import.meta.url);
    const __dirname = path.dirname(__filename);
    const uploadsDir = path.resolve(__dirname, "../uploads");

    if (!fs.existsSync(uploadsDir)) fs.mkdirSync(uploadsDir, { recursive: true });

    const busBoy = busboy({ headers: req.headers });
    const uploadedFiles = [];

    busBoy.on("file", (fieldname, file, fileInfo) => {
        const saveTo = path.join(uploadsDir, `${Date.now()}-${fileInfo.filename}`);
        file.pipe(fs.createWriteStream(saveTo));
        uploadedFiles.push({
            path: saveTo,
            mimetype: fileInfo.mimeType,
            originalname: fileInfo.filename
        });
    });

    busBoy.on("finish", async () => {
        try {
            const job = await jobManagerDB.createJob(uploadedFiles);
            const worker = new Worker('./src/workers/PDFWorker.js', {
                workerData: { job }
            });

            worker.on('message', msg => console.log('Worker finished job', msg));
            worker.on('error', err => console.error('Worker error:', err));

            res.writeHead(202, { "Content-Type": "application/json" });
            res.end(JSON.stringify({
                jobId: job.id,
                status: job.status,
                message: "Job queued for processing"
            }));
        } catch (err) {
            res.writeHead(500, { "Content-Type": "application/json" });
            res.end(JSON.stringify({ error: err.message }));
        }
    });

    req.pipe(busBoy);
};

export const getConversionStatusController = async (req, res, jobId) => {
    try {
        const job = await jobManagerDB.getJob(jobId);

        if (!job) {
            res.writeHead(404, { "Content-Type": "application/json" });
            return res.end(JSON.stringify({ error: "Conversion not found" }));
        }

        const safeJob = {
            id: job.id,
            status: job.status,
            files: job.files.map(f => ({
                path: f.path,
                mimetype: f.mimetype,
                originalname: f.originalname
            })),
            result_path: job.result_path,
            error: job.error,
            created_at: job.created_at,
            updated_at: job.updated_at
        };

        res.writeHead(200, { "Content-Type": "application/json" });
        res.end(JSON.stringify(safeJob));

    } catch (err) {
        res.writeHead(500, { "Content-Type": "application/json" });
        res.end(JSON.stringify({ error: err.message }));
    }
};


export const downloadConversionController = async (req, res, jobId) => {
    try {
        const job = await jobManagerDB.getJob(jobId);

        if (!job || job.status !== "done" || !job.result_path) {
            res.writeHead(404, { "Content-Type": "application/json" });
            return res.end(JSON.stringify({ error: "PDF not ready" }));
        }

        res.writeHead(200, {
            "Content-Type": "application/pdf",
            "Content-Disposition": `attachment; filename="conversion-${jobId}.pdf"`,
        });

        const stream = fs.createReadStream(job.result_path);
        stream.pipe(res);

        res.on("finish", () => cleanupJob(job, jobId));

        stream.on("error", (err) => {
            console.error(`Stream error for job ${jobId}:`, err);
            res.writeHead(500).end("Error streaming file");
            cleanupJob(job, jobId);
        });

        res.on("error", (err) => {
            console.error(`Response error for job ${jobId}:`, err);
            cleanupJob(job, jobId);
        });
    } catch (err) {
        res.writeHead(500, { "Content-Type": "application/json" });
        res.end(JSON.stringify({ error: err.message }));
    }
};
