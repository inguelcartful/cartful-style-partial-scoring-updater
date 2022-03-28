import { promisify } from 'util';
import { gzip, gunzip } from 'zlib';

const compress = promisify(gzip);
const unCompress = promisify(gunzip);

export class GZip {
  static compressJSON(json: any) {
    return compress(Buffer.from(JSON.stringify(json))).then((compress: any) =>
      compress.toString('base64'),
    );
  }

  static tryCompressJSON(json: any) {
    try {
      return GZip.compressJSON(json).catch(() => false);
    } catch (error) {
      return Promise.resolve(false);
    }
  }

  static unCompressJSON(str: string) {
    return unCompress(Buffer.from(str, 'base64')).then((jsonString: any) =>
      JSON.parse(jsonString),
    );
  }

  static tryUnCompressJSON(str: string) {
    try {
      return GZip.unCompressJSON(str).catch(() => false);
    } catch (error) {
      return Promise.resolve(false);
    }
  }
}
