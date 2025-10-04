import cluster from "cluster";

class JobManager {
    constructor(maxConcurrent = 8) {
        if (JobManager.instance) return JobManager.instance;

        this.jobs = new Map();      // Todos los jobs
        this.queue = [];            // Jobs en cola
        this.processing = new Set(); // Jobs en proceso
        this.maxConcurrent = maxConcurrent;

        // Solo en master: escuchar mensajes de los workers
        if (cluster.isPrimary) {
            cluster.on("message", (worker   , message) => {
                if (message.type === "newJob") {
                    this.enqueueJob(message.job, false);
                }
            });
        }

        JobManager.instance = this;
    }

    createJob(files, format) {
        const id = Date.now() + "-" + Math.random().toString(36).slice(2);
        const job = { id, files, format, status: "pending", resultPath: null, error: null };
        this.jobs.set(id, job);
        return job;
    }

    getJob(id) {
        return this.jobs.get(id);
    }

    updateJob(id, updater) {
        const job = this.jobs.get(id);
        if (job) updater(job);
    }

    enqueueJob(job, local = true) {
        if (cluster.isWorker && local) {
            // Enviar al master
            process.send({ type: "newJob", job });
        } else {
            // Encolar localmente (solo master)
            this.queue.push(job);
            this.processNext();
        }
    }

    processNext() {
        if (this.processing.size >= this.maxConcurrent) return;
        if (this.queue.length === 0) return;

        const job = this.queue.shift();
        this.processing.add(job.id);

        // Buscar un worker disponible
        const availableWorker = Object.values(cluster.workers).find(w => w.isAvailable !== false);
        if (!availableWorker) {
            // Si no hay worker, re-encolar
            this.queue.unshift(job);
            this.processing.delete(job.id);
            return;
        }

        availableWorker.isAvailable = false;
        availableWorker.send({ type: "runJob", job });

        availableWorker.once("message", (msg) => {
            if (msg.type === "jobDone") {
                this.updateJob(job.id, j => {
                    j.status = msg.success ? "done" : "error";
                    j.resultPath = msg.outputPath || null;
                    j.error = msg.error || null;
                });
            }

            this.processing.delete(job.id);
            availableWorker.isAvailable = true;

            // Procesar siguiente job
            this.processNext();
        });
    }

    getQueueStatus() {
        return {
            queued: this.queue.length,
            processing: this.processing.size,
            maxConcurrent: this.maxConcurrent,
            queuedJobs: this.queue.map(j => j.id),
            processingJobs: Array.from(this.processing)
        };
    }
}

export const jobManager = new JobManager();
