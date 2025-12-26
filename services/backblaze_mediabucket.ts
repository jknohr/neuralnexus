
import B2 from 'backblaze-b2';

interface B2Config {
    applicationKeyId: string;
    applicationKey: string;
    bucketId: string;
}

class BackblazeService {
    private b2: any;
    private bucketId: string;
    private authorized: boolean = false;

    constructor() {
        const config: B2Config = {
            applicationKeyId: import.meta.env.VITE_B2_KEY_ID || '',
            applicationKey: import.meta.env.VITE_B2_APP_KEY || '',
            bucketId: import.meta.env.VITE_B2_BUCKET_ID || ''
        };

        if (config.applicationKeyId && config.applicationKey) {
            this.b2 = new B2({
                applicationKeyId: config.applicationKeyId,
                applicationKey: config.applicationKey
            });
            this.bucketId = config.bucketId;
        } else {
            console.warn("Nexus: Backblaze B2 credentials missing.");
        }
    }

    async authorize() {
        if (!this.b2) return false;
        if (this.authorized) return true;
        try {
            await this.b2.authorize();
            this.authorized = true;
            return true;
        } catch (e) {
            console.error("Nexus: B2 Authorization failed", e);
            return false;
        }
    }

    async createBucket(bucketName: string): Promise<{ bucketId: string } | null> {
        if (!await this.authorize()) return null;
        try {
            const response = await this.b2.createBucket({
                bucketName,
                bucketType: 'allPublic' // standard for media
            });
            return { bucketId: response.data.bucketId };
        } catch (e) {
            console.error("Nexus: Buffer Creation Failed", e);
            return null;
        }
    }

    setBucket(bucketId: string) {
        this.bucketId = bucketId;
    }

    /**
     * Downloads a file from the B2 bucket using the B2 SDK mechanisms.
     * Takes the full public URL, extracts the filename, and retrieves the data.
     */
    async downloadMedia(publicUrl: string): Promise<ArrayBuffer | null> {
        if (!await this.authorize()) return null;

        try {
            // Extract filename from URL (assuming standard B2 public URL format)
            // URL: https://f000.backblazeb2.com/file/<bucketName>/<fileName>
            const urlObj = new URL(publicUrl);
            const pathParts = urlObj.pathname.split('/');
            // pathParts[0] is empty, [1] is 'file', [2] is bucketName, [3+] is filename
            if (pathParts.length < 4 || pathParts[1] !== 'file') {
                console.warn("Nexus: Invalid B2 Context URL", publicUrl);
                return null;
            }

            const bucketName = pathParts[2];
            const fileName = pathParts.slice(3).join('/'); // Rejoin remaining parts in case filename has slashes

            // Use B2 SDK to download (ensures we are "retrieving from bucket" as authorized user if needed)
            const response = await this.b2.downloadFileByName({
                bucketName: bucketName,
                fileName: fileName,
                responseType: 'arraybuffer'
            });

            return response.data;
        } catch (e) {
            console.error("Nexus: Failed to download media from bucket", e);
            return null;
        }
    }

    async uploadFile(file: File, fileName: string): Promise<{ fileId: string; url: string } | null> {
        if (!await this.authorize()) return null;

        try {
            // Get bucket info to retrieve bucket name for URL construction
            const bucketResponse = await this.b2.getBucket({ bucketId: this.bucketId });
            const bucketName = bucketResponse.data.buckets[0]?.bucketName;

            if (!bucketName) {
                console.error("Nexus: Could not determine bucket name");
                return null;
            }

            // Get Upload URL
            const response = await this.b2.getUploadUrl({
                bucketId: this.bucketId
            });

            const { uploadUrl, authorizationToken } = response.data;

            // Read file as array buffer
            const arrayBuffer = await file.arrayBuffer();
            const buffer = new Uint8Array(arrayBuffer);

            // Upload
            const uploadResponse = await this.b2.uploadFile({
                uploadUrl,
                uploadAuthToken: authorizationToken,
                fileName,
                data: buffer,
                mime: file.type
            });

            const fileId = uploadResponse.data.fileId;

            // Construct public URL for allPublic buckets
            // Format: https://f000.backblazeb2.com/file/<bucket_name>/<file_name>
            const url = `https://f000.backblazeb2.com/file/${bucketName}/${fileName}`;

            return { fileId, url };
        } catch (e) {
            console.error("Nexus: B2 Upload failed", e);
            return null;
        }
    }

    /**
     * Deletes a file from the bucket.
     */
    async deleteFile(fileId: string, fileName: string): Promise<boolean> {
        if (!await this.authorize()) return false;

        try {
            await this.b2.deleteFileVersion({
                fileId,
                fileName
            });
            return true;
        } catch (e) {
            console.error("Nexus: B2 Delete failed", e);
            return false;
        }
    }
}

export const mediaBucket = new BackblazeService();
