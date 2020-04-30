/*
 *  ++++++++++++++++++++++++++++++++++++++++++++++++++++++++++++++++++++++++++++++
 *  Copyright 2019 Amazon.com, Inc. or its affiliates. All Rights Reserved.
 *  SPDX-License-Identifier: Apache-2.0
 *  ++++++++++++++++++++++++++++++++++++++++++++++++++++++++++++++++++++++++++++++
 */

const Alexa = require('ask-sdk-core');
const WordConstants = require('./words.js');
const GameOn = require('./gameOn.js');

const {DynamoDbPersistenceAdapter} = require('ask-sdk-dynamodb-persistence-adapter');
const persistenceAdapter = new DynamoDbPersistenceAdapter({
  tableName: 'WordWordLitePersistence',
  createTable: true
});

const PlayGameRequestHandler = {
  canHandle(handlerInput) {
    this.handlerInput = handlerInput;
    return this.requestType === 'IntentRequest' && this.intentName === 'PLAY_GAME_INTENT';
  },
  async handle(handlerInput) {
    this.handlerInput = handlerInput;
    const attributes = this.getSessionAttributesManager;
    const player = await this.getPersistentAttributesManager;

    // Update score from count of user utterances.
    const matchWord = attributes.currentWord.toLowerCase();
    const utteranceCount = Object.values(this.slots)
      .filter((slotValue) => typeof slotValue.value !== 'undefined' && slotValue.value.toLowerCase() === matchWord)
      .length;
    await GameOn.submitScore(player, utteranceCount);

    // Construct Alexa response dialog.
    const playerScore = await GameOn.getPlayerScore(player);
    const speechText = `Has dicho <voice name="Enrique"> <break time=".1s"/> 
    ${attributes.currentWord} </voice> <break time=".1s"/> ${utteranceCount} veces. Tu posición actual en el torneo es <break time=".1s"/> ${playerScore.rank}. Tu siguiente palabra es <voice name="Enrique"> <break time=".1s"/> ${attributes.nextWord} </voice>`;
    const repromptText = `Tu siguiente palabra es <break time=".1s"/> ${attributes.nextWord}`;
    const displayText = `Has dicho ${attributes.currentWord} ${utteranceCount} veces. Tu posición actual es ${playerScore.rank}. Tu siguiente palabra es ${attributes.nextWord}`;

    // Initialize the next game session.
    attributes.currentWord = attributes.nextWord;
    attributes.nextWord = WordConstants.getWord();
    handlerInput.attributesManager.setSessionAttributes(attributes);
    return handlerInput.responseBuilder
      .speak(speechText)
      .reprompt(repromptText)
      .withSimpleCard('Repite la palabra', displayText)
      .getResponse();
  }
};

const LaunchRequestHandler = {
  canHandle(handlerInput) {
    this.handlerInput = handlerInput;
    return this.requestType === 'LaunchRequest';
  },
  async handle(handlerInput) {
    this.handlerInput = handlerInput;
    const attributes = this.getSessionAttributesManager;
    let player = await this.getPersistentAttributesManager;

    console.log("Si llego aqui");

    // Bootstrap new users by registering them with GameOn and persisting to DynamoDb
    if (Object.keys(player).length === 0) {
      player = await GameOn.newPlayer();
    } else {
      player = await GameOn.refreshPlayerSession(player);
    }
    this.setPersistentAttributes(player);
    await this.savePersistentAttributes();

    // Initialize a game session for the player.
    attributes.currentWord = WordConstants.getWord();
    attributes.nextWord = WordConstants.getWord();
    this.setSessionAttributes(attributes);
    const profile = GameOn.lookupPlayerProfile(player.externalPlayerId);
    await GameOn.submitScore(player, 0);

    // Construct Alexa response dialog.
    const speechText = `Bienvenido a mi primer juego de palabras. El juego donde compites para repetir una palabra la mayor cantidad de veces. Tu nombre es <break time=".1s"/> ${profile.name}. Cuando estés listo para comenzar, solo di Alexa, y dices la palabra <voice name="Enrique"> <break time=".1s"/> ${attributes.currentWord} </voice> tantas veces como sea posible.`;
    const repromptText = `Para comenzar solo di alexa, y la palabra <break time=".1s"/> ${attributes.currentWord} tantas veces como sea posible.`;
    const displayText = `Hola! ${profile.name} para comenzar solo di Alexa, y di la palabra ${attributes.currentWord} tantas veces como sea posible.`;
    return handlerInput.responseBuilder
      .speak(speechText)
      .reprompt(repromptText)
      .withSimpleCard('Mi primer juego de palabras', displayText)
      .getResponse();
  }
};

const HelpIntentHandler = {
  canHandle(handlerInput) {
    this.handlerInput = handlerInput;
    return this.requestType === 'IntentRequest' && this.intentName === 'AMAZON.HelpIntent';
  },
  handle(handlerInput) {
    const speechText = 'Las reglas son muy fáciles, te doy una palabra y simplemente la repites tantas veces como puedas, tan rápido como puedas. ¿Estas listo para jugar?. Dime Alexa, y repita la palabra tantas veces como puedas, también me puedes preguntar en que posición estás con respecto a los demás competidores.';
    const displayText = 'Para comenzar di Alexa, y di la palabra tantas veces como puedas.';
    return handlerInput.responseBuilder
      .speak(speechText)
      .reprompt(speechText)
      .withSimpleCard('Mi primer juego de palabras', displayText)
      .getResponse();
  }
};
const CancelAndStopIntentHandler = {
  canHandle(handlerInput) {
    this.handlerInput = handlerInput;
    return this.requestType === 'IntentRequest'
      && (this.intentName === 'AMAZON.CancelIntent'
        || this.intentName === 'AMAZON.StopIntent');
  },
  handle(handlerInput) {
    const speechText = 'Regresa pronto por otra ronda. Adios';
    return handlerInput.responseBuilder
      .speak(speechText)
      .withSimpleCard('Mi primer juego de palabras', speechText)
      .getResponse();
  }
};
const SessionEndedRequestHandler = {
  canHandle(handlerInput) {
    this.handlerInput = handlerInput;
    return this.requestType === 'SessionEndedRequest';
  },
  handle(handlerInput) {
    return handlerInput.responseBuilder.getResponse();
  }
};

const LeaderboardRequestHandler = {
  canHandle(handlerInput) {
    this.handlerInput = handlerInput;
    return this.requestType === 'IntentRequest'
      && this.intentName === 'SHOW_LEADERBOARD_INTENT';
  },
  async handle(handlerInput) {
    this.handlerInput = handlerInput;
    const attributes = this.getSessionAttributesManager;
    const player = await this.getPersistentAttributesManager;
    const leaderboardDirective = await GameOn.getLeaderboard(player);
    const playerScore = await GameOn.getPlayerScore(player);
    attributes.currentWord = WordConstants.getWord();
    attributes.nextWord = WordConstants.getWord();
    this.setSessionAttributes(attributes);
    const speechText = `Tu posición actual en el torneo es <break time=".1s"/> ${playerScore.rank}. 
Para continuar jugando, solo dime Alexa, y repite la palabra <voice name="Enrique"> <break time=".1s"/> ${attributes.currentWord} </voice> Tantas veces como puedas.`;
    return handlerInput.responseBuilder
      .speak(speechText)
      .addDirective(leaderboardDirective)
      .getResponse();
  }
};

const IntentReflectorHandler = {
  canHandle(handlerInput) {
    this.handlerInput = handlerInput;
    return this.requestType === 'IntentRequest';
  },
  handle(handlerInput) {
    const speechText = '';
    return handlerInput.responseBuilder
      .speak(speechText)
      .getResponse();
  }
};

const ErrorHandler = {
  canHandle() {
    return true;
  },
  handle(handlerInput, error) {
    console.log(`~~~~ Error handled: ${error.message}`);
    const speechText = 'Lo siento, No puedo entender lo que dijiste, por favor intenta de nuevo';

    return handlerInput.responseBuilder
      .speak(speechText)
      .reprompt(speechText)
      .withSimpleCard('Word Repeat', speechText)
      .getResponse();
  }
};

let EventHandlerInput = {
  get requestType() {
    return this.request.type;
  },
  get intent() {
    return this.request.intent || {};
  },
  get slots() {
    return this.intent.slots;
  },
  get intentName() {
    return this.intent.name;
  },
  get input() {
    return this.handlerInput || {};
  },
  get envelope() {
    return this.handlerInput.requestEnvelope || {};
  },
  get request() {
    return this.envelope.request || {};
  },
  get getSessionAttributesManager() {
    return this.handlerInput.attributesManager.getSessionAttributes() || {};
  },
  get getPersistentAttributesManager() {
    return this.input.attributesManager.getPersistentAttributes() || {};
  },
  setSessionAttributes: async function setSessionAttributesManager(attributes) {
    await this.input.attributesManager.setSessionAttributes(attributes);
  },
  setPersistentAttributes: async function setPersistentAttributesManager(player) {
    await this.input.attributesManager.setPersistentAttributes(player);
  },
  savePersistentAttributes: async function setPersistentAttributesManager() {
    await this.input.attributesManager.savePersistentAttributes();
  }
};

Object.setPrototypeOf(LaunchRequestHandler, EventHandlerInput);
Object.setPrototypeOf(PlayGameRequestHandler, EventHandlerInput);
Object.setPrototypeOf(HelpIntentHandler, EventHandlerInput);
Object.setPrototypeOf(CancelAndStopIntentHandler, EventHandlerInput);
Object.setPrototypeOf(SessionEndedRequestHandler, EventHandlerInput);
Object.setPrototypeOf(IntentReflectorHandler, EventHandlerInput);
Object.setPrototypeOf(LeaderboardRequestHandler, EventHandlerInput);


exports.handler = Alexa.SkillBuilders.custom()
  .addRequestHandlers(
    LaunchRequestHandler,
    PlayGameRequestHandler,
    HelpIntentHandler,
    CancelAndStopIntentHandler,
    SessionEndedRequestHandler,
    LeaderboardRequestHandler,
    IntentReflectorHandler)
  .withPersistenceAdapter(persistenceAdapter)
  .addErrorHandlers(
    ErrorHandler)
  .lambda();
