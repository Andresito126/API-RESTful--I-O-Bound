
const UrlImageService = require("./services/UrlImageService");

(async () => {
  try {
    const urls = [
      "https://upload.wikimedia.org/wikipedia/commons/4/47/PNG_transparency_demonstration_1.png",
      "https://static.wikia.nocookie.net/kamenrider/images/6/67/KRO-OOOtatoba.png/revision/latest/scale-to-width-down/425?cb=20201129160204"  
    ];

    console.log("Descargando imágenes...");
    const files = await UrlImageService.createFolderAndImages(urls);

    console.log("Descargas hechas:");
    console.log(files);
  } catch (err) {
    console.error("Error:", err);
  }
})();
