import { Component, OnDestroy, OnInit } from '@angular/core';
import { FormControl } from '@angular/forms';
import { BehaviorSubject, combineLatest, forkJoin, Observable, Subscription } from 'rxjs';
import { debounceTime, map, tap } from 'rxjs/operators';
import { MnemonicWordFinderService, MnemonicWord } from './mnemonic-word-finder.service';

const maxPotentialWords = 100;

@Component({
  selector: 'home',
  templateUrl: './home.component.html',
  styleUrls: ['./home.component.scss']
})
export class HomeComponent implements OnInit, OnDestroy {
  digitsControl = new FormControl('');
  potentialMnemonicWords: Observable<MnemonicWord[]>;
  chosenMnemonicWords = new BehaviorSubject<MnemonicWord[]>([]);
  chosenDigitsLength = this.chosenMnemonicWords.pipe(map(words => countDigitsInMnemonicWords(words)));

  private digitsControlValueChanges = this.digitsControl.valueChanges.pipe(map<any, string>(value => value));
  private subscriptions: Subscription[] = [];
  
  constructor(private mnemonicWordFinderService: MnemonicWordFinderService) {
    this.potentialMnemonicWords = this.getWords();
  }

  ngOnInit() {
    this.subscriptions.push(forkJoin([
      this.removeWordsWhenDigitsChange(),
      this.mnemonicWordFinderService.initialize().pipe(
        tap(() => this.initializeForm())
      )
    ]).subscribe());
  }

  ngOnDestroy() {
    this.subscriptions.forEach(subscription => subscription.unsubscribe());
  }

  solve() {
    const words = [...this.chosenMnemonicWords.value];
    const value: string = this.digitsControl.value;
    let chosenDigitsLength = countDigitsInMnemonicWords(words);

    while (chosenDigitsLength < value.length) {
      const word = this.mnemonicWordFinderService.getWords(value.substr(chosenDigitsLength))[0];

      if (!word) {
        break;
      }

      words.push(word);
      chosenDigitsLength += word.digits.length;
    }

    this.chosenMnemonicWords.next(words);
    this.digitsControl.setValue(this.digitsControl.value);
  }

  clear() {
    this.chosenMnemonicWords.next([]);
  }

  addWord(mnemonicWord: MnemonicWord) {
    this.chosenMnemonicWords.next([...this.chosenMnemonicWords.value, mnemonicWord]);
  }

  removeWord(mnemonicWord: MnemonicWord) {
    const index = this.chosenMnemonicWords.value.indexOf(mnemonicWord);
    this.chosenMnemonicWords.next(this.chosenMnemonicWords.value.slice(0, index));
  }

  private initializeForm() {
    const initialWords = ['turtle', 'banjo', 'lime', 'lava'];
    const initialDigits = '1415926535897932384626433832795028841971693993751058209749445923078164062862089986280348253421170679';

    const words: MnemonicWord[] = [];
    let chosenDigitsLength = countDigitsInMnemonicWords(words);

    for (let i = 0; i < initialWords.length; i++) {
      const potentialWords = this.mnemonicWordFinderService.getWords(initialDigits.substr(chosenDigitsLength));
      const word = potentialWords.find(w => w.word === initialWords[i]);

      if (!word) {
        break;
      }

      words.push(word);
      chosenDigitsLength += word.digits.length;
    }

    this.digitsControl.setValue(initialDigits);
    this.chosenMnemonicWords.next(words);
  }

  private getWords() {
    return combineLatest([this.digitsControlValueChanges, this.chosenMnemonicWords]).pipe(
      debounceTime(0),
      map(([value, words]) => {
        const chosenDigitsLength = countDigitsInMnemonicWords(words);
        return this.mnemonicWordFinderService.getWords(value.substr(chosenDigitsLength), maxPotentialWords);
      })
    )
  }

  removeWordsWhenDigitsChange() {
    return this.digitsControlValueChanges.pipe(
      tap(value => {
        let chosenDigitsLength = 0;
        const invalidChosenWord = this.chosenMnemonicWords.value.findIndex(word => (chosenDigitsLength += word.digits.length) > value.length);
        if (invalidChosenWord >= 0) {
          this.chosenMnemonicWords.next(this.chosenMnemonicWords.value.slice(0, invalidChosenWord));
        }
      })
    )
  }
}

function countDigitsInMnemonicWords(mnemonicWords: MnemonicWord[]) {
  return mnemonicWords.reduce((sum, word) => sum + word.digits.length, 0);
}
