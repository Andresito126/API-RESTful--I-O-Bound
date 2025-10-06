import PDFDocument from 'pdfkit';
import fs from 'fs';
import path from 'path';
import { FileFormatStrategy } from '../interfaces/FileFormatStrategy.js';

export class PDFFileFormatStrategy extends FileFormatStrategy {
    constructor() {
        super();
        this.supportedFormats = ['image/jpeg', 'image/jpg', 'image/png'];
    }

    async convertTo(files) {
        const outputDir = path.resolve('./src/uploads');
        if (!fs.existsSync(outputDir)) {
            fs.mkdirSync(outputDir, { recursive: true });
        }

        const outputPath = path.join(outputDir, `output-${Date.now()}.pdf`);
        const doc = new PDFDocument();
        const stream = fs.createWriteStream(outputPath);
        doc.pipe(stream);

        for (let i = 0; i < files.length; i++) {
            const file = files[i];

            doc.image(file.path, {
                fit: [500, 700],
                align: 'center',
                valign: 'center'
            });

            if (i < files.length - 1) {
                doc.addPage();
            }
        }


        doc.end();

        return new Promise((resolve, reject) => {
            stream.on("finish", () => resolve(outputPath));
            stream.on("error", reject);
        });
    }

    validateFiles(files) {
        if (!files || files.length === 0) {
            throw new Error("At least one file must be provided to convert to PDF");
        }

        files.forEach((file, index) => {
            if (!file.mimetype) {
                throw new Error(`File at index ${index} has no mimetype property`);
            }

            if (!this.supportedFormats.includes(file.mimetype)) {
                throw new Error(
                    `File "${file.originalname}" has unsupported type: ${file.mimetype}. ` +
                    `Supported formats: ${this.supportedFormats.join(", ")}`
                );
            }
        });

        return true;
    }
}
