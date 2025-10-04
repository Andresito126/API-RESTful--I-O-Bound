import { FileFormatFactory } from "../models/factories/FileFormatFactory.js";
import { ImageProcessor } from "../models/entities/ImageProcessor.js";
import busboy from "busboy";
import path from "path";
import fs from "fs";
import url from "url";

export const convertImagesToPDFController = (req, res) => {

    const __filename = url.fileURLToPath(import.meta.url);
    const __dirname = path.dirname(__filename);
    const uploadsDir = path.resolve(__dirname, "../uploads");

    if (!fs.existsSync(uploadsDir)) {
        fs.mkdirSync(uploadsDir, { recursive: true });
    }

    const busBoy = busboy({ headers: req.headers });
    const uploadedFiles = [];

    busBoy.on("file", (fieldname, file, fileInfo) => {
        const { filename, mimeType } = fileInfo;

        const saveTo = path.join(uploadsDir, `${Date.now()}-${filename}`);
        const writeStream = fs.createWriteStream(saveTo);
        file.pipe(writeStream);

        uploadedFiles.push({
            path: saveTo,
            mimetype: mimeType,
            originalname: filename,
        });
    });


    busBoy.on("finish", async () => {

        try {
            const processor = new ImageProcessor();
            processor.addImages(uploadedFiles);

            const strategy = FileFormatFactory.createFileFormatStrategy("pdf");
            processor.setFileFormatStrategy(strategy);

            const outputPath = await processor.process();

            if (!outputPath || typeof outputPath !== 'string') {
                throw new Error("outputPath invalid");
            }

            if (!res.headersSent) {
                res.writeHead(200, {
                    "Content-Type": "application/json",
                    "Content-Disposition": `attachment; filename="converted-${Date.now()}.pdf"`
                });

                const readStream = fs.createReadStream(outputPath);
                readStream.pipe(res);

                readStream.on("end", () => {
                    res.end();
                });

                res.on("finish", () => {
                    // Eliminar el archivo PDF generado
                    fs.unlink(outputPath, (err) => {
                        if (err) console.error("Error deleting PDF file:", err);
                    });

                    // Eliminar las imágenes subidas
                    uploadedFiles.forEach(file => {
                        fs.unlink(file.path, (err) => {
                            if (err) console.error(`Error deleting image file ${file.path}:`, err);
                        });
                    });
                });
            }

        } catch (err) {
            console.log(err)
            if (!res.headersSent) {
                res.writeHead(400, { "Content-Type": "application/json" });
                res.end(JSON.stringify({ error: err.message }));
            } else {
                console.error("Error after sending headers:", err.message);
            }
        }
    });

    req.pipe(busBoy);

};

