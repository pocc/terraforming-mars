import { BioengineeringEnclosure } from "../../../src/cards/ares/BioengineeringEnclosure";
import { Color } from "../../../src/Color";
import { Game } from "../../../src/Game";
import { Player } from "../../../src/Player";
import { IProjectCard } from "../../../src/cards/IProjectCard";
import { CardName } from "../../../src/CardName";
import { Tags } from "../../../src/cards/Tags";
import { CardType } from "../../../src/cards/CardType";
import { ResourceType } from "../../../src/ResourceType";
import { expect } from "chai";

describe("BioengineeringEnclosure", function () {
  let card : BioengineeringEnclosure, player : Player, game : Game;

  const scienceTagCard: IProjectCard = {
    name: CardName.ACQUIRED_COMPANY,
    cardType: CardType.ACTIVE,
    cost: 0,
    tags: [Tags.SCIENCE],
    play: () => undefined
  };

  const animalHost: IProjectCard = {
    name: CardName.ACQUIRED_SPACE_AGENCY,
    cardType: CardType.ACTIVE,
    cost: 0,
    tags: [],
    resourceType: ResourceType.ANIMAL,
    resourceCount: 0,
    play: () => undefined
  }

  beforeEach(function() {
    card = new BioengineeringEnclosure();
    player = new Player("test", Color.BLUE, false);
    game = new Game("foobar", [player, player], player);
  });

  it("Can't play without a science tag", () => {
    expect(card.canPlay(player, game)).is.false;
    player.playCard(game, scienceTagCard);
    expect(card.canPlay(player, game)).is.true;
  });

  it("Play", () => {
    expect(card.resourceCount).eq(0);
    card.play(player, game);
    expect(card.resourceCount).eq(2);
  });

  it("Can't move animal if it's empty", () => {
    card.play(player, game);
    player.playCard(game, animalHost);
    card.resourceCount = 0;
    expect(card.canAct(player)).is.false;
  });

  it("Can't move animal if theres not another card", () => {
    card.play(player, game);
    expect(card.canAct(player)).is.false;
  });

  it("Move animal", () => {
    // Set up the cards.
    player.playCard(game, animalHost);
    player.playCard(game, card);

    // Initial expectations that will change after playing the card.
    expect(card.canAct(player)).is.true;
    expect(card.resourceCount).eq(2);
    expect(animalHost.resourceCount).eq(0);
    expect(game.interrupts).is.empty;

    card.action(player, game);

    // No interrupts because there's only one card that can accept the animals.
    expect(game.interrupts).is.empty;
    expect(card.resourceCount).eq(1);
    expect(animalHost.resourceCount).eq(1);
  });
});
