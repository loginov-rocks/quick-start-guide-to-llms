import { downloadFile } from '@huggingface/hub';
import { writeFile } from 'fs/promises';
import { join } from 'path';

const HUGGINGFACE_ACCESS_TOKEN = process.env.HUGGING_FACE_ACCESS_TOKEN || '';

const HUGGINGFACE_DATASETS_DIR = 'datasets';
const HUGGINGFACE_DATASETS_REPO = 'datasets/google/xtreme';
// @see https://huggingface.co/datasets/google/xtreme/tree/main/MLQA.en.en
const HUGGINGFACE_DATASETS_PATHS = [
  { sourcePath: 'MLQA.en.en/test-00000-of-00001.parquet', destinationFileName: 'train.parquet' },
  { sourcePath: 'MLQA.en.en/validation-00000-of-00001.parquet', destinationFileName: 'test.parquet' },
];

const downloadDataset = async (accessToken: string, repo: string, sourcePath: string, destinationFilePath: string) => {
  console.log(`Downloading file "${sourcePath}" from "${repo}" to "${destinationFilePath}"...`);

  const blob = await downloadFile({ accessToken, repo, path: sourcePath });

  if (!blob) {
    throw new Error('Download failed');
  }

  const buffer = Buffer.from(await blob.arrayBuffer());

  await writeFile(destinationFilePath, buffer);

  console.log('Success!');
};

const downloadDatasets = async () => {
  for (const { sourcePath, destinationFileName } of HUGGINGFACE_DATASETS_PATHS) {
    const destinationFilePath = join(HUGGINGFACE_DATASETS_DIR, destinationFileName);

    await downloadDataset(HUGGINGFACE_ACCESS_TOKEN, HUGGINGFACE_DATASETS_REPO, sourcePath, destinationFilePath);
  }
}

downloadDatasets().
  then(() => {
    console.log('Done!');
  });
