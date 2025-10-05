import fs from "fs";
import { jobManagerDB } from "../models/entities/job/JobManager.js";

export async function cleanupJob(job, jobId) {
    setImmediate(async () => {
        // Eliminar el PDF generado
        if (job.result_path && fs.existsSync(job.result_path)) {
            fs.unlink(job.result_path, (err) => err ? console.error(err) : console.log(`PDF deleted: ${job.result_path}`));
        }

        // Eliminar las imágenes
        if (job.files && Array.isArray(job.files)) {
            job.files.forEach(file => {
                if (fs.existsSync(file.path)) {
                    fs.unlink(file.path, err =>
                        err ? console.error(err) : console.log(`Image deleted: ${file.path}`)
                    );
                }
            });
        }

        // Marcar job como eliminado
        await jobManagerDB.updateJob(jobId, { status: "deleted" });
        console.log(`Job ${jobId} cleaned up`);
    });
}
