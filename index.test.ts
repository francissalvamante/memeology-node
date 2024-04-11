import {
  cache,
  decrypt,
  downloadMemeImage,
  encrypt,
  fetchMemes,
  filterMemes,
  getMemesCount,
} from "./index";
import crypto from "crypto";
import fs from "fs";
import os from "os";
import path from "path";

describe("Memeology", () => {
  beforeEach(() => {
    process.env.MEME_URL = "https://api.imgflip.com/get_memes";
  });

  afterEach(() => {
    delete process.env.MEME_URL;
  });

  it("should get memes from meme url", async () => {
    const memes = await fetchMemes();
    expect(memes).not.toBeNull();
  });

  it("should encrypt and decrypt data", async () => {
    const memes = await fetchMemes();

    const key = crypto.randomBytes(32);
    const iv = crypto.randomBytes(16);

    const encryptedData = encrypt(memes, key, iv);
    const decryptedData = decrypt(encryptedData, key, iv);

    expect(decryptedData).toEqual(memes);
  });

  it("should be able to cache data", async () => {
    const memes = await fetchMemes();
    const directory = "memeology";
    const filePath = "memes.json";

    cache(memes, directory, filePath);

    const cachedData = JSON.parse(
      fs.readFileSync(path.join(os.tmpdir(), directory, filePath), "utf-8")
    );

    expect(cachedData).toEqual(memes);
  });

  it("should get the total number of memes got", async () => {
    const memes = await fetchMemes();

    const count = getMemesCount(memes);

    expect(count).toBe(100);
  });

  it("should be able to filter out memes with `the` in the name", async () => {
    const memes = await fetchMemes();

    const filteredMemes = filterMemes(memes);

    expect(filteredMemes.length).toEqual(12);
  });

  it("should be able to get cached memes and download random meme to temp directory", async () => {
    const memes = await fetchMemes();
    downloadMemeImage("memeology", memes);

    const cachedImage = fs.readFileSync(
      path.join(os.tmpdir(), "memeology", "meme.jpg")
    );

    expect(cachedImage).not.toBeNull();
  });
});
