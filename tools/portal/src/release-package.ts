import { createHash } from "node:crypto";

export interface ReleaseFile {
	path: string;
	bytes: number;
	sha256: string;
	data: Buffer;
}

function writeOctal(
	header: Buffer,
	value: number,
	offset: number,
	length: number,
) {
	const encoded = value.toString(8).padStart(length - 1, "0");
	if (encoded.length >= length) throw new Error("TAR_FIELD_OVERFLOW");
	header.write(encoded, offset, length - 1, "ascii");
	header[offset + length - 1] = 0;
}

function createTar(files: ReleaseFile[]) {
	const parts: Buffer[] = [];
	for (const file of [...files].sort((a, b) =>
		a.path < b.path ? -1 : a.path > b.path ? 1 : 0,
	)) {
		const name = Buffer.from(file.path);
		if (name.length > 100) throw new Error("TAR_PATH_TOO_LONG");
		const header = Buffer.alloc(512);
		name.copy(header);
		writeOctal(header, 0o644, 100, 8);
		writeOctal(header, 0, 108, 8);
		writeOctal(header, 0, 116, 8);
		writeOctal(header, file.bytes, 124, 12);
		writeOctal(header, 0, 136, 12);
		header.fill(0x20, 148, 156);
		header[156] = 0x30;
		header.write("ustar\0", 257, 6, "ascii");
		header.write("00", 263, 2, "ascii");
		const checksum = header.reduce((sum, byte) => sum + byte, 0);
		header.write(checksum.toString(8).padStart(6, "0"), 148, 6, "ascii");
		header[154] = 0;
		header[155] = 0x20;
		parts.push(header, file.data);
		const padding = (512 - (file.bytes % 512)) % 512;
		if (padding) parts.push(Buffer.alloc(padding));
	}
	parts.push(Buffer.alloc(1024));
	return Buffer.concat(parts);
}

function createZip(files: ReleaseFile[]) {
	const zipParts: Buffer[] = [];
	const directory: Buffer[] = [];
	let zipOffset = 0;
	for (const file of files) {
		let crc = 0xffffffff;
		for (const byte of file.data) {
			crc ^= byte;
			for (let bit = 0; bit < 8; bit++)
				crc = (crc >>> 1) ^ (crc & 1 ? 0xedb88320 : 0);
		}
		crc = (crc ^ 0xffffffff) >>> 0;
		const name = Buffer.from(file.path);
		const local = Buffer.alloc(30);
		local.writeUInt32LE(0x04034b50);
		local.writeUInt16LE(20, 4);
		local.writeUInt16LE(33, 12);
		local.writeUInt32LE(crc, 14);
		local.writeUInt32LE(file.bytes, 18);
		local.writeUInt32LE(file.bytes, 22);
		local.writeUInt16LE(name.length, 26);
		const central = Buffer.alloc(46);
		central.writeUInt32LE(0x02014b50);
		central.writeUInt16LE(20, 4);
		central.writeUInt16LE(20, 6);
		central.writeUInt16LE(33, 14);
		central.writeUInt32LE(crc, 16);
		central.writeUInt32LE(file.bytes, 20);
		central.writeUInt32LE(file.bytes, 24);
		central.writeUInt16LE(name.length, 28);
		central.writeUInt32LE(zipOffset, 42);
		zipParts.push(local, name, file.data);
		directory.push(central, name);
		zipOffset += local.length + name.length + file.bytes;
	}
	const centralBytes = Buffer.concat(directory);
	const end = Buffer.alloc(22);
	end.writeUInt32LE(0x06054b50);
	end.writeUInt16LE(files.length, 8);
	end.writeUInt16LE(files.length, 10);
	end.writeUInt32LE(centralBytes.length, 12);
	end.writeUInt32LE(zipOffset, 16);
	zipParts.push(centralBytes, end);
	return Buffer.concat(zipParts);
}

export function createReleasePackage(releaseFiles: ReleaseFile[]) {
	const artifacts = releaseFiles.map(({ data: _, ...artifact }) => artifact);
	const archives = [
		{
			path: "ssstool-release.tar",
			format: "tar",
			data: createTar(releaseFiles),
		},
		{
			path: "ssstool-release.zip",
			format: "zip",
			data: createZip(releaseFiles),
		},
	].map(({ data, ...archive }) => ({
		...archive,
		bytes: data.length,
		sha256: createHash("sha256").update(data).digest("hex"),
		data,
	}));
	const manifest = Buffer.from(
		`${JSON.stringify({ schema: "ssstool-private-release.v1", runtime: "node>=24", targets: ["darwin-arm64", "win32-x64", "linux-x64-glibc"], releaseId: createHash("sha256").update(JSON.stringify(artifacts)).digest("hex"), artifacts, archives: archives.map(({ data: _, ...archive }) => archive) }, null, 2)}\n`,
	);
	return { archives, manifest };
}
