export class ImageProcessor {
    constructor(){
        this.images = [];
        this.fileFormatStrategy = null;
    }

    addImages(images) {
        if (!Array.isArray(images) || images.length === 0){ 
            throw new Error("At least one image must be provided in order to convert it to PDF");
        }
        this.images = images;
    }

    setFileFormatStrategy(strategy) { this.fileFormatStrategy = strategy }

    checkoutFileFormatStrategy() {
        if (!this.fileFormatStrategy) throw new Error("A file format must be provided to convert such files");
    }

    async process() {
        this.checkoutFileFormatStrategy();
        this.fileFormatStrategy.validateFiles(this.images);
        return await this.fileFormatStrategy.convertTo(this.images);
    }
}
