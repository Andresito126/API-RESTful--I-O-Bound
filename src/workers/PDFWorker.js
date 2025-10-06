import { parentPort, workerData } from "worker_threads";
import { FileFormatFactory } from "../models/factories/FileFormatFactory.js";
import { ImageProcessor } from "../models/entities/ImageProcessor.js";
import { jobManagerDB } from "../models/entities/job/JobManager.js";

(async () => {
    const { job } = workerData;

    console.log("Esto es lo que llega: ", workerData)

    try {
        await jobManagerDB.updateJob(job.id, { status: "processing" });

        const processor = new ImageProcessor(); // contexto

        const files = typeof job.files === 'string' ? JSON.parse(job.files) : job.files;
        processor.addImages(files);

        const strategy = FileFormatFactory.createFileFormatStrategy("pdf");
        processor.setFileFormatStrategy(strategy); // se pasa el contexto

        const outputPath = await processor.process();
        console.log(outputPath)

        await jobManagerDB.updateJob(job.id, { status: "done", result_path: outputPath });

        parentPort.postMessage({ success: true, jobId: job.id, outputPath });
    } catch (err) {
        await jobManagerDB.updateJob(job.id, { status: "error", error: err.message });
        parentPort.postMessage({ success: false, jobId: job.id, error: err.message });
    }
})();
