import { Game } from "../Game";
import { PlayerInput } from "../PlayerInput";
import { Player, PlayerId } from "../Player";
import { PlayerInterrupt } from "./PlayerInterrupt";
import { OrOptions } from "../inputs/OrOptions";
import { SelectOption } from "../inputs/SelectOption";

export class SelectParty implements PlayerInterrupt {
    public playerInput: PlayerInput;
    constructor(
        public player: Player,
        public game: Game,
        public title: string = "Select where to send a delegate",
        public nbr: number = 1,
        public replace: "NEUTRAL" | PlayerId | undefined = undefined,
        public price: number | undefined = undefined,
        public fromLobby: boolean = true
    ){
        const sendDelegate = new OrOptions();
        // Change the default title
        sendDelegate.title = title;
        sendDelegate.buttonLabel = "Send delegate";
        let parties;
        if (replace) {
          parties = game.turmoil!.parties.filter(party => {
              if (party.delegates.length < 2) return false;

              for (const delegate of party.delegates) {
                if (delegate !== replace) continue;
                if (delegate !== party.partyLeader) return true;
                return party.delegates.filter((delegate) => delegate === replace).length > 1;
              }
              return false;
          });
        }
        else {
          parties = game.turmoil!.parties;
        }
        sendDelegate.options = parties.map(party => new SelectOption(
              party.name + " - (" + party.description + ")",
              "Send delegate",
              () => {
                if (price) {
                  game.addSelectHowToPayInterrupt(player, price, false, false, "Select how to pay for send delegate action");
                }

                if (nbr > 1 && fromLobby) { // For card: Cultural Metropolis
                  game.turmoil?.sendDelegateToParty(player.id, party.name, game, true);
                  for (let i = 0; i < nbr - 1; i++) {
                    game.turmoil?.sendDelegateToParty(player.id, party.name, game, false);
                  }
                } else {
                  for (let i = 0; i < nbr; i++) {
                    if (replace) {
                      game.turmoil?.removeDelegateFromParty(replace, party.name, game);
                    }
                  game.turmoil?.sendDelegateToParty(player.id, party.name, game, fromLobby);
                }
                }

                
                game.log("${0} sent ${1} delegate(s) in ${2} area", b => b.player(player).number(nbr).party(party));
                return undefined;
              }
            ));
        this.playerInput = sendDelegate;
    };
}    
