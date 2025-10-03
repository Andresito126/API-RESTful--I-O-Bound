import { FileFormatStrategy } from "../interfaces/FileFormatStrategy";

export class FileFormatFactory {
    // Método estático para crear estrategias de distintos formatos de archivos
    static createFileFormatStrategy(format, files){
        switch(format.toLowerCase()){
            case 'PDF':
                return new FileFormatStrategy(files);

            default: 
                throw new Error(`Archive format ${format} no support`);
        }
    }
}
