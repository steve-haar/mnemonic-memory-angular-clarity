import * as https from 'https';
import * as fs from 'fs';
import * as AdmZip from 'adm-zip';
import * as readline from 'readline';

(async () => {
  await build();
})();

async function build() {
  const ipaWordsZipFilePath = './artifacts/ipa-words.zip';
  const ipaWordsTextFilePath = './artifacts/CMU.in.IPA.txt';
  const commonWordsTextFilePath = './artifacts/common-words.txt';
  const mnemonicMapJsonFilePath = './src/assets/mnemonic-map.json';
  const ipaWordsDownloadUrl = 'https://people.umass.edu/nconstan/CMU-IPA/CMU-in-IPA.zip';
  const commonWordsDownloadUrl = 'https://raw.githubusercontent.com/first20hours/google-10000-english/master/20k.txt';

  await downloadFile({ url: commonWordsDownloadUrl, targetPath: commonWordsTextFilePath });
  await downloadFile({ url: ipaWordsDownloadUrl, targetPath: ipaWordsZipFilePath });
  unzipFile({ filePath: ipaWordsZipFilePath, targetPath: './artifacts/' });

  const commonWordsMap = getCommonWordsMap(commonWordsTextFilePath);
  const mnemonicMap = await createMnemonicMapFromFile({ ipaWordsTextFilePath, commonWordsMap });

  await fs.writeFile(mnemonicMapJsonFilePath, stringifyWithSortedKeys(mnemonicMap), () => {});
  
  await fs.unlink(ipaWordsZipFilePath, () => {});
  await fs.unlink(ipaWordsTextFilePath, () => {});
  await fs.unlink(commonWordsTextFilePath, () => {});
}

async function downloadFile({ url, targetPath }: { url: string; targetPath: string; }) {
  return new Promise<void>(resolve => {
    https.get(url, resp => { resp.pipe(fs.createWriteStream(targetPath).on('close', resolve)); });
  });
}

function unzipFile({ filePath, targetPath }: { filePath: string; targetPath: string; }) {
  new AdmZip(filePath).extractAllTo(targetPath, true);
}

function getCommonWordsMap(filePath: string) {
  return fs.readFileSync(filePath, 'utf8')
    .split('\n')
    .reduce((map, word) => { map[word] = true; return map; }, { } as { [key: string]: boolean });
}

async function createMnemonicMapFromFile({ ipaWordsTextFilePath, commonWordsMap }: { ipaWordsTextFilePath: string, commonWordsMap: { [key: string]: boolean } }) {
  const fileStream = fs.createReadStream(ipaWordsTextFilePath);
  const lines = readline.createInterface({input: fileStream, crlfDelay: Infinity });
  
  const mnemonicMap = {} as { [key: string]: string[] };
  const phoneticMap = getPhoneticMap();
  
  for await (const line of lines) {
    const entry = line.split(',');
    const word = entry[0].trim().replace(/[^a-zA-Z]/g, '');
    const ipaText = entry[1]?.trim();

    if (commonWordsMap[word] && ipaText) {
      const mnemonic = convertIpaTextToMnemonic({ ipaText, phoneticMap });
  
      if (mnemonic) {
        if (mnemonicMap[mnemonic] === undefined) {
          mnemonicMap[mnemonic] = [];
        }

        if (mnemonicMap[mnemonic].includes(word) === false) {
          mnemonicMap[mnemonic].push(word);
        }
      }
    }
  }

  return mnemonicMap;
}

function getPhoneticMap() {
  const phoneticMap: { [key: number]: string[] } = {
    0: ['s', 'z'],
    1: ['t', 'd', 'θ', 'ð'],
    2: ['n', 'ŋ'],
    3: ['m'],
    4: ['r', 'ɹ', 'ɚ'],
    5: ['l'],
    6: ['ʃ', 'ʤ', 'ʒ'],
    7: ['k', 'g'],
    8: ['f', 'v'],
    9: ['p', 'b']
  };

  return Object.keys(phoneticMap)
    .reduce((map, number) => {
      phoneticMap[number].forEach(sound => { map[sound] = number; });
      return map;
    }, {});
}

function convertIpaTextToMnemonic({ ipaText, phoneticMap }: { ipaText: string; phoneticMap: { [key: string]: string; }; }) {
  ipaText = ipaText.replace('tʃ', 'ʃ');
  return Array.from(ipaText).map(sound => phoneticMap[sound]).join('');
}

function stringifyWithSortedKeys(obj: any) {
  return JSON.stringify(obj, Object.keys(obj).sort());
}
