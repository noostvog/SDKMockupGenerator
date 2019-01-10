/// <reference path='../typed_definitions/node.d.ts' />
var generator = require('./src/api_generation.js');
var twitter = require('./api_definitions/twitter_small.json')
generator.addDefinition(twitter);
generator.generate();
