import { convertImagesToPDFController } from "../controllers/ImagesController.js";
import { convertUrlsToPDFController } from "../controllers/UrlImagesController.js";

export const imagesRoutes = (req, res) => {
    if (req.method === "POST" && req.url === "/images/upload") {
        convertImagesToPDFController(req, res);

    } else if (req.method === "POST" && req.url === "/images/upload/url"){
        convertUrlsToPDFController(req, res);

    } else {
        res.writeHead(404, { "Content-Type": "text/plain" });
        res.end("Not Found");
    }
};

