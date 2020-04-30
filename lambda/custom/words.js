/*
 *  ++++++++++++++++++++++++++++++++++++++++++++++++++++++++++++++++++++++++++++++
 *  Copyright 2019 Amazon.com, Inc. or its affiliates. All Rights Reserved.
 *  SPDX-License-Identifier: Apache-2.0
 *  ++++++++++++++++++++++++++++++++++++++++++++++++++++++++++++++++++++++++++++++
 */

const words = [
    'amor',
    'arbol',
    'avión',
    'abeja',
    'abejorro'
];

function getWord() {
    return words[Math.floor(Math.random() * words.length)];
}

module.exports.words = words;
module.exports.getWord = getWord;
