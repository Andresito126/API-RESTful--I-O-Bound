import busboy from "busboy";
import path from "path";
import fs from "fs";
import url from "url";
import { jobManager } from "../models/entities/job/JobManager.js"
import { cleanupJob } from "../utils/cleanupJob.js";

export const createConversionController = (req, res) => {
    console.log("Headers:", req.headers["content-type"]);

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

    busBoy.on("finish", () => {
        const job = jobManager.createJob(uploadedFiles, "pdf");

        jobManager.enqueueJob(job);

        res.writeHead(202, { "Content-Type": "application/json" });
        res.end(JSON.stringify({
            jobId: job.id,
            status: job.status,
            message: "Job queued for processing"
        }));
    });

    req.pipe(busBoy);
};

export const getConversionStatusController = (req, res, jobId) => {
    const job = jobManager.getJob(jobId);
    if (!job) {
        res.writeHead(404, { "Content-Type": "application/json" });
        return res.end(JSON.stringify({ error: "Conversion not found" }));
    }

    res.writeHead(200, { "Content-Type": "application/json" });
    res.end(JSON.stringify(job));
};

export const downloadConversionController = (req, res, jobId) => {
    const job = jobManager.getJob(jobId);
    if (!job || job.status !== "done" || !job.resultPath) {
        res.writeHead(404, { "Content-Type": "application/json" });
        return res.end(JSON.stringify({ error: "PDF not ready" }));
    }

    res.writeHead(200, {
        "Content-Type": "application/pdf",
        "Content-Disposition": `attachment; filename="conversion-${jobId}.pdf"`,
    });

    const stream = fs.createReadStream(job.resultPath);
    stream.pipe(res);

    res.on("finish", () => {
        cleanupJob(jobManager, job, jobId);
    });

    stream.on("error", (err) => {
        console.error(`Stream error for job ${jobId}:`, err);
        res.writeHead(500).end("Error streaming file");
        cleanupJob(jobManager, job, jobId);
    });

    res.on("error", (err) => {
        console.error(`Response error for job ${jobId}:`, err);
        cleanupJob(jobManager, job, jobId);
    });
};

export const getQueueStatusController = (req, res) => {
    const status = jobManager.getQueueStatus();

    res.writeHead(200, { "Content-Type": "application/json" });
    res.end(JSON.stringify(status));
};