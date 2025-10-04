import { Worker } from "worker_threads";
import path from "path";

export class JobService {
    constructor() {
        this.requestJob();
    }

    requestJob() {
        process.send({ type: "requestJob" });
    }

    startJob(job) {
        console.log(`Worker ${process.pid} starting job ${job.id}`);

        const worker = new Worker(path.resolve("./src/workers/PDFWorker.js"), {
            workerData: { files: job.files, format: job.format }
        });

        worker.on("message", (msg) => {
            process.send({
                type: "jobDone",
                jobId: job.id,
                success: msg.success,
                outputPath: msg.outputPath,
                error: msg.error
            });

            this.requestJob();
        });

        worker.on("error", (err) => {
            process.send({
                type: "jobDone",
                jobId: job.id,
                success: false,
                error: err.message
            });

            this.requestJob();
        });
    }
}
