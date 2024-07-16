'use client';
import { useUploadToS3 } from 'use-upload-to-s3';

export default function Home() {
  const [handleInputChange, s3key, isPending, error] = useUploadToS3(
    'translate-subtitles-app-uploads',
    {
      accept: 'image/*',
      sizeLimit: '5MB',
      onUploadComplete: (s3key, file) =>
        console.log(`Upload complete - s3key: ${s3key} - file: ${file.name}`),
    }
  );
  return (
    <main className='flex flex-col items-center justify-between p-24'>
      <input type='file' onChange={handleInputChange} />
      {s3key && <p>S3 key: {s3key}</p>}
      {isPending && <p>Upload in progress...</p>}
      {error && <p>Error: {error.message}</p>}
    </main>
  );
}
