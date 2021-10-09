import { HttpClient } from '@angular/common/http';
import { Injectable } from '@angular/core';
import { tap } from 'rxjs/operators';

export interface MnemonicWord {
  digits: string;
  word: string;
}

@Injectable({ providedIn: 'root' })
export class MnemonicWordFinderService {
  private mnemonicMap?: { [key: string]: string[] };

  constructor(private httpClient: HttpClient) {
  }

  initialize() {
    return this.httpClient.get("/assets/mnemonic-map.json").pipe(
      tap(data => { this.mnemonicMap = data as any; })
    );
  }

  getWords(digits: string, maxWords?: number) {
    const words: MnemonicWord[] = [];

    if (this.mnemonicMap) {
      for (let i = digits.length; i > 0; i--) {
        const subDigits = digits.substr(0, i);
        const wordsForSubDigits = this.mnemonicMap[subDigits] || [];
  
        for (let j = 0; j < wordsForSubDigits.length; j++) {
          words.push({ digits: subDigits, word: wordsForSubDigits[j] });

          if (words.length === maxWords) {
            return words;
          }
        }
      }
    }

    return words;
  }
}
