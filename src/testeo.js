// import { ImageProcessor } from "./models/entities/ImageProcessor.js";
// import { FileFormatFactory } from "./models/factories/FileFormatFactory.js";
// import { UrlImageService } from "./services/UrlImageService.js";

// (async () => {
//   try {
//     const urls = [
//       "https://upload.wikimedia.org/wikipedia/commons/4/47/PNG_transparency_demonstration_1.png",
//       "https://static.wikia.nocookie.net/kamenrider/images/6/67/KRO-OOOtatoba.png/revision/latest/scale-to-width-down/425?cb=20201129160204"  
//     ];

//     const files = await UrlImageService.createFolderAndImages(urls, "./src/uploads");

//     const processor = new ImageProcessor();
//     processor.addImages(files);
//     const strategy = FileFormatFactory.createFileFormatStrategy("pdf");
//     processor.setFileFormatStrategy(strategy);

//     const outputPath = await processor.process();
//     console.log("PDF generado en:", outputPath);

//   } catch (err) {
//     console.error(err);
//   }
// })();
