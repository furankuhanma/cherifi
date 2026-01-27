const { S3Client } = require('@aws-sdk/client-s3');
const { getSignedUrl } = require('@aws-sdk/s3-request-presigner');
const { GetObjectCommand } = require('@aws-sdk/client-s3');

const s3Client = new S3Client({
  endpoint: `https://${process.env.B2_ENDPOINT}`,
  region: 'us-east-005',
  credentials: {
    accessKeyId: process.env.B2_KEY_ID,
    secretAccessKey: process.env.B2_APP_KEY,
  },
});

// Generate a signed URL for streaming a file
async function getStreamUrl(filename) {
  try {
    const command = new GetObjectCommand({
      Bucket: process.env.B2_BUCKET_NAME,
      Key: filename,
    });

    const url = await getSignedUrl(s3Client, command, { expiresIn: 3600 }); // 1 hour
    return url;
  } catch (error) {
    console.error('Error generating stream URL:', error);
    throw error;
  }
}

// List files in bucket (optional, for debugging)
async function listFiles(prefix = '') {
  const { ListObjectsV2Command } = require('@aws-sdk/client-s3');
  
  try {
    const command = new ListObjectsV2Command({
      Bucket: process.env.B2_BUCKET_NAME,
      Prefix: prefix,
      MaxKeys: 100
    });

    const response = await s3Client.send(command);
    return response.Contents || [];
  } catch (error) {
    console.error('Error listing files:', error);
    throw error;
  }
}

module.exports = {
  s3Client,
  getStreamUrl,
  listFiles
};