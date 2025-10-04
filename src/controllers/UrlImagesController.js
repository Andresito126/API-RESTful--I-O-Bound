import {UrlImageService} from '../services/UrlImageService.js'
import { FileFormatFactory } from '../models/factories/FileFormatFactory.js';
import { ImageProcessor } from '../models/entities/ImageProcessor.js';
import fs from 'fs';
import path from 'path';

export const convertUrlsToPDFController = async (req, res) => {
  let urls = [];
  try {
    // parsea el body
    const body = await new Promise((resolve) => {
      let data = '';
      req.on('data', chunk => data += chunk);
      req.on('end', () => resolve(data));
    });

    urls = JSON.parse(body).urls || [];
    if (!Array.isArray(urls) || urls.length === 0) {
      throw new Error("No se proporcionó un array bien");
    }
  } catch (e) {
    res.writeHead(400, { "Content-Type": "application/json" });
    return res.end(JSON.stringify({ error: "datos invalidos o faltantes." }));
  }

  try {
    // usar el service para descargar las imgs 
    const uploadsDir = path.resolve('./src/uploads');

    if (fs.existsSync(uploadsDir)) {
      fs.rmSync(uploadsDir, { recursive: true, force: true });
      console.log(`Carpeta '${uploadsDir}' eliminada.`);
    }
    
    fs.mkdirSync(uploadsDir, { recursive: true });
    console.log(`Carpeta '${uploadsDir}' creada.`);

    const downloadedFiles = await UrlImageService.createFolderAndImages(urls,uploadsDir);

    if (downloadedFiles.length === 0) {
      throw new Error("noo se pudo descargar ninguna imagen valida.");
    }

    // uso del strategy y factory 
    const processor = new ImageProcessor();
    processor.addImages(downloadedFiles);

    const strategy = FileFormatFactory.createFileFormatStrategy("pdf");
    processor.setFileFormatStrategy(strategy);

    const outputPath = await processor.process();

    // da el pdf
    res.writeHead(200, {
      "Content-Type": "application/pdf",
      "Content-Disposition": `attachment; filename="${path.basename(outputPath)}"`
    });

    const readStream = fs.createReadStream(outputPath);
    readStream.pipe(res);

    // limpia los archivos
    res.on("finish", async () => {
        const filesToDelete = [
        outputPath,
        ...downloadedFiles.map(file => file.path)
    ];

    // eecuta el borrado de todos los archivos en paralelo
    await Promise.all(filesToDelete.map(filePath => 
        fs.promises.unlink(filePath).catch(err => {
        console.error(`Error al borrar archivo ${filePath}:`, err.message);
        })
    ));
    });

  } catch (err) {
    console.error("error en el procesamiento de url:", err.message);
    if (!res.headersSent) {
      res.writeHead(400, { "Content-Type": "application/json" });
      res.end(JSON.stringify({ error: err.message }));
    }
  }
};
