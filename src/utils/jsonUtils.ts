import AWS from 'aws-sdk';

const s3 = new AWS.S3({
    httpOptions: {
    timeout: 120000,  // 25 seconds
    connectTimeout: 90000  // 5 seconds
  }
});


export class JSONLoader {
    static async loadFromS3(bucket: string, key: string): Promise<any> {
        const data = await s3.getObject({Bucket: bucket, Key: key}).promise();
        return JSON.parse(data.Body!.toString('utf-8'));
    }
}