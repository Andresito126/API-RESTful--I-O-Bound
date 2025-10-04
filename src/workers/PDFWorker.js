import { FileFormatFactory } from "../models/factories/FileFormatFactory.js";
import { ImageProcessor } from "../models/entities/ImageProcessor.js";

process.on("message", async (msg) => {
    if (msg.type === "runJob") {
        const { job } = msg;

        try {
            const processor = new ImageProcessor();
            processor.addImages(job.files);

            const strategy = FileFormatFactory.createFileFormatStrategy(job.format);
            processor.setFileFormatStrategy(strategy);

            const outputPath = await processor.process();

            process.send({ type: "jobDone", jobId: job.id, success: true, outputPath });
        } catch (err) {
            process.send({ type: "jobDone", jobId: job.id, success: false, error: err.message });
        }
    }
});
