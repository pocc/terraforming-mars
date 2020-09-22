import { AresSpaceBonus } from "../../ares/AresSpaceBonus";
import { CardName } from "../../CardName";
import { Game } from "../../Game";
import { SelectSpace } from "../../inputs/SelectSpace";
import { ISpace } from "../../ISpace";
import { Player } from "../../Player";
import { Resources } from "../../Resources";
import { ResourceType } from "../../ResourceType";
import { SpaceBonus } from "../../SpaceBonus";
import { SpaceType } from "../../SpaceType";
import { TileType } from "../../TileType";
import { CardType } from "../CardType";
import { IProjectCard } from "../IProjectCard";
import { Tags } from "../Tags";

export class BiofertilizerFacility implements IProjectCard {
    public cost: number = 26;
    public tags: Array<Tags> = [Tags.MICROBES, Tags.STEEL];
    public cardType: CardType = CardType.AUTOMATED;
    public name: CardName = CardName.BIOFERTILIZER_FACILITY;

    public canPlay(player: Player, _game: Game): boolean {
        return player.getTagCount(Tags.SCIENCE) >= 1;
    }

    public play(player: Player, game: Game) {
        player.setProduction(Resources.PLANTS, 1);

        game.addSelectResourceCardInterrupt(
            player,
            2,
            ResourceType.MICROBE,
            player.getResourceCards(ResourceType.MICROBE)
        );

        return new SelectSpace(
            "Select space for special city tile",
            game.board.getAvailableSpacesForCity(player),
            (space: ISpace) => {
                game.addTile(player, SpaceType.LAND, space, {
                    tileType: TileType.BIOFERTILIZER_FACILITY,
                    card: this.name,
                });
                space.adjacency = {
                    bonus: [SpaceBonus.PLANT, AresSpaceBonus.MICROBE],
                };
                return undefined;
            }
        );
    }
}
