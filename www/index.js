import * as wasm from "test-encryption";
import _ from 'lodash';
import process from 'process';

const benchmark = require('benchmark');
const Benchmark = benchmark.runInContext({ _, process });
window.Benchmark = Benchmark;

Benchmark.options.maxTime = 1;

var divClone;
var dataset = new Map();
const cryptos = ["ChaCha20",
    "Blowfish_cbc",
    "rust-crypto-aes",
    "AES_GCM_SIV",
    "rust-crypto-blowfish"];
const colors =  ['rgba(255, 159, 64, 1)',
    'rgba(54, 162, 235, 1)',
    'rgba(255, 206, 86, 1)',
    'rgba(75, 192, 192, 1)',
    'rgba(153, 102, 255, 1)',
   ];
var whatIsTested = null;
const key_iv_setup_test = () => {
    var key_iv_suite = new Benchmark.Suite;
    var key = document.getElementById("key").value;
    var iv = document.getElementById("iv").value;
    var times = parseInt(document.getElementById("times").value);
    key_iv_suite.on('cycle', function(event) {
        console.log(String(event.target));
    });
    key_iv_suite.add(cryptos[0], function (){
        for (let i = 0; i < times; i++) {
            wasm.c2chacha20_key_iv_setup(key,iv);
        }
    });
    key_iv_suite.add(cryptos[1], function (){
        for (let i = 0; i < times; i++) {
            wasm.blowfish_cbc_key_iv_setup(key,iv);
        }
    });
    key_iv_suite.add(cryptos[2], function (){
        for (let i = 0; i < times; i++) {
            wasm.rust_crypto_aes_key_iv_setup(key,iv);
        }
    });
    key_iv_suite.add(cryptos[3], function (){
        for (let i = 0; i < times; i++) {
            wasm.aes_256_gcm_siv_key_iv_setup(key,iv);
        }
    });
    key_iv_suite.add(cryptos[4], function (){
        for (let i = 0; i < times; i++) {
            wasm.rust_crypto_blowfish_key_iv_setup(key);
        }
    });
    key_iv_suite.on('complete', function() {
        var entry = new Map();
        for (let i = 0; i < this.length; i++) {
            entry.set(this[i].name,this[i].stats.mean);
        }
        dataset.set("key_iv_setup", entry);
    });
    // run async
    key_iv_suite.run({ 'async': true });
}

const encrypt_decrypt_test = () => {
    var key = document.getElementById("key").value;
    var iv = document.getElementById("iv").value;
    var text = document.getElementById("text1").value;
    wasm.aes_256_gcm_siv_encrypt_decrypt(text,key,iv);
    var encrypt_decrypt_suite = new Benchmark.Suite;
    var times = parseInt(document.getElementById("times").value);
    encrypt_decrypt_suite.on('cycle', function(event) {
        console.log(String(event.target));
    });
    encrypt_decrypt_suite.add(cryptos[0], function (){
        for (let i = 0; i < times; i++) {
            wasm.c2chacha20_encrypt_decrypt(text,key,iv);
        }
    });
    encrypt_decrypt_suite.add(cryptos[1], function (){
        for (let i = 0; i < times; i++) {
            wasm.blowfish_cbc_encrypt_decrypt(text,key,iv);
        }
    });
    encrypt_decrypt_suite.add(cryptos[2], function (){
        for (let i = 0; i < times; i++) {
            wasm.rust_crypto_aes_encrypt_decrypt(text,key,iv);
        }
    });
    encrypt_decrypt_suite.add(cryptos[3], function (){
        for (let i = 0; i < times; i++) {
            wasm.aes_256_gcm_siv_encrypt_decrypt(text,key,iv);
        }

    });
    encrypt_decrypt_suite.add(cryptos[4], function (){
        for (let i = 0; i < times; i++) {
            wasm.rust_crypto_blowfish_encrypt_decrypt(text,key);
        }
    });
    encrypt_decrypt_suite.on('complete', function() {
        var entry = new Map();
        for (let i = 0; i < this.length; i++) {
            entry.set(this[i].name, this[i].stats.mean);
        }
        dataset.set(text,entry);
    });
    // run async
    encrypt_decrypt_suite.run({ 'async': true });
}
const testAlphabet = () => {
    whatIsTested = "alphabet";
    var alphabet = "abcdefghijklmnopqrstuvwxyzäöüßABCDEFGHIJKLMNOPQRSTUVWXYZÄÖÜ1234567890!\"#$%&'()*+,-./:;<=>?@[\\]^_`{|}~ ".split("");
    for (let i = 0; i<alphabet.length;i++){
        document.getElementById("text1").value = alphabet[i];
        encrypt_decrypt_test();
    }
    visualizeDataset();
}
const testAlphabet16 = () => {
    whatIsTested = "alphabet";
    var alphabet = "abcdefghijklmnopqrstuvwxyzäöüßABCDEFGHIJKLMNOPQRSTUVWXYZÄÖÜ1234567890!\"#$%&'()*+,-./:;<=>?@[\\]^_`{|}~ ".split("");
    for (let i = 0; i<alphabet.length;i++){
        document.getElementById("text1").value = alphabet[i].repeat(16);
        encrypt_decrypt_test();
    }
    visualizeDataset();
}
const testRandString = () => {
    whatIsTested = "randString";
    var alphabet = "abcdefghijklmnopqrstuvwxyzäöüßABCDEFGHIJKLMNOPQRSTUVWXYZÄÖÜ1234567890!\"#$%&'()*+,-./:;<=>?@[\\]^_`{|}~ ";
    for (let i = 1; i<=64;i++){
        //generate random string
        //source: https://stackoverflow.com/questions/1349404/generate-random-string-characters-in-javascript
        var str = "";
        for (var j = 0; j < i; j++) {
            str += alphabet.charAt(Math.floor(Math.random() * alphabet.length));
        }
        document.getElementById("text1").value = str;
        encrypt_decrypt_test();
    }
    visualizeDataset();
}

const testKeyIVSetup = () => {
    key_iv_setup_test();
    visualizeKeyIVSetup();
}
const visualizeKeyIVSetup = () => {
    var data = [];
    var tmp = dataset.get("key_iv_setup");
    for (let i = 0; i < cryptos.length; i++) {
        data.push(tmp.get(cryptos[i]));
    }
    $("#myChart").replaceWith(divClone.clone());
    var ctx = document.getElementById('myChart').getContext('2d');
    var myChart = new Chart(ctx, {
        type: 'bar',
        data: {
            labels: cryptos,
            datasets: [{
                label: 'avg ms',
                //TODO insert data dynamically
                data: data,
                backgroundColor: [
                    'rgba(255, 99, 132, 0.2)',
                    'rgba(54, 162, 235, 0.2)',
                    'rgba(255, 206, 86, 0.2)',
                    'rgba(75, 192, 192, 0.2)',
                    'rgba(153, 102, 255, 0.2)',
                    'rgba(255, 159, 64, 0.2)'
                ],
                borderColor: [
                    'rgba(255, 99, 132, 1)',
                    'rgba(54, 162, 235, 1)',
                    'rgba(255, 206, 86, 1)',
                    'rgba(75, 192, 192, 1)',
                    'rgba(153, 102, 255, 1)',
                    'rgba(255, 159, 64, 1)'
                ],
                borderWidth: 1
            }]
        },
        options: {
            scales: {
                yAxes: [{
                    ticks: {
                        beginAtZero: true
                    }
                }]
            }
        }
    });

}

//when called there should not be key_iv results in the resultset
const visualizeDataset = () => {
    var data = [];
    var label = [];

    for(let i = 0; i<cryptos.length;i++){
        var tmp = {
            label: cryptos[i],
            backgroundColor: colors[i],
            borderColor: colors[i],
            data: [],
            fill: false,
        };
        data.push(tmp);
    }

    //fill actual data into the data array
    for (var [key, value] of dataset.entries()) {
        console.log(key + ' = ' + value);
        for (let i = 0; i < cryptos.length; i++) {
            data[i].data.push(value.get(data[i].label));
        }
        if(whatIsTested=="alphabet"){
            label.push(key[0]);
        }
        else if (whatIsTested == "randString"){
            label.push(key.length);
        }

    }
    $("#myChart").replaceWith(divClone.clone());
    var ctx = document.getElementById('myChart').getContext('2d');
    var myChart = new Chart(ctx, {
        type: 'line',
        data: {
            labels: label,
            datasets: data
        },
        options: {
            scales: {
                yAxes: [{
                    ticks: {
                        beginAtZero: true
                    }
                }]
            }
        }
    });
}
const testing = () => {
    var key = document.getElementById("key").value;
    var iv = document.getElementById("iv").value;
    var text = document.getElementById("text1").value;
    console.log(wasm.blowfish_cbc_output_size(text,key,iv));
}

$(document).ready(function() {
    divClone = $("#myChart").clone();
    $("#alphabet").click(testAlphabet);
    $("#alphabet16").click(testAlphabet16);
    $("#randString").click(testRandString);
    $("#keyIVSetup").click(testKeyIVSetup);
    $("#testing").click(testing);
});
