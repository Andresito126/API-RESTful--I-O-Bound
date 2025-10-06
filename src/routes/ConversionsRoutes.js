import { createConversionController,getConversionStatusController, downloadConversionController } from "../controllers/ConversionsControllers.js";
import { createUrlConversionController } from "../controllers/UrlConversionsController.js";

export const conversionsRoutes = (req, res) => {
    if (req.method === "POST" && req.url === "/conversions") {
        return createConversionController(req, res);
    } 
    else if (req.method === "GET" && req.url.startsWith("/conversions/") && req.url.endsWith("/download")) {
        const jobId = req.url.split("/")[2];
        return downloadConversionController(req, res, jobId);
    } 
    else if (req.method === "GET" && req.url.startsWith("/conversions/")) {
        const jobId = req.url.split("/")[2];
        return getConversionStatusController(req, res, jobId);
    }
    else if (req.method === "POST" && req.url === "/conversions/url") {
        return createUrlConversionController (req, res);
    }  
    else {
        res.writeHead(404, { "Content-Type": "text/plain" });
        res.end("Not Found");
    }
};