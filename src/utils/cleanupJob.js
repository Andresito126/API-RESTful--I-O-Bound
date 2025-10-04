import fs from "fs";

export function cleanupJob(jobManager, job, jobId) {
    setImmediate(() => {
        if (fs.existsSync(job.resultPath)) {
            fs.unlink(job.resultPath, (err) => {
                if (err) console.error(`Error deleting PDF: ${err.message}`);
                else console.log(`PDF deleted: ${job.resultPath}`);
            });
        }

        job.files.forEach(file => {
            if (fs.existsSync(file.path)) {
                fs.unlink(file.path, (err) => {
                    if (err) console.error(`Error deleting image ${file.path}: ${err.message}`);
                    else console.log(`Image deleted: ${file.path}`);
                });
            }
        });

        jobManager.jobs.delete(jobId);
        console.log(`Job ${jobId} cleaned up`);
    });
}
