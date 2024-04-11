import axios from "axios";
import dotenv from "dotenv";
import crypto from "crypto";
import fs from "fs";
import os from "os";
import path from "path";

dotenv.config();

const url = process.env.MEME_URL || "";

type Meme = {
  id: string;
  name: string;
  url: string;
  width: number;
  height: number;
  box_count: number;
  captions: number;
};

const fetchMemes = async (): Promise<Meme[]> => {
  const { data } = await axios({ method: "get", url });

  return data.data.memes;
};

const encrypt = (data: any, key: any, iv: any) => {
  const cipher = crypto.createCipheriv("aes-256-cbc", key, iv);
  let encryptedData = cipher.update(JSON.stringify(data), "utf-8", "hex");

  encryptedData += cipher.final("hex");

  return encryptedData;
};

const decrypt = (encryptedData: any, key: any, iv: any) => {
  const decipher = crypto.createDecipheriv("aes-256-cbc", key, iv);
  let decryptedData = decipher.update(encryptedData, "hex", "utf-8");

  decryptedData += decipher.final("utf-8");

  return JSON.parse(decryptedData);
};

const cache = async (data: any, directory: string, fileName: string) => {
  const tempDirectory = path.join(os.tmpdir(), directory);
  if (fs.existsSync(tempDirectory)) {
    fs.writeFileSync(path.join(tempDirectory, fileName), JSON.stringify(data));
  } else {
    fs.mkdirSync(tempDirectory, { recursive: true });
    fs.writeFileSync(path.join(tempDirectory, fileName), JSON.stringify(data));
  }

  console.log("cached file stored at:", path.join(tempDirectory, fileName));
};

const getMemesCount = (data: Meme[]) => {
  return data.length;
};

const filterMemes = (data: Meme[]) => {
  return data.filter((m) => {
    return m.name.toLowerCase().includes("the");
  });
};

const downloadMemeImage = async (directory: string, memes: Meme[]) => {
  const tempDirectory = path.join(os.tmpdir(), directory);
  const randomMeme = memes[Math.floor(Math.random() * memes.length)];

  console.log(path.join(tempDirectory, "meme.jpg"));

  const response = await axios({
    method: "get",
    responseType: "arraybuffer",
    url: randomMeme.url,
  });

  fs.writeFileSync(
    path.join(tempDirectory, process.env.RANDOM_IMG_FILE_NAME!),
    response.data
  );
};

const main = async () => {
  const { TMP_DIRECTORY, ENCRYPTED_FILE_NAME } = process.env;

  const memes = await fetchMemes();
  const key = crypto.randomBytes(32);
  const iv = crypto.randomBytes(16);
  const encryptedData = encrypt(memes, key, iv);

  /** Save encrypted data to cache */
  await cache(encryptedData, TMP_DIRECTORY!, ENCRYPTED_FILE_NAME!);

  let cachedEncrypt = fs.readFileSync(
    path.join(os.tmpdir(), TMP_DIRECTORY!, ENCRYPTED_FILE_NAME!),
    "utf-8"
  );
  cachedEncrypt = cachedEncrypt.slice(1, cachedEncrypt.length - 1);

  const decryptedData = decrypt(cachedEncrypt, key, iv);

  console.log("Total number of memes got", decryptedData.length);

  const filteredMemes = filterMemes(decryptedData);

  console.log(
    "Number of memes with `The` (case insensitive)",
    filteredMemes.length
  );

  await downloadMemeImage(TMP_DIRECTORY!, decryptedData);
};

main().catch((err) => console.error("An error has occured", err));

export {
  fetchMemes,
  encrypt,
  decrypt,
  cache,
  getMemesCount,
  filterMemes,
  downloadMemeImage,
};
