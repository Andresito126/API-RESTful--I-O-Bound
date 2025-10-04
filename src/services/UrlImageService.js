import fs from "fs";
import path from "path";
import http from "http";
import https from "https";

export class UrlImageService {
  static getFileExtension(url, contentType) {
    // checa desde contet type
    if (contentType && contentType.startsWith("image/")) {
      const mimeType = contentType.split("/")[1];
      if (["png", "jpeg", "jpg"].includes(mimeType)) {
        return mimeType;
      }
    }
    // verifica desde la url
    const ext = path.extname(url).toLowerCase();
    if ([".png", ".jpg", ".jpeg"].includes(ext)) {
      return ext.substring(1);
    }
    return null;
  }

  static isValidHttpUrl(url) {
    try {
      const u = new URL(/^https?:\/\//i.test(url) ? url : "http://" + url);
      return u.protocol === "http:" || u.protocol === "https:";
    } catch {
      return false;
    }
  }

  static async downloadImage(url, uploadsDir) {
    const client = url.startsWith("https") ? https : http;

    return new Promise((resolve, reject) => {

      client.get(url, {  headers: {"User-Agent": "Mozilla/5.0 (Windows NT 6.1; Win64; x64; rv:47.0) Gecko/20100101 Firefox/47.0"}}, (response) => {
          if (response.statusCode !== 200) {
          reject(new Error(`Error al descargar: ${response.statusCode}`));
          return;
        }
            // valida y obtiene la extension
            const contentType = response.headers["content-type"] || "";
            const fileExt = this.getFileExtension(url, contentType);

            if (!fileExt) {
              return reject(
                new Error("tipo de imagen no soportado o indeterminable")
              );
            }

            //crear el stream de escritura y nombrambiento
            const filename = path.join(
              uploadsDir,`${Date.now()}-${Math.floor(Math.random() * 1000)}.${fileExt}`
            );
            const fileStream = fs.createWriteStream(filename);

            // pipe del stream de red a disco
            response.pipe(fileStream);

            //eventos del stream de disco

            fileStream.on("finish", () => {
              resolve({
                path: filename,
                mimetype: contentType,
                originalname: path.basename(filename),
              });
            });

            fileStream.on("error", (err) => {
              fs.unlink(filename, () => {}); 
              reject(new Error(`Error de escritura en disco: ${err.message}`));
            });
            
            response.on("error", (err) => {
              fileStream.close();
              reject(
                new Error(`Error de red durante la descarga: ${err.message}`)
              );
            });
          }
        )
        .on("error", (err) => {
          reject(new Error(`Error de conexión al URL: ${err.message}`));
        });
    });
  }

  static async createFolderAndImages(urls, uploadsDir) {
    
    const downloadPromises = urls.map((url) => {
      if (!this.isValidHttpUrl(url)) {
        console.error("url invalida:", url);
        return Promise.resolve(null);
      }
      // Llama a la función de descarga I/O Bound
      return this.downloadImage(url, uploadsDir).catch((err) => {
        console.error(`error descargando ${url}: ${err.message}`);
        return null;
      });
    });

    // promise.all las ejecuta concurrentemente
    const results = await Promise.all(downloadPromises);

    // retorna solo los archivos que se descargaron con éxito
    return results.filter((file) => file !== null);
  }
}
