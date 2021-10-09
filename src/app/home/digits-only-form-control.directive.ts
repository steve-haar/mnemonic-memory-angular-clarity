import { Directive, HostListener, OnDestroy, OnInit } from "@angular/core";
import { NgControl } from "@angular/forms";
import { EMPTY, Subscription } from "rxjs";
import { tap } from "rxjs/operators";

const mask = /\D/g;

@Directive({ selector: '[digitsOnly]' })
export class DigitsOnlyFormControlDirective implements OnInit, OnDestroy {
  private subscriptions: Subscription[] = [];

  constructor(private readonly ngControl: NgControl) {
  }

  ngOnInit() {
    this.subscriptions.push(this.applyMaskOnValueChange().subscribe());
  }

  ngOnDestroy() {
    this.subscriptions.forEach(subscription => { subscription.unsubscribe(); });
  }

  private applyMaskOnValueChange() {
    return this.ngControl.valueChanges?.pipe(
      tap(value => {
        const masked = value.replace(mask, '');

        if (value !== masked) {
          this.ngControl.control?.setValue(masked);
        }
      })
    ) || EMPTY;
  }
}
