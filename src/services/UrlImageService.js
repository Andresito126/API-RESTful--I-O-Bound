import fs from "fs";
import path from "path";
import http from "http";
import https from "https";
import sharp from "sharp";


export class UrlImageService {

    static isValidHttpUrl(url) {
    try {
      const u = new URL(/^https?:\/\//i.test(url) ? url : "http://" + url);
      return u.protocol === "http:" || u.protocol === "https:";
    } catch {
      return false;
    }
  }


  static async downloadImage(url, uploadsDir) {
    
    // siempre se guardara en formato JPG
    const filename = path.join(uploadsDir, `${Date.now()}-${Math.floor(Math.random()*1000)}.jpg`);
    const client = url.startsWith("https") ? https : http;

    return new Promise((resolve, reject) => {  

      //buffer en memoria 
      const chunks = [];
      client.get(url, {  headers: {"User-Agent": "Mozilla/5.0 (Windows NT 6.1; Win64; x64; rv:47.0) Gecko/20100101 Firefox/47.0"}
        }, (response) => {
          if (response.statusCode !== 200) {
          reject(new Error(`Error al descargar: ${response.statusCode}`));
          return;
        }
        
        // aca se acumulan los datos en memoria
        // para luego procesarlos con sharp
        response.on("data", (chunk) => chunks.push(chunk));

        // esto es para cuando termina la descarga
        response.on("end", async () => {
        try {
          // une todos los fragmentos en uno solo, el buffer
          const buffer = Buffer.concat(chunks);
          // se procesa primero y luego se convierte a jpg antes de guardar
          // y devuelve el nombre del archivo
          await sharp(buffer).jpeg().toFile(filename);
          resolve({
              path: filename,
              mimetype: "image/jpeg",
              originalname: path.basename(filename)
            });
        } catch (err) {
          reject(err);
        }
      });
    }).on("error", (err) => reject(err));
  });

  }

  static async createFolderAndImages(urls, uploadsDir) {
  // si existe la carpeta, se borra y se crea de nuevo
  if (fs.existsSync(uploadsDir)) {
    fs.rmSync(uploadsDir, { recursive: true, force: true });
    console.log(`Carpeta '${uploadsDir}' eliminada.`);
  }

  fs.mkdirSync(uploadsDir, { recursive: true });
  console.log(`Carpeta '${uploadsDir}' creada.`);

  const results = [];
  for (let url of urls) {

    if (!this.isValidHttpUrl(url)) {
    console.error("URL inválida, se omite:", url);
    continue;
  }

    try {

      // descarga y convierte cada imagen
      const file = await this.downloadImage(url, uploadsDir);
      results.push(file);
    } catch (err) {
      console.error("Error descargando", url, err);
    }
  }
  return results;
}

}