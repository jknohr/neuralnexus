
import { FFmpeg } from '@ffmpeg/ffmpeg';
import { toBlobURL, fetchFile } from '@ffmpeg/util';

class MediaPipelineService {
    private ffmpeg: FFmpeg | null = null;
    private isLoaded: boolean = false;

    constructor() { }

    private async loadFFmpeg() {
        if (this.isLoaded) return;

        this.ffmpeg = new FFmpeg();
        const baseURL = 'https://unpkg.com/@ffmpeg/core@0.12.6/dist/esm';

        // We load the core and wasm from a reliable CDN for now
        await this.ffmpeg.load({
            coreURL: await toBlobURL(`${baseURL}/ffmpeg-core.js`, 'text/javascript'),
            wasmURL: await toBlobURL(`${baseURL}/ffmpeg-core.wasm`, 'application/wasm'),
        });

        this.isLoaded = true;
    }

    // --- Image Standardization (Canvas) ---
    async convertImageToWebP(file: File): Promise<Blob> {
        return new Promise((resolve, reject) => {
            const img = new Image();
            img.onload = () => {
                const canvas = document.createElement('canvas');
                canvas.width = img.width;
                canvas.height = img.height;
                const ctx = canvas.getContext('2d');
                if (!ctx) {
                    reject('Could not get canvas context');
                    return;
                }
                ctx.drawImage(img, 0, 0);
                canvas.toBlob((blob) => {
                    if (blob) resolve(blob);
                    else reject('Canvas to Blob failed');
                }, 'image/webp', 0.85); // 85% Quality
            };
            img.onerror = reject;
            img.src = URL.createObjectURL(file);
        });
    }

    // --- Audio/Video Standardization (FFmpeg) ---
    async convertAvToStandard(file: File, type: 'audio' | 'video'): Promise<Blob> {
        if (!this.isLoaded) await this.loadFFmpeg();
        const ffmpeg = this.ffmpeg!;

        const ext = type === 'audio' ? 'ogg' : 'webm';
        const inputName = `input.${file.name.split('.').pop()}`;
        const outputName = `output.${ext}`;

        await ffmpeg.writeFile(inputName, await fetchFile(file));

        if (type === 'audio') {
            // Convert to Ogg Vorbis
            await ffmpeg.exec(['-i', inputName, '-c:a', 'libvorbis', '-q:a', '4', outputName]);
        } else {
            // Convert to WebM (VP8/Opus) - Fast preset
            // Using -vf scale for reasonable size if needed, but keeping simple for now
            await ffmpeg.exec([
                '-i', inputName,
                '-c:v', 'libvpx',
                '-b:v', '1M',
                '-c:a', 'libvorbis',
                outputName
            ]);
        }

        const data = await ffmpeg.readFile(outputName);
        // Cast to BlobPart - FFmpeg returns Uint8Array which works with Blob at runtime
        const bytes = (typeof data === 'string'
            ? new TextEncoder().encode(data)
            : new Uint8Array(data)) as BlobPart;
        return new Blob([bytes], { type: type === 'audio' ? 'audio/ogg' : 'video/webm' });
    }

    // --- Main Pipeline ---
    async processMedia(file: File): Promise<{ blob: Blob, extension: string, mime: string }> {
        const type = file.type.split('/')[0];
        const subtype = file.type.split('/')[1];

        // 1. Documents: Passthrough if allowed
        if (file.name.match(/\.(pdf|docx|txt|csv|md|xlsx|pptx|html)$/i)) {
            return { blob: file, extension: file.name.split('.').pop() || 'dat', mime: file.type };
        }

        // 2. Images -> WebP
        if (type === 'image') {
            if (subtype === 'svg+xml') {
                return { blob: file, extension: 'svg', mime: 'image/svg+xml' };
            }
            return {
                blob: await this.convertImageToWebP(file),
                extension: 'webp',
                mime: 'image/webp'
            };
        }

        // 3. Audio -> Ogg
        if (type === 'audio') {
            if (subtype === 'ogg') return { blob: file, extension: 'ogg', mime: 'audio/ogg' };
            return {
                blob: await this.convertAvToStandard(file, 'audio'),
                extension: 'ogg',
                mime: 'audio/ogg'
            };
        }

        // 4. Video -> WebM
        if (type === 'video') {
            if (subtype === 'webm') return { blob: file, extension: 'webm', mime: 'video/webm' };
            return {
                blob: await this.convertAvToStandard(file, 'video'),
                extension: 'webm',
                mime: 'video/webm'
            };
        }

        throw new Error(`Unsupported file type: ${file.type}`);
    }
}

export const mediaPipeline = new MediaPipelineService();
