const mongoose = require('mongoose');
const fs = require('fs');

const dbRoute = 'mongodb://localhost/kamus-aceh-test';

mongoose.connect(
    dbRoute,
    { useNewUrlParser: true }
);

let db = mongoose.connection;

db.once('open', () => console.log('Connected to MongoDB'));

db.on('error', console.error.bind(console, 'MongoDB connection error:'));

const kataSchema = new mongoose.Schema({
    words: { type: String, required: true },
    word_type: { type: String, required: true },

    // bcs might be more than one translation, store in array
    translations: { type: Array, required: true },
    synonyms: { type: Array },
    examples: { type: Array }
});

const Kata = mongoose.model('Kata', kataSchema);

async function createKata(data) {
    const kata = new Kata(data);

    const result = await kata.save();
    console.log(result);

    // ==== structure how data should be saved in database === 
    // createKata( {
    //     words: 'a',
    //     word_type: 'n',
    //     synonyms: ['b', 'c', 'd'],
    //     translations: ['x', 'y', 'z'],
    //     examples: [
    //         {
    //             word: 'a',
    //             translation: 'b'
    //         }
    //     ]
    // });
}

const spreadData = (params, data, word_type) => {

    if (data.includes( params )){

        let typeRegex = new RegExp(params,"g");

        // split 'words' data and others data
        let words_on_data = data.split(typeRegex);

        // sign index [0] of split result data as 'words' attribute
        let words = words_on_data[0].trim();

        // and sign index [1] as others data
        let words_on_data_other = words_on_data[1];
        

        // then split that others data by ':' 
        // to split 'translations' data and others
        let trans_on_data = words_on_data_other.split(/:/);

        // sign index [0] as 'translations' data and
        // split them by ',' that mean there is more than one translation
        let translations = trans_on_data[0].split(/,/);

        // then sign index [1] as others data
        let trans_on_data_other = trans_on_data[1];

        let examples, synonyms = [];

        let exam_on_data;

        // checking of there any data in index [1] array
        // if it is 'true', it mean there is data 'examples' word
        // and maybe data 'synonyms' to
        if (trans_on_data_other){

            // split data 'examples' and 'synonyms' by '>' notation
            // if there is any synonyms data
            exam_on_data = trans_on_data_other.split(/>/);

            // if there more than one examples that sign and split by ';'
            // then split each one of them and add into an array
            examples = exam_on_data[0].split(/;/);

            // an example contain two data; the word and its translation
            // that sign and split by ',' notation
            // split them by ',' and make them as object:
            // { word: 'example', translation: 'example translation'}
            examples = examples.map( cur => {
                examp = {};

                let examp_on_data = cur.split(/,/);

                examp['word'] = examp_on_data[0].trim();
                examp['translation'] = examp_on_data[1].trim();

                return examp;

            });

            // if there any data as index [1] on array elements
            // it means there is 'synonyms' data
            // split it by ',' if there is more than synonyms data
            // that sign by ',' notations
            if ( exam_on_data[1] ) {
                synonyms = exam_on_data[1]
                    .split(/,/)
                    .map( cur => cur.trim() );
            }

        }

        // checking if word include ',' that mean there more than one word
        // if "true", add them all into different rows in the database
        // if "false" add them in one rows in the database
        if (words.includes(',')) {
            
            // split each 'word' by ',' bcs them will saved as different word
            words = words.split(/,/).map(cur => cur.trim());

            // add all 'words' as synonyms of the each all of them
            synonyms = synonyms.concat(words);
            
            words.forEach( word => {
                
                // remove itself 'word' from 'synonyms' array
                // because them can't be synonyms to theirself
                let synonyms_filtered = synonyms.filter((value) => {
                    return value !== word;                
                });

                // because earlier synonyms is concated beetween synonyms
                // itself and 'words' array, maybe there duplcate word
                // so each element of array unique
                synonyms_filtered = [...new Set(synonyms_filtered)];
                
                // save data to the database
                createKata({
                    words: word,
                    word_type: word_type,
                    translations: translations,
                    synonyms: synonyms_filtered,
                    examples: examples
                });
            });

        }
        else{
            
            // save data to the database
            createKata({
                words: words,
                word_type: word_type,
                translations: translations,
                synonyms: synonyms,
                examples: examples
            });
        };

    };
}

function readFileTxt(file) {
    fs.readFile(file, 'utf-8', (err, data) => {
        if (!err) {

            // split them by "new" word that mean it is a different data
            // put each one of them (data) as different array element
            let res = data.toString().split(/new/);
            
            // loop all of array element and check all of them to process 1 by 1
            res.forEach( cur => {
                let data = cur.trim();

                spreadData(' noun ', data, 'kata benda');

                spreadData(' verb ', data, 'kata kerja');

                spreadData(' adjective ', data, 'kata sifat');

                spreadData(' adverb ', data, 'kata keterangan');

                spreadData(' partikel ', data), 'kata sandang';
            });

        } else console.log(err);
    });
}

readFileTxt('test.txt');