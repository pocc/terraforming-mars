
import Vue from "vue";
import { HowToPay } from "../inputs/HowToPay";
import { PaymentWidgetMixin } from "./PaymentWidgetMixin";
import { PreferencesManager } from "./PreferencesManager";

interface SelectHowToPayModel {
    heat: number;
    megaCredits: number;
    steel: number;
    titanium: number;
    microbes: number;
    floaters: number;
    warning: string | undefined;
}

export const SelectHowToPay = Vue.component("select-how-to-pay", {
    props: ["player", "playerinput", "onsave", "showsave", "showtitle"],
    data: function () {
        return {
            cost: 0,
            heat: 0,
            megaCredits: 0,
            steel: 0,
            titanium: 0,
            microbes: 0,
            floaters: 0,
            warning: undefined
        } as SelectHowToPayModel;
    },
    mixins: [PaymentWidgetMixin],
    mounted: function () {
      let app = this;
      Vue.nextTick(function () {
        app.$data.isResearchPhase = app.playerinput.title === "Select how to pay for cards";
        app.setInitialCost();
        app.$data.megaCredits = (app as any).getMegaCreditsMax();
        
        app.setDefaultSteelValue();
        app.setDefaultTitaniumValue();
        app.setDefaultHeatValue();
      });
    },
    methods: {
        hasWarning: function () {
            return this.$data.warning !== undefined;
        },
        setInitialCost: function() {
          if (this.$data.isResearchPhase) {
            this.playerinput.amount = this.player.cardCost * 4;
          }
          
          this.$data.cost = this.playerinput.amount;
        },
        setDefaultSteelValue: function() {
          // automatically use available steel to pay if not enough MC
          if (!this.canAffordWithMcOnly() && this.canUseSteel()) {
              let requiredSteelQty = Math.ceil(Math.max(this.$data.cost - this.player.megaCredits, 0) / this.player.steelValue);
              
              if (requiredSteelQty > this.player.steel) {
                  this.$data.steel = this.player.steel;
              } else {
                  // use as much steel as possible without overpaying by default
                  let currentSteelValue = requiredSteelQty * this.player.steelValue;
                  while (currentSteelValue <= this.$data.cost - this.player.steelValue && requiredSteelQty < this.player.steel) {
                      requiredSteelQty++;
                      currentSteelValue = requiredSteelQty * this.player.steelValue;
                  }

                  this.$data.steel = requiredSteelQty;
              }
              
              let discountedCost = this.$data.cost - (this.$data.steel * this.player.steelValue);
              this.$data.megaCredits = Math.max(discountedCost, 0);
          } else {
              this.$data.steel = 0;
          }
        },
        setDefaultTitaniumValue: function() {
          // automatically use available titanium to pay if not enough MC
          if (!this.canAffordWithMcOnly() && this.canUseTitanium()) {
              let requiredTitaniumQty = Math.ceil(Math.max(this.$data.cost - this.player.megaCredits - (this.$data.steel * this.player.steelValue), 0) / this.player.titaniumValue);
              
              if (requiredTitaniumQty > this.player.titanium) {
                  this.$data.titanium = this.player.titanium;
              } else {
                  // use as much titanium as possible without overpaying by default
                  let currentTitaniumValue = requiredTitaniumQty * this.player.titaniumValue;
                  while (currentTitaniumValue <= this.$data.cost - this.player.titaniumValue && requiredTitaniumQty < this.player.titanium) {
                      requiredTitaniumQty++;
                      currentTitaniumValue = requiredTitaniumQty * this.player.titaniumValue;
                  }

                  this.$data.titanium = requiredTitaniumQty;
              }
              
              let discountedCost = this.$data.cost - (this.$data.steel * this.player.steelValue) - (this.$data.titanium * this.player.titaniumValue);
              this.$data.megaCredits = Math.max(discountedCost, 0);
          } else {
              this.$data.titanium = 0;
          }
        },
        setDefaultHeatValue: function() {
          // automatically use available heat for Helion if not enough MC
          if (!this.canAffordWithMcOnly() && this.canUseHeat()) {
              this.$data.heat =  Math.max(this.$data.cost - this.player.megaCredits - (this.$data.steel * this.player.steelValue) - (this.$data.titanium * this.player.titaniumValue), 0);
          } else {
              this.$data.heat = 0;
          }
          let discountedCost = this.$data.cost - (this.$data.steel * this.player.steelValue) - (this.$data.titanium * this.player.titaniumValue) - this.$data.heat;
          this.$data.megaCredits = Math.max(discountedCost, 0);
        },
        canAffordWithMcOnly: function() {
          return this.player.megaCredits >= this.$data.cost;
        },
        canUseHeat: function () {
          return this.playerinput.canUseHeat && this.player.heat > 0;
        },
        canUseSteel: function () {
          return this.playerinput.canUseSteel && this.player.steel > 0;
        },
        canUseTitanium: function () {
          return this.playerinput.canUseTitanium && this.player.titanium > 0;
        },
        saveData: function () {
            const htp: HowToPay = {
                heat: this.$data.heat,
                megaCredits: this.$data.megaCredits,
                steel: this.$data.steel,
                titanium: this.$data.titanium,
                microbes: 0,
                floaters: 0,
                isResearchPhase: this.$data.isResearchPhase
            };

            if (htp.megaCredits > this.player.megaCredits) {
                this.$data.warning = "You don't have that many mega credits";
                return;
            }
            if (htp.heat > this.player.heat) {
                this.$data.warning = "You don't have enough heat";
                return;
            }
            if (htp.titanium > this.player.titanium) {
                this.$data.warning = "You don't have enough titanium";
                return;
            }
            if (htp.steel > this.player.steel) {
                this.$data.warning = "You don't have enough steel";
                return;
            }

            const requiredAmt =  this.playerinput.amount;
            const totalSpentAmt = htp.heat + htp.megaCredits + (htp.steel * this.player.steelValue) + (htp.titanium * this.player.titaniumValue) + (htp.microbes * 2) + (htp.floaters * 3);

            if (requiredAmt > 0 && totalSpentAmt < requiredAmt && !htp.isResearchPhase) {
                this.$data.warning = "Haven't spent enough";
                return;
            }

            if (htp.isResearchPhase && requiredAmt === 0) {
              htp.heat = 0;
              htp.megaCredits = 0;
            }

            if (requiredAmt > 0 && totalSpentAmt > requiredAmt) {
                let diff = totalSpentAmt - requiredAmt;
                if (htp.titanium && diff >= this.player.titaniumValue) {
                    this.$data.warning = "You cannot overspend titanium";
                    return;
                }
                if (htp.steel && diff >= this.player.steelValue) {
                    this.$data.warning = "You cannot overspend steel";
                    return;
                }
                if (htp.heat && diff >= 1) {
                    this.$data.warning = "You cannot overspend heat";
                    return;
                }
                if (htp.megaCredits && diff >= 1) {
                    this.$data.warning = "You cannot overspend megaCredits";
                    return;
                }
            }
            
            const showAlert = PreferencesManager.loadValue("show_alerts") === "1";

            if (requiredAmt > 0 && totalSpentAmt > requiredAmt && showAlert) {
              let diff = totalSpentAmt - requiredAmt;

              if (confirm("Warning: You are overpaying by " + diff + " MC")) {
                this.onsave([[JSON.stringify(htp)]]);    
              } else {
                this.$data.warning = "Please adjust payment amount";
                return;
              }
            } else {
              this.onsave([[JSON.stringify(htp)]]);
            }
        }
    },
    template: `<div class="payments_cont">
  <section v-trim-whitespace>

    <h3 class="payments_title">{{playerinput.title}}</h3>

    <div class="payments_type input-group" v-if="playerinput.canUseSteel">

      <i class="resource_icon resource_icon--steel payments_type_icon" title="Pay by Steel"></i>
      <button class="btn btn-primary" v-on:click="reduceValue('steel', 1)" :class="getCssClassFor('<', 'steel')"><i class="icon icon-minus" /></button>
      <input class="form-input form-inline payments_input" v-model.number="steel" />
      <button class="btn btn-primary" v-on:click="addValue('steel', 1)" :class="getCssClassFor('>', 'steel')"><i class="icon icon-plus" /></button>
      <button class="btn btn-primary max_button" v-on:click="setMaxValue('steel')">MAX</button>
    </div>

    <div class="payments_type input-group" v-if="playerinput.canUseTitanium">
      <i class="resource_icon resource_icon--titanium payments_type_icon" title="Pay by Titanium"></i>
      <button class="btn btn-primary" v-on:click="reduceValue('titanium', 1)" :class="getCssClassFor('<', 'titanium')"><i class="icon icon-minus" /></button>
      <input class="form-input form-inline payments_input" v-model.number="titanium" />
      <button class="btn btn-primary" v-on:click="addValue('titanium', 1)" :class="getCssClassFor('>', 'titanium')"><i class="icon icon-plus" /></button>
      <button class="btn btn-primary max_button" v-on:click="setMaxValue('titanium')">MAX</button>
    </div>

    <div class="payments_type input-group" v-if="playerinput.canUseHeat">
      <i class="resource_icon resource_icon--heat payments_type_icon" title="Pay by Heat"></i>
      <button class="btn btn-primary" v-on:click="reduceValue('heat', 1)" :class="getCssClassFor('<', 'heat')"><i class="icon icon-minus" /></button>
      <input class="form-input form-inline payments_input" v-model.number="heat" />
      <button class="btn btn-primary" v-on:click="addValue('heat', 1)" :class="getCssClassFor('>', 'heat')"><i class="icon icon-plus" /></button>
      <button class="btn btn-primary max_button" v-on:click="setMaxValue('heat')">MAX</button>
    </div>

    <div class="payments_type input-group">
      <i class="resource_icon resource_icon--megacredits payments_type_icon" title="Pay by Megacredits"></i>
      <button class="btn btn-primary" v-on:click="reduceValue('megaCredits', 1)" :class="getCssClassFor('<', 'megaCredits')"><i class="icon icon-minus" /></button>
      <input class="form-input form-inline payments_input" v-model.number="megaCredits" />
      <button class="btn btn-primary" v-on:click="addValue('megaCredits', 1)" :class="getCssClassFor('>', 'megaCredits')"><i class="icon icon-plus" /></button>
    </div>

    <div v-if="hasWarning()" class="tm-warning">
      <label class="label label-error">{{ warning }}</label>
    </div>

    <div v-if="showsave === true" class="payments_save">
      <button class="btn btn-lg btn-primary" v-on:click="saveData">{{playerinput.buttonLabel}}</button>
    </div>

  </section>
</div>`
});

