import { Pinecone } from '@pinecone-database/pinecone';
import { createHash } from 'crypto';
import OpenAI from 'openai';

const OPENAI_API_KEY = process.env.OPENAI_API_KEY || '';
const OPENAI_MODEL = 'text-embedding-3-large';

const PINECONE_API_KEY = process.env.PINECONE_API_KEY || '';
const PINECONE_DIMENSION = 3072; // Must match the embedding length (OpenAI model output).
const PINECONE_INDEX_NAME = 'semantic-search-test';
const PINECONE_METRIC = 'cosine';
const PINECONE_NAMESPACE = 'default';
const PINECONE_SERVERLESS_CLOUD = 'aws';
const PINECONE_SERVERLESS_REGION = 'us-east-1';

const openai = new OpenAI({
  apiKey: OPENAI_API_KEY,
});

const pinecone = new Pinecone({
  apiKey: PINECONE_API_KEY,
});

const getEmbeddings = async (texts: string[]) => {
  console.log(`Getting embeddings for ${texts.length} text(s)...`);

  const { data } = await openai.embeddings.create({
    input: texts,
    model: OPENAI_MODEL,
  });

  return data.map(({ embedding }) => embedding);
};

const md5Hash = (s: string): string => createHash('md5').update(s).digest('hex');

const prepareForPinecone = async (texts: string[]) => {
  console.log(`Preparing ${texts.length} text(s) for Pinecone...`);

  const dateUploaded = Date.now();
  const embeddings = await getEmbeddings(texts);

  return texts.map((text, index) => ({
    id: md5Hash(text),
    values: embeddings[index],
    metadata: {
      text,
      dateUploaded,
    },
  }));
};

const uploadToPinecone = async (texts: string[]) => {
  console.log(`Uploading ${texts.length} text(s) to Pinecone...`);

  const preparedTexts = await prepareForPinecone(texts);

  const index = pinecone.index(PINECONE_INDEX_NAME);

  return index.namespace(PINECONE_NAMESPACE).upsert(preparedTexts);
};

const createIndexIfNotExists = async () => {
  const { indexes } = await pinecone.listIndexes();

  if (!indexes) {
    throw new Error('Indexes missing');
  }

  const existing = indexes.find(({ name }) => name === PINECONE_INDEX_NAME);

  if (existing) {
    console.log(`Index "${PINECONE_INDEX_NAME}" already exists`, existing);
    return;
  }

  console.log(`Creating index "${PINECONE_INDEX_NAME}"...`);

  return pinecone.createIndex({
    name: PINECONE_INDEX_NAME,
    dimension: PINECONE_DIMENSION,
    metric: PINECONE_METRIC,
    spec: {
      serverless: {
        cloud: PINECONE_SERVERLESS_CLOUD,
        region: PINECONE_SERVERLESS_REGION,
      },
    },
  });
};

createIndexIfNotExists().
  then(() => {
    return uploadToPinecone(['Hello, world!']);
  }).
  then(() => {
    console.log('Done!');
  });
