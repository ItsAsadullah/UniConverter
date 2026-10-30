# Local crop dataset

When the document scanner runs on `localhost` through `npm run dev`, each manual crop correction is saved under `local-data/crop-dataset/`.

- Choose **Training** or **Testing** in the scanner toolbar before correcting a crop.
- Each sample contains the original image and an `annotation.json` with image dimensions, rotation, detector confidence, the automatic quadrilateral, and the corrected quadrilateral.
- The same image is identified by SHA-256. Saving it again updates its annotation instead of making duplicate samples; assigning it to the other split moves it there.
- The endpoint is available only in the Astro development server and accepts requests from localhost.
- The dataset directory is gitignored because scanned documents may contain private information. Review and sanitize samples before adding any to source control or sharing them.
- Clearing browser crop preferences does not delete these files.

The annotations use normalized coordinates from 0 to 1 in this corner order: top-left, top-right, bottom-right, bottom-left. A later dataset review can promote selected safe samples into versioned regression fixtures or use them to tune the detector.
