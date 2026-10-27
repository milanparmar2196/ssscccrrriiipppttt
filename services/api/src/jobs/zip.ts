import archiver from "archiver";
import { Writable } from "node:stream";

export async function buildZip(files: Array<{ name: string; content: string | Buffer }>): Promise<Buffer> {
  const chunks: Buffer[] = [];
  const sink = new Writable({
    write(chunk, _enc, cb) {
      chunks.push(chunk as Buffer);
      cb();
    },
  });
  const archive = archiver("zip", { zlib: { level: 9 } });
  const done = new Promise<void>((resolve, reject) => {
    sink.on("finish", resolve);
    archive.on("error", reject);
  });
  archive.pipe(sink);
  for (const f of files) archive.append(f.content, { name: f.name });
  await archive.finalize();
  await done;
  return Buffer.concat(chunks);
}
