# TODO

- [x] Add a onUploadCompleteClient
- [x] Add bytes package to convert bytes to human readable → [bytes.js](https://github.com/visionmedia/bytes.js)
- [x] No fie overwrite
- [x] Set CORS configuration automagically (with a `useUploadToS3` hook)
- [x] The file key is set by the server, not the client (cf. <https://env.fail/posts/aws-s3/>)
- [x] Forbid SVG upload (as it can be used for XSS attack)
- [x] Restore CORS Rules after 10s if no upload was done
- [x] Limit to rhe file type + file size in the presigned url
- [ ] Change IAM policy to allow for CORS configuration
- [ ] Add a prefix option to the S3 key
- [ ] Add a username option to the S3 key (use user.userId from auth of Clerk)
- [ ] Add a overwrite option
- [ ] Complete the README + specify that it only work in Next.js 15 (with React 19)
- [ ] Add a demo
- [ ] Add a demo with Clerk (show how simple it is to use) + username
- [ ] Add a demo with a database with a custom server action
- [ ] Mv to posse org in npmjs
- [ ] Publish 0.9.0 (rc)
- [ ] Add a onUploadComplete server action w/ check for the passed function to be "use server"
- [ ] Add a download button exemple

WARNINGS

- you are responsible with what you do when you get the files → if you authorize user to upload HTML files... you are responsible to sanatize them when you display them !!

New IAM policy

```json
{
  "Version": "2012-10-17",
  "Statement": [
    {
      "Effect": "Allow",
      "Action": [
        "s3:PutObject",
        "s3:GetObject",
        "s3:GetBucketCORS",
        "s3:PutBucketCORS"
      ],
      "Resource": ["arn:aws:s3:::translate-subtitles-app-uploads/*"]
    }
  ]
}
```
